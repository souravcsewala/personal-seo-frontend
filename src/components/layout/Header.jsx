'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { useSelector, useDispatch } from 'react-redux';
import { logout as logoutAction } from '../../redux/slices/authslice';
import { useRouter } from 'next/navigation';
import { ensureFirebaseMessaging, requestFcmToken } from '../../lib/firebaseClient';
import axios from 'axios';
import { prodServerUrl } from '../../global/server';

export default function Header({ onLoginClick }) {
  const [searchQuery, setSearchQuery] = useState('');
  const { toggleSidebar, theme, toggleTheme } = useApp();
  const auth = useSelector((s) => s.auth);
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
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Menu Button */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#C96442] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">SEOHub</span>
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-8 hidden md:block">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search blogs by title, meta, author..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-14 py-3 bg-[#C96442]/10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent"
            />
            <button
              type="submit"
              className="absolute inset-y-0 right-0 px-3 m-1 rounded-md text-gray-700 hover:text-white hover:bg-[#C96442] transition-colors cursor-pointer flex items-center"
              aria-label="Search"
            >
              <span className="text-sm font-medium">Search</span>
            </button>
          </div>
        </form>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle (disabled)
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle dark mode"
            title="Toggle theme"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          </button>
          */}
          {/* Desktop Add Post Button with menu */}
          <div className="relative hidden lg:block" ref={addMenuRef}>
            <button
              onClick={() => setAddMenuOpen((v) => !v)}
              className="bg-[#C96442] text-white px-4 py-2 rounded-lg items-center space-x-2 hover:bg-[#C96442]/90 transition-colors flex"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add Post</span>
              <svg className={`w-4 h-4 ml-2 transition-transform ${addMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {addMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50">
                <Link
                  href="/publish-blog"
                  onClick={() => setAddMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-semibold"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Create Blog</span>
                </Link>
                <Link
                  href="/ask-question"
                  onClick={() => setAddMenuOpen(false)}
                  className="mt-1 flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-semibold"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Create Question</span>
                </Link>
              </div>
            )}
          </div>
          
          {isLoggedIn ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="bg-[#F3F5F7] hover:bg-[#E9EBEF] text-gray-700 font-medium transition-colors text-sm sm:text-base px-4 py-2 rounded-lg flex items-center gap-2"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen ? 'true' : 'false'}
              >
                <span className="max-w-[140px] truncate">{auth?.fullName || 'User'}</span>
                <svg className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                  <button
                    onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link 
              href="/login"
              className="bg-[#F3F5F7] hover:bg-[#C96442] text-gray-700 hover:text-white font-medium transition-colors text-sm sm:text-base px-4 py-2 rounded-lg"
            >
              <span className="hidden sm:inline">Create Account / Login</span>
              <span className="sm:hidden">Login</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}


