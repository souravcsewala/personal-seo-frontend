'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { useDispatch } from '../redux/useDispatchSafe';
import { login as loginAction } from '../redux/slices/authslice';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { prodServerUrl } from '../global/server';

export default function Login() {
 const router = useRouter();
 const dispatch = useDispatch();
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [error, setError] = useState('');
 const [formData, setFormData] = useState({ email: '', password: '' });
 const [showPassword, setShowPassword] = useState(false);

 const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData((prev) => ({ ...prev, [name]: value }));
 };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setIsSubmitting(true);
  try {
   const { data } = await axios.post(`${prodServerUrl}/auth/user-login`, {
    email: formData.email,
    password: formData.password,
   });
   if (!data?.success) throw new Error(data?.message || 'Login failed');
   // Store in redux
   dispatch(loginAction(data));
   router.push('/');
  } catch (err) {
   setError(err?.response?.data?.message || err.message || 'Something went wrong');
  } finally {
   setIsSubmitting(false);
  }
 };

 return (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
   <Header />
   <div className="flex">
    <Sidebar />
    <main className="flex-1 p-6 flex items-center justify-center">
     <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 md:p-10 fade-in">
       {/* Logo & Header */}
       <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#C96442] to-[#A54F35] rounded-2xl mb-4 shadow-lg">
         <span className="text-white font-bold text-2xl">S</span>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
         Welcome Back
        </h1>
        <p className="text-gray-600">Sign in to continue to RankHub</p>
       </div>

       {error && (
        <div className="mb-6 p-4 border-2 border-red-200 bg-red-50 text-red-700 text-sm flex items-center space-x-2">
         <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
         </svg>
         <span>{error}</span>
        </div>
       )}

       <form onSubmit={handleSubmit} className="space-y-6">
        <div>
         <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
         <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
           <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
           </svg>
          </div>
          <input
           type="email"
           name="email"
           value={formData.email}
           onChange={handleChange}
           required
           placeholder="you@example.com"
           className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
          />
         </div>
        </div>
        
        <div>
         <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
         <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
           <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
           </svg>
          </div>
          <input
           type={showPassword ? 'text' : 'password'}
           name="password"
           value={formData.password}
           onChange={handleChange}
           required
           placeholder="Enter your password"
           className="w-full pl-12 pr-20 py-3 border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
          />
          <button
           type="button"
           onClick={() => setShowPassword((prev) => !prev)}
           className="absolute inset-y-0 right-0 px-4 text-sm font-medium text-[#C96442] hover:text-[#B85538] transition-colors"
           aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
           {showPassword ? 'Hide' : 'Show'}
          </button>
         </div>
        </div>

        <button
         disabled={isSubmitting}
         type="submit"
         className="w-full px-6 py-3.5 bg-gradient-to-r from-[#C96442] to-[#B85538] text-white font-semibold hover:from-[#B85538] hover:to-[#A54F35] transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2"
        >
         {isSubmitting ? (
          <>
           <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
           </svg>
           <span>Signing in...</span>
          </>
         ) : (
          <>
           <span>Sign In</span>
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
           </svg>
          </>
         )}
        </button>
       </form>

       <div className="mt-8 pt-6 border-t border-gray-200 text-center">
        <span className="text-sm text-gray-600">Don't have an account? </span>
        <Link href="/register" className="text-sm font-semibold text-[#C96442] hover:text-[#B85538] transition-colors">
         Create Account →
        </Link>
       </div>
      </div>
     </div>
    </main>
   </div>
  </div>
 );
}


