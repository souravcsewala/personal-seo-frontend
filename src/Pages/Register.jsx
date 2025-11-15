'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { prodServerUrl } from '../global/server';
import LoadingIndicator from '../components/common/LoadingIndicator';

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
 const [otpToken, setOtpToken] = useState('');
 const [otp, setOtp] = useState('');
 const [secondsLeft, setSecondsLeft] = useState(120);
 const [resendCooldown, setResendCooldown] = useState(0);
 const emailRef = useRef('');
 const categoriesLoading = !Array.isArray(categories) || categories.length === 0;

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
   setOtpToken(data?.token || '');
   emailRef.current = formData.email;
   setStage('otp');
   setSecondsLeft(120);
   setResendCooldown(0);
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
   const payload = otpToken ? { email: emailRef.current, otp, token: otpToken } : { email: emailRef.current, otp };
   const { data } = await axios.post(`${prodServerUrl}/auth/register-otp/verify`, payload);
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
  if (secondsLeft > 0) return;
  try {
   const { data } = await axios.post(`${prodServerUrl}/auth/register-otp/resend`, { email: emailRef.current });
   setSecondsLeft(120);
   setResendCooldown(0);
   setOtpToken(data?.token || ''); // replace token if backend returned a new one
  } catch (err) {
   setError(err?.response?.data?.message || err.message || 'Could not resend');
  }
 };

 return (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
   <Header onLoginClick={() => setShowLoginModal(true)} />
   <div className="flex">
    <Sidebar />
    <main className="flex-1 p-6">
     <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 p-8 md:p-10 fade-in">
      {/* Header */}
      <div className="text-center mb-8">
       <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#C96442] to-[#A54F35] rounded-2xl mb-4 shadow-lg">
        <span className="text-white font-bold text-2xl">S</span>
       </div>
       <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
        {stage === 'form' ? 'Create Your Account' : 'Verify Your Email'}
       </h1>
       <p className="text-gray-600">
        {stage === 'form' 
         ? 'Join RankHub and personalize your feed by selecting categories you care about.' 
         : `We sent a 6-digit code to ${emailRef.current}. It expires in 2 minutes.`}
       </p>
      </div>

      {error && (
       <div className="mb-6 p-4 border-2 border-red-200 bg-red-50 text-red-700 text-sm flex items-center space-x-2">
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{error}</span>
       </div>
      )}

      {stage === 'form' && (
      <form onSubmit={handleSubmit} className="space-y-6">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
         <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
         <input 
          name="fullname" 
          value={formData.fullname} 
          onChange={handleChange} 
          required 
          placeholder="John Doe"
          className="w-full px-4 py-3 border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white" 
         />
        </div>
        <div>
         <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
         <input 
          name="phone" 
          value={formData.phone} 
          onChange={handleChange} 
          required 
          placeholder="+1 234 567 8900"
          className="w-full px-4 py-3 border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white" 
         />
        </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
         <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
         <input 
          type="email" 
          placeholder="you@example.com" 
          name="email" 
          value={formData.email} 
          onChange={handleChange} 
          required 
          className="w-full px-4 py-3 border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white" 
         />
        </div>
        <div>
         <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
         <div className="relative">
          <input 
           type={showPassword ? 'text' : 'password'} 
           name="password" 
           value={formData.password} 
           onChange={handleChange} 
           required 
           placeholder="Create a strong password"
           className="w-full px-4 py-3 pr-16 border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white" 
          />
          <button 
           type="button" 
           onClick={() => setShowPassword((p) => !p)} 
           className="absolute inset-y-0 right-0 px-4 text-sm font-medium text-[#C96442] hover:text-[#B85538] transition-colors" 
           aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
           {showPassword ? 'Hide' : 'Show'}
          </button>
         </div>
        </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
         <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
         <div className="relative">
          <input 
           type={showConfirmPassword ? 'text' : 'password'} 
           name="confirmPassword" 
           value={formData.confirmPassword} 
           onChange={handleChange} 
           required 
           placeholder="Confirm your password"
           className="w-full px-4 py-3 pr-16 border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white" 
          />
          <button 
           type="button" 
           onClick={() => setShowConfirmPassword((p) => !p)} 
           className="absolute inset-y-0 right-0 px-4 text-sm font-medium text-[#C96442] hover:text-[#B85538] transition-colors" 
           aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
           {showConfirmPassword ? 'Hide' : 'Show'}
          </button>
         </div>
        </div>
        <div className="hidden md:block" />
       </div>

       {/* Bio, Website, Social Link, Location removed from registration. These can be edited in Profile later. */}

       <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">Profile Image (optional)</label>
        <div className="border-2 border-dashed border-gray-300 p-8 text-center hover:border-[#C96442] transition-colors bg-gray-50">
         {imagePreview ? (
          <div className="space-y-4">
           <img
            src={imagePreview}
            alt="Profile preview"
            className="w-32 h-32 mx-auto object-cover border-4 border-white shadow-lg"
           />
           <div className="flex items-center justify-center gap-3">
            <button
             type="button"
             onClick={() => { setProfileImage(null); setImagePreview(''); }}
             className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
            >
             Remove Image
            </button>
           </div>
          </div>
         ) : (
          <div>
           <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
           </div>
           <p className="text-gray-600 mb-3 font-medium">Upload a profile image</p>
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
            className="inline-block bg-gradient-to-r from-[#C96442] to-[#B85538] text-white px-6 py-2.5 hover:from-[#B85538] hover:to-[#A54F35] transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer font-medium"
           >
            Choose Image
           </label>
           <p className="text-xs text-gray-500 mt-3">JPG, PNG up to 5MB</p>
          </div>
         )}
        </div>
       </div>

       <div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Select Your Categories</h3>
        <p className="text-sm text-gray-600 mb-4">Choose at least one category to personalize your feed.</p>
        {categoriesLoading ? (
         <div className="py-6"><LoadingIndicator /></div>
        ) : (
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map((cat) => (
           <button
            key={cat._id}
            type="button"
            onClick={() => toggleCategory(cat._id)}
            className={`flex items-center justify-between px-4 py-3 border-2 text-sm font-medium transition-all duration-200 ${
             selectedCategoryIds.includes(cat._id) 
              ? 'border-[#C96442] bg-gradient-to-r from-[#C96442]/10 to-[#C96442]/5 text-[#C96442] shadow-sm' 
              : 'border-gray-200 text-gray-700 hover:border-[#C96442]/50 hover:bg-gray-50'
            }`}
           >
            <span>{cat.name}</span>
            {selectedCategoryIds.includes(cat._id) && (
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
             </svg>
            )}
           </button>
          ))}
         </div>
        )}
       </div>

       <div className="flex justify-end pt-4">
        <button 
         disabled={isSubmitting || categoriesLoading} 
         type="submit" 
         className="px-8 py-3 bg-gradient-to-r from-[#C96442] to-[#B85538] text-white hover:from-[#B85538] hover:to-[#A54F35] transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 font-semibold flex items-center space-x-2"
        >
         {isSubmitting ? (
          <>
           <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
           </svg>
           <span>Creating...</span>
          </>
         ) : (
          <>
           <span>Create Account</span>
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
           </svg>
          </>
         )}
        </button>
       </div>
      </form>
      )}

      {stage === 'otp' && (
       <form onSubmit={handleVerifyOtp} className="space-y-6">
        <div>
         <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">Enter 6-digit verification code</label>
         <input
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0,6))}
          className="w-full px-4 py-4 border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent tracking-[0.5em] text-center text-2xl font-bold bg-gray-50 focus:bg-white transition-all duration-200"
          placeholder="000000"
          autoFocus
         />
         <div className="mt-4 text-sm text-gray-600 flex items-center justify-center gap-3">
          <div className="flex items-center space-x-2">
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
           <span className="font-medium">Expires in {Math.floor(secondsLeft/60)}:{String(secondsLeft%60).padStart(2,'0')}</span>
          </div>
          {secondsLeft === 0 && (
           <>
            <span aria-hidden className="text-gray-400">•</span>
            <button type="button" onClick={handleResend} className="text-[#C96442] hover:text-[#B85538] font-semibold transition-colors">
             Resend code
            </button>
           </>
          )}
         </div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
         <button 
          type="button" 
          onClick={() => { setStage('form'); setOtp(''); }} 
          className="px-6 py-3 border-2 border-gray-300 hover:bg-gray-50 transition-colors font-medium"
         >
          Back
         </button>
         <button 
          disabled={isSubmitting} 
          type="submit" 
          className="px-8 py-3 bg-gradient-to-r from-[#C96442] to-[#B85538] text-white hover:from-[#B85538] hover:to-[#A54F35] transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 font-semibold flex items-center space-x-2"
         >
          {isSubmitting ? (
           <>
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Verifying...</span>
           </>
          ) : (
           <>
            <span>Verify & Create Account</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
           </>
          )}
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


