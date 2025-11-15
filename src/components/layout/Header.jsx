'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { useSelector } from '../../redux/useSelectorSafe';
import { useDispatch } from '../../redux/useDispatchSafe';
import { logout as logoutAction } from '../../redux/slices/authslice';
import { useRouter } from 'next/navigation';
import { ensureFirebaseMessaging, requestFcmToken } from '../../lib/firebaseClient';
import axios from 'axios';
import { prodServerUrl } from '../../global/server';
import Image from 'next/image';

export default function Header({ onLoginClick }) {
 const [searchQuery, setSearchQuery] = useState('');
 const { toggleSidebar, theme, toggleTheme } = useApp();
 const auth = useSelector((s) => s.auth, { isAuthenticated: false, accessToken: null });
 const isLoggedIn = !!auth?.isAuthenticated;
 const dispatch = useDispatch();
 const router = useRouter();
 const [userMenuOpen, setUserMenuOpen] = useState(false);
 const [addMenuOpen, setAddMenuOpen] = useState(false);
 const addMenuRef = useRef(null);

 useEffect(() => {
  function onDocClick(e) {
   if (!addMenuRef.current) return;
   if (!addMenuRef.current.contains(e.target)) setAddMenuOpen(false);
  }
  document.addEventListener('click', onDocClick);
  return () => document.removeEventListener('click', onDocClick);
 }, []);

 const handleLogout = () => {
  dispatch(logoutAction());
  router.push('/');
 };

 const [query, setQuery] = useState('');

 const handleSearch = (e) => {
  e?.preventDefault?.();
  const q = String(query || '').trim();
  if (!q) return;
  router.push(`/search?q=${encodeURIComponent(q)}`);
 };

 // Register FCM token when user is logged in
 useEffect(() => {
  let cancelled = false;
  async function register() {
   if (!isLoggedIn || !auth?.accessToken) return;
   try {
    await ensureFirebaseMessaging();
    const token = await requestFcmToken(undefined, { forceRefresh: true });
    if (!token || cancelled) return;
    await axios.post(`${prodServerUrl}/push/register-token`, { token, platform: 'web' }, { headers: { 'x-auth-token': auth.accessToken } });
   } catch (_) {}
  }
  register();
  return () => { cancelled = true; };
 }, [isLoggedIn, auth?.accessToken]);

 // Ask notification permission for visitors who are not logged in
 useEffect(() => {
  let cancelled = false;
  async function askPermissionForGuests() {
   if (isLoggedIn) return; // logged-in flow handles it above
   try {
    await ensureFirebaseMessaging();
    const token = await requestFcmToken(undefined, { forceRefresh: true });
    if (!token || cancelled) return;
    try {
     await axios.post(`${prodServerUrl}/push/register-token-guest`, { token, platform: 'web' });
    } catch (_) {}
   } catch (_) {}
  }
  askPermissionForGuests();
  return () => { cancelled = true; };
 }, [isLoggedIn]);

 return (
  <header className="sticky top-0 z-50 glass border-b border-gray-200/50 backdrop-blur-xl bg-white/80">
   <div className="flex items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
    {/* Left Section: Menu + Logo */}
    <div className="flex items-center space-x-4">
     {/* Menu Button */}
     <button
      onClick={toggleSidebar}
      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:ring-offset-2"
      aria-label="Toggle sidebar"
     >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
     </button>

     {/* Logo */}
     <Link href="/" className="flex items-center space-x-3 group">
      <Image 
       src={'/logo.png'}
       width={100}
       height={100}
       alt="RankHub - SEO Community Forum Logo"
      />
     </Link>
    </div>

    {/* Search Bar - Enhanced */}
    <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-4 lg:mx-8 hidden md:block">
     <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
       <svg className="h-5 w-5 text-gray-400 group-focus-within:text-[#C96442] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
       </svg>
      </div>
      <input
       type="text"
       placeholder="Search blogs, questions, authors..."
       value={query}
       onChange={(e) => setQuery(e.target.value)}
       className="w-full pl-12 pr-24 py-3 bg-gray-50/80 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent focus:bg-white transition-all duration-200 placeholder:text-gray-400"
      />
      <button
       type="submit"
       className="absolute inset-y-0 right-0 px-4 m-1.5 text-black cursor-pointer transition-all duration-200 flex items-center font-medium text-sm shadow-sm hover:shadow-md focus:outline-none"
       aria-label="Search"
      >
       <span className="hidden sm:inline">Search</span>
       <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
       </svg>
      </button>
     </div>
    </form>

    {/* Right Side Actions */}
    <div className="flex items-center space-x-3">
     {/* Desktop Add Post Button with menu */}
     <div className="relative hidden lg:block" ref={addMenuRef}>
      <button
       onClick={() => setAddMenuOpen((v) => !v)}
       className="bg-gradient-to-r from-[#C96442] to-[#B85538] text-white px-4 py-2.5 items-center space-x-2 hover:shadow-lg transition-all duration-200 flex font-medium shadow-md hover:scale-[1.02] focus:outline-none"
      >
       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
       </svg>
       <span>Create</span>
       <svg className={`w-4 h-4 transition-transform duration-200 ${addMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
       </svg>
      </button>
      {addMenuOpen && (
       <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 shadow-xl p-2 z-50 scale-in">
        <Link
         href="/publish-blog"
         onClick={() => setAddMenuOpen(false)}
         className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium group"
        >
         <div className="p-2 bg-blue-50 group-hover:bg-blue-100 transition-colors">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
         </div>
         <div>
          <div className="font-semibold">Create Blog</div>
          <div className="text-xs text-gray-500">Share your SEO insights</div>
         </div>
        </Link>
        <Link
         href="/ask-question"
         onClick={() => setAddMenuOpen(false)}
         className="mt-1 flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium group"
        >
         <div className="p-2 bg-green-50 group-hover:bg-green-100 transition-colors">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
         </div>
         <div>
          <div className="font-semibold">Ask Question</div>
          <div className="text-xs text-gray-500">Get help from the community</div>
         </div>
        </Link>
       </div>
      )}
     </div>
     
     {isLoggedIn ? (
      <div className="relative">
       <button
        onClick={() => setUserMenuOpen((v) => !v)}
        className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-all duration-200 text-sm sm:text-base px-4 py-2.5 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:ring-offset-2"
        aria-haspopup="menu"
        aria-expanded={userMenuOpen ? 'true' : 'false'}
       >
        <span className="max-w-[140px] truncate">{auth?.fullName || 'User'}</span>
        <svg className={`w-4 h-4 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
       </button>
       {userMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 shadow-xl py-2 z-50 scale-in">
         <Link
          href="/profile"
          onClick={() => setUserMenuOpen(false)}
          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
         >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Profile</span>
         </Link>
         <button
          onClick={() => { setUserMenuOpen(false); handleLogout(); }}
          className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
         >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Logout</span>
         </button>
        </div>
       )}
      </div>
     ) : (
      <Link 
       href="/login"
       className="text-black border-2 border-black text-sm sm:text-base px-4 py-2.5 shadow-md hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:ring-offset-2"
      >
       <span className="hidden sm:inline">Sign In</span>
       <span className="sm:hidden">Login</span>
      </Link>
     )}
    </div>
   </div>
  </header>
 );
}


