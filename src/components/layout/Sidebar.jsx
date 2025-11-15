'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { useSelector } from '../../redux/useSelectorSafe';
import axios from 'axios';
import { prodServerUrl } from '../../global/server';
import Image from 'next/image';

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, closeSidebar } = useApp();
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showPostsApproval, setShowPostsApproval] = useState(false);
  const auth = useSelector((s) => s.auth, { isAuthenticated: false, accessToken: null });
  // derive isLoggedIn from redux or localStorage (for refreshes)
  const isLoggedIn = (() => {
    if (auth?.isAuthenticated && auth?.accessToken) return true;
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('authState') : null;
      const stored = raw ? JSON.parse(raw) : null;
      return !!(stored && stored.accessToken);
    } catch (_) { return false; }
  })();
  const role = auth?.user?.role || auth?.role || '';
  const isAdmin = String(role).toLowerCase() === 'admin';

  const isActive = (path) => pathname === path;

  // Only close sidebar on mobile when link is clicked
  const handleLinkClick = () => {
    // Check if we're on mobile (screen width < 1024px)
    if (window.innerWidth < 1024) {
      closeSidebar();
    }
  };

  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [trendingItems, setTrendingItems] = useState([]);
  // Removed inline followers/following preview; we link to a dedicated page instead

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const [catsRes, trendRes] = await Promise.all([
          axios.get(`${prodServerUrl}/get-all-category`, { params: { limit: 100 } }),
          axios.get(`${prodServerUrl}/feed/trending`, { params: { limit: 5 } })
        ]);

        const cats = Array.isArray(catsRes?.data?.data) ? catsRes.data.data : [];
        if (!cancelled) {
          const mappedAll = cats.map((c) => ({ name: c?.name, _id: c?._id }));
          setAllCategories(mappedAll);
          setCategories(mappedAll.slice(0, 4));
        }

        const trend = Array.isArray(trendRes?.data?.data) ? trendRes.data.data : [];
        if (!cancelled) setTrendingItems(trend);
      } catch (_) { }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  // No social preview fetching here

  return (
    <>
      {/* Overlay - only show on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
    fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 min-h-screen shadow-xl
    transform transition-all duration-300 ease-in-out
    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
   `}>
        {/* Close button - fixed position */}
        <button
          onClick={closeSidebar}
          className="absolute top-4 right-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 z-10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:ring-offset-2"
          aria-label="Close sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Scrollable content container */}
        <div className="h-full overflow-y-auto p-6">

          {/* Site Logo */}
          <div className="mb-8">
            <Link href="/" onClick={handleLinkClick} className="flex items-center space-x-3 group">
              <Image
                src={'/logo.png'}
                width={100}
                height={100}
                alt="RankHub - SEO Community Forum Logo"
              />
            </Link>
          </div>

          <nav className="space-y-8">
            {/* Main Navigation */}
            <div className="space-y-1.5">
              <Link
                href="/"
                onClick={handleLinkClick}
                className={`flex items-center space-x-3 px-4 py-3 transition-all duration-200 group ${isActive('/')
                    ? 'bg-gradient-to-r from-[#C96442]/10 to-[#C96442]/5 text-[#C96442] shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-[#C96442]'
                  }`}
              >
                <div className={`p-1.5 ${isActive('/') ? 'bg-[#C96442]/20' : 'group-hover:bg-gray-100'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <span className="font-semibold">Home</span>
              </Link>

              {isLoggedIn && (
                <>
                  <Link
                    href="/profile"
                    onClick={handleLinkClick}
                    className={`flex items-center space-x-3 px-4 py-3 transition-all duration-200 group ${isActive('/profile')
                        ? 'bg-gradient-to-r from-[#C96442]/10 to-[#C96442]/5 text-[#C96442] shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-[#C96442]'
                      }`}
                  >
                    <div className={`p-1.5 ${isActive('/profile') ? 'bg-[#C96442]/20' : 'group-hover:bg-gray-100'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="font-semibold">Profile</span>
                  </Link>
                  <Link
                    href="/network"
                    onClick={handleLinkClick}
                    className={`flex items-center space-x-3 px-4 py-3 transition-all duration-200 group ${isActive('/network')
                        ? 'bg-gradient-to-r from-[#C96442]/10 to-[#C96442]/5 text-[#C96442] shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-[#C96442]'
                      }`}
                  >
                    <div className={`p-1.5 ${isActive('/network') ? 'bg-[#C96442]/20' : 'group-hover:bg-gray-100'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-6.13a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <span className="font-semibold">Your Network</span>
                  </Link>
                </>
              )}

              {!isAdmin && (
                <Link
                  href="/saved"
                  onClick={handleLinkClick}
                  className={`flex items-center space-x-3 px-4 py-3 transition-all duration-200 group ${isActive('/saved')
                      ? 'bg-gradient-to-r from-[#C96442]/10 to-[#C96442]/5 text-[#C96442] shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-[#C96442]'
                    }`}
                >
                  <div className={`p-1.5 ${isActive('/saved') ? 'bg-[#C96442]/20' : 'group-hover:bg-gray-100'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v14l-7-4-7 4V5z" />
                    </svg>
                  </div>
                  <span className="font-semibold">Saved Posts</span>
                </Link>
              )}

            </div>

            {/* Your Network preview removed; use the link above */}

            {/* Create Content Section */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-4">
                CREATE CONTENT
              </h3>
              <div className="space-y-1.5">
                <Link
                  href="/publish-blog"
                  onClick={(e) => {
                    try {
                      const raw = typeof window !== 'undefined' ? localStorage.getItem('authState') : null;
                      const stored = raw ? JSON.parse(raw) : null;
                      const hasToken = !!(isLoggedIn || (stored && stored.accessToken));
                      if (!hasToken) {
                        e.preventDefault?.();
                        closeSidebar();
                        window.location.href = '/login';
                        return;
                      }
                    } catch (_) {}
                    handleLinkClick();
                  }}
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 group"
                >
                  <div className="p-1.5 bg-blue-100 group-hover:bg-blue-200 transition-colors">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="font-semibold">Publish Blog</span>
                </Link>
                <Link
                  href="/ask-question"
                  onClick={(e) => {
                    try {
                      const raw = typeof window !== 'undefined' ? localStorage.getItem('authState') : null;
                      const stored = raw ? JSON.parse(raw) : null;
                      const hasToken = !!(isLoggedIn || (stored && stored.accessToken));
                      if (!hasToken) {
                        e.preventDefault?.();
                        closeSidebar();
                        window.location.href = '/login';
                        return;
                      }
                    } catch (_) {}
                    handleLinkClick();
                  }}
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all duration-200 group"
                >
                  <div className="p-1.5 bg-green-100 group-hover:bg-green-200 transition-colors">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="font-semibold">Ask Question</span>
                </Link>
                {/*
      <Link 
       href="/create-poll" 
       onClick={handleLinkClick}
       className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
      >
       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
       </svg>
       <span className="font-medium">Create Poll</span>
      </Link>
      */}

              </div>
            </div>

            {/* Admin Section */}
            {isAdmin && (
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-4">
                  ADMIN
                </h3>
                <div className="space-y-1.5">
                  <Link
                    href="/admin"
                    onClick={handleLinkClick}
                    className={`flex items-center space-x-3 px-4 py-3 transition-all duration-200 group ${isActive('/admin')
                        ? 'bg-gradient-to-r from-[#C96442]/10 to-[#C96442]/5 text-[#C96442] shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-[#C96442]'
                      }`}
                  >
                    <div className={`p-1.5 ${isActive('/admin') ? 'bg-[#C96442]/20' : 'group-hover:bg-gray-100'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
                      </svg>
                    </div>
                    <span className="font-semibold">Dashboard</span>
                  </Link>

                  {/* Posts Approval dropdown */}
                  <div className="relative group">
                    <button
                      onClick={() => setShowPostsApproval(!showPostsApproval)}
                      className="w-full flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h7" />
                        </svg>
                        <span className="font-medium">Posts Approval</span>
                      </div>
                      <svg className={`w-4 h-4 text-gray-500 transition-transform ${showPostsApproval ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {/* Dropdown options */}
                    <div
                      className={`space-y-1 ml-4 transition-all duration-200 ${showPostsApproval ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0 overflow-hidden'
                        }`}
                    >
                      <Link href="/admin/blog-approval" onClick={handleLinkClick} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Blog Approval</Link>
                      <Link href="/admin/question-approval" onClick={handleLinkClick} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Question Approval</Link>
                      {/* <Link href="/admin/poll-approval" onClick={handleLinkClick} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Poll Approval</Link> */}
                    </div>
                  </div>

                  <Link
                    href="/admin/users"
                    onClick={handleLinkClick}
                    className={`flex items-center space-x-3 px-4 py-3 transition-colors ${isActive('/admin/users')
                        ? 'bg-[#C96442]/10 text-[#C96442]'
                        : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-6.13a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="font-medium">Users</span>
                  </Link>

                  <Link
                    href="/admin/categories"
                    onClick={handleLinkClick}
                    className={`flex items-center space-x-3 px-4 py-3 transition-colors ${isActive('/admin/categories')
                        ? 'bg-[#C96442]/10 text-[#C96442]'
                        : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h10M4 14h8" />
                    </svg>
                    <span className="font-medium">Categories</span>
                  </Link>

                  <Link
                    href="/admin/announcements"
                    onClick={handleLinkClick}
                    className={`flex items-center space-x-3 px-4 py-3 transition-colors ${isActive('/admin/announcements')
                        ? 'bg-[#C96442]/10 text-[#C96442]'
                        : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2V9m-6-4l6 6" />
                    </svg>
                    <span className="font-medium">Announcements</span>
                  </Link>

                  <Link
                    href="/admin/backlink-policy"
                    onClick={handleLinkClick}
                    className={`flex items-center space-x-3 px-4 py-3 transition-colors ${isActive('/admin/backlink-policy')
                        ? 'bg-[#C96442]/10 text-[#C96442]'
                        : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m-4-4h8M5 7a2 2 0 012-2h10a2 2 0 012 2v12l-4-2-4 2-4-2-4 2V7z" />
                    </svg>
                    <span className="font-medium">Backlink Policy</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Your Network preview removed on desktop; use Your Network link above */}

            {/* Mobile-only content */}
            <div className="lg:hidden space-y-6 pt-8 border-t border-gray-200">
              {/* Your Network preview removed on mobile as well */}
              {/* Popular Categories */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  POPULAR CATEGORIES
                </h3>
                <div className="space-y-2">
                  {(showAllCategories ? allCategories : categories).map((category, index) => (
                    <Link
                      key={index}
                      href={`/?category=${encodeURIComponent(category.name)}`}
                      onClick={handleLinkClick}
                      className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-gray-700">{category.name}</span>
                      {typeof category.count === 'number' && (
                        <span className="bg-[#C96442]/10 text-[#C96442] px-2 py-1 text-sm font-medium">
                          {category.count}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
                <button
                  onClick={() => setShowAllCategories(!showAllCategories)}
                  className="text-[#C96442] hover:text-[#C96442]/80 font-medium text-sm mt-4 ml-4 transition-colors cursor-pointer"
                >
                  {showAllCategories ? 'Show Less' : 'View All Categories'}
                </button>
              </div>

              {/* Trending Topics */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  TRENDING TOPICS
                </h3>
                <div className="space-y-2">
                  {trendingItems.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-2">
                        <span className="text-[#C96442] font-bold">#{index + 1}</span>
                        <span className="text-gray-700 text-sm">{item?.title || item?.question || item?.metaTitle || item?.slug || 'Trending'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
}


