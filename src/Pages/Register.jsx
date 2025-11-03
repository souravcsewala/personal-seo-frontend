'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { prodServerUrl } from '../global/server';

export default function Register({ categories = [] }) {
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    bio: '',
    socialLink: '',
    location: '',
    website: '',
  });
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [stage, setStage] = useState('form'); // 'form' | 'otp'
  const [otp, setOtp] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [resendCooldown, setResendCooldown] = useState(0);
  const emailRef = useRef('');

  const toggleCategory = (id) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.password || formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    // Website/Social link removed from registration; validate later in profile
    if (selectedCategoryIds.length === 0) {
      setError('Please select at least one category.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        fullname: formData.fullname,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        bio: formData.bio || undefined,
        socialLink: formData.socialLink || undefined,
        location: formData.location || undefined,
        website: formData.website || undefined,
        interested_topic: selectedCategoryIds.join(','),
      };
      const { data } = await axios.post(`${prodServerUrl}/auth/register-otp/request`, payload);
      if (!data?.success) throw new Error(data?.message || 'Could not send code');
      emailRef.current = formData.email;
      setStage('otp');
      setSecondsLeft(120);
      setResendCooldown(30);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  // countdown timers
  useEffect(() => {
    if (stage !== 'otp') return;
    setSecondsLeft((s) => s);
    const t = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
      setResendCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [stage]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp || otp.length !== 6) {
      setError('Enter the 6-digit code.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { data } = await axios.post(`${prodServerUrl}/auth/register-otp/verify`, { email: emailRef.current, otp });
      if (!data?.success) throw new Error(data?.message || 'Verification failed');
      alert('Verification successful. You can now log in.');
      router.push('/');
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await axios.post(`${prodServerUrl}/auth/register-otp/resend`, { email: emailRef.current });
      setSecondsLeft(120);
      setResendCooldown(30);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Could not resend');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLoginClick={() => setShowLoginModal(true)} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{stage === 'form' ? 'Create Account' : 'Verify Email'}</h1>
            <p className="text-gray-600 mb-6">{stage === 'form' ? 'Join SEOHub and personalize your feed by selecting categories you care about.' : `We sent a 6-digit code to ${emailRef.current}. It expires in 2 minutes.`}</p>

            {error && (
              <div className="mb-4 p-3 rounded border border-red-300 bg-red-50 text-red-700 text-sm">{error}</div>
            )}

            {stage === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input name="fullname" value={formData.fullname} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C96442] focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C96442] focus:border-transparent" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" placeholder="Enter valid mail id for OTP" name="email" value={formData.email} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C96442] focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C96442] focus:border-transparent" />
                    <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute inset-y-0 right-0 px-3 text-sm text-gray-600 hover:text-gray-800" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <div className="relative">
                    <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C96442] focus:border-transparent" />
                    <button type="button" onClick={() => setShowConfirmPassword((p) => !p)} className="absolute inset-y-0 right-0 px-3 text-sm text-gray-600 hover:text-gray-800" aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                <div className="hidden md:block" />
              </div>

              {/* Bio, Website, Social Link, Location removed from registration. These can be edited in Profile later. */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image (optional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img
                        src={imagePreview}
                        alt="Profile preview"
                        className="max-h-40 mx-auto rounded-full object-cover"
                      />
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => { setProfileImage(null); setImagePreview(''); }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-600 mb-2">Upload a profile image</p>
                      <input
                        id="registerProfileImage"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setProfileImage(file);
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => setImagePreview(ev.target?.result || '');
                            reader.readAsDataURL(file);
                          } else {
                            setImagePreview('');
                          }
                        }}
                        className="hidden"
                      />
                      <label
                        htmlFor="registerProfileImage"
                        className="bg-[#C96442] text-white px-4 py-2 rounded-lg hover:bg-[#C96442]/90 transition-colors cursor-pointer"
                      >
                        Choose Image
                      </label>
                      <p className="text-xs text-gray-500 mt-2">JPG, PNG up to 5MB.</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Your Categories</h3>
                <p className="text-sm text-gray-600 mb-3">Choose at least one category to personalize your feed.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat._id}
                      type="button"
                      onClick={() => toggleCategory(cat._id)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${selectedCategoryIds.includes(cat._id) ? 'border-[#C96442] bg-[#C96442]/10 text-[#C96442]' : 'border-gray-200 text-gray-800 hover:border-[#C96442]/40'}`}
                    >
                      <span>{cat.name}</span>
                      {selectedCategoryIds.includes(cat._id) && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button disabled={isSubmitting} type="submit" className="px-6 py-2 bg-[#C96442] text-white rounded-lg hover:bg-[#C96442]/90 transition-colors cursor-pointer disabled:opacity-60">
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
            )}

            {stage === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enter 6-digit code</label>
                  <input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0,6))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C96442] focus:border-transparent tracking-widest text-center text-lg"
                    placeholder="______"
                    autoFocus
                  />
                  <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                    <span>Expires in {Math.floor(secondsLeft/60)}:{String(secondsLeft%60).padStart(2,'0')}</span>
                    <span aria-hidden>|</span>
                    <button type="button" onClick={handleResend} disabled={resendCooldown>0} className="text-[#C96442] disabled:text-gray-400">{resendCooldown>0?`Resend in ${resendCooldown}s`:'Resend code'}</button>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => { setStage('form'); setOtp(''); }} className="px-6 py-2 border border-gray-300 rounded-lg">Back</button>
                  <button disabled={isSubmitting} type="submit" className="px-6 py-2 bg-[#C96442] text-white rounded-lg hover:bg-[#C96442]/90 transition-colors cursor-pointer disabled:opacity-60">
                    {isSubmitting ? 'Verifying...' : 'Verify & Create Account'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}


