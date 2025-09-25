'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { useSelector } from 'react-redux';

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, closeSidebar } = useApp();
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showPostsApproval, setShowPostsApproval] = useState(false);
  const auth = useSelector((s) => s.auth);
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

  const categories = [
    { name: "Sports", count: 248 },
    { name: "Music", count: 189 },
    { name: "Politics", count: 156 },
    { name: "Topics", count: 134 }
  ];

  const allCategories = [
    { name: "Sports", count: 248 },
    { name: "Music", count: 189 },
    { name: "Politics", count: 156 },
    { name: "Topics", count: 134 },
    { name: "Technology", count: 98 },
    { name: "Business", count: 87 },
    { name: "Health", count: 76 },
    { name: "Education", count: 65 },
    { name: "Entertainment", count: 54 },
    { name: "Travel", count: 43 },
    { name: "Food", count: 32 },
    { name: "Fashion", count: 28 }
  ];

  return (
    <>
      {/* Overlay - only show on mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 min-h-screen
        transform transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Close button - fixed position */}
        <button
          onClick={closeSidebar}
          className="absolute top-4 right-4 p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors z-10 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Scrollable content container */}
        <div className="h-full overflow-y-auto p-6">

        {/* Site Logo */}
        <div className="mb-8">
          <Link href="/" onClick={handleLinkClick} className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#C96442] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">SEOHub</span>
          </Link>
        </div>

        <nav className="space-y-8">
        {/* Main Navigation */}
        <div className="space-y-2">
          <Link 
            href="/" 
            onClick={handleLinkClick}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              isActive('/') 
                ? 'bg-[#C96442]/10 text-[#C96442]' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="font-medium">Home</span>
          </Link>
          
          {isLoggedIn && (
            <Link 
              href="/profile" 
              onClick={handleLinkClick}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/profile') 
                  ? 'bg-[#C96442]/10 text-[#C96442]' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-medium">Profile</span>
            </Link>
          )}

          {!isAdmin && (
            <Link 
              href="/saved" 
              onClick={handleLinkClick}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/saved') 
                  ? 'bg-[#C96442]/10 text-[#C96442]'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v14l-7-4-7 4V5z" />
              </svg>
              <span className="font-medium">Saved Posts</span>
            </Link>
          )}

        </div>

        {/* Create Content Section */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            CREATE CONTENT
          </h3>
          <div className="space-y-2">
            <Link 
              href="/publish-blog" 
              onClick={handleLinkClick}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-medium">Publish Blog</span>
            </Link>
            {/*
            <Link 
              href="/ask-question" 
              onClick={handleLinkClick}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Ask Question</span>
            </Link>
            
            <Link 
              href="/create-poll" 
              onClick={handleLinkClick}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
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
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            ADMIN
          </h3>
          <div className="space-y-2">
            <Link 
              href="/admin" 
              onClick={handleLinkClick}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/admin') 
                  ? 'bg-[#C96442]/10 text-[#C96442]'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
              </svg>
              <span className="font-medium">Dashboard</span>
            </Link>

            {/* Posts Approval dropdown */}
            <div className="relative group">
              <button
                onClick={() => setShowPostsApproval(!showPostsApproval)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
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
                className={`space-y-1 ml-4 transition-all duration-200 ${
                  showPostsApproval ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0 overflow-hidden'
                }`}
              >
                <Link href="/admin/blog-approval" onClick={handleLinkClick} className="block px-4 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Blog Approval</Link>
                {/* <Link href="/admin/question-approval" onClick={handleLinkClick} className="block px-4 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Question Approval</Link> */}
                {/* <Link href="/admin/poll-approval" onClick={handleLinkClick} className="block px-4 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Poll Approval</Link> */}
              </div>
            </div>

            <Link 
              href="/admin/users" 
              onClick={handleLinkClick}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/admin/users') 
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
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/admin/categories') 
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
              href="/admin/backlink-policy" 
              onClick={handleLinkClick}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/admin/backlink-policy') 
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

        {/* Mobile-only content */}
        <div className="lg:hidden space-y-6 pt-8 border-t border-gray-200">
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
                  className="flex items-center justify-between px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-gray-700">{category.name}</span>
                  <span className="bg-[#C96442]/10 text-[#C96442] px-2 py-1 rounded-full text-sm font-medium">
                    {category.count}
                  </span>
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
              {[
                { rank: 1, topic: "Core Web Vitals Update", posts: 45 },
                { rank: 2, topic: "AI Content Guidelines", posts: 38 },
                { rank: 3, topic: "Mobile-First Indexing", posts: 32 },
                { rank: 4, topic: "E-A-T Optimization", posts: 28 },
                { rank: 5, topic: "Voice Search SEO", posts: 24 }
              ].map((topic, index) => (
                <div key={index} className="flex items-center justify-between px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-2">
                    <span className="text-[#C96442] font-bold">#{topic.rank}</span>
                    <span className="text-gray-700 text-sm">{topic.topic}</span>
                  </div>
                  <span className="text-gray-500 text-xs">{topic.posts} posts</span>
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


