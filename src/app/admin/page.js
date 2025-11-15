'use client';

// Force dynamic rendering to prevent prerender errors with client hooks
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { useSelector } from '../../redux/useSelectorSafe';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useApp } from '../../context/AppContext';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import Link from 'next/link';
import { prodServerUrl } from '../../global/server';

export default function AdminDashboardPage() {
 const { sidebarOpen } = useApp();
 const auth = useSelector((s) => s.auth, { isAuthenticated: false, accessToken: null });
 const router = useRouter();

 const isAdmin = useMemo(() => String(auth?.role || '').toLowerCase() === 'admin', [auth?.role]);
 const headers = useMemo(() => ({ 'x-auth-token': auth?.accessToken || '' }), [auth?.accessToken]);

 const [stats, setStats] = useState(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');

 useEffect(() => {
  try {
   const raw = typeof window !== 'undefined' ? localStorage.getItem('authState') : null;
   const stored = raw ? JSON.parse(raw) : null;
   const token = auth?.accessToken || stored?.accessToken;
   const role = String(auth?.role || stored?.role || stored?.user?.role || '').toLowerCase();
   if (!token) {
    router.push('/login');
    return;
   }
   if (role !== 'admin') {
    router.push('/permission-denied');
    return;
   }
  } catch (_) {
   router.push('/login');
  }
 }, [auth, router]);

 useEffect(() => {
  let mounted = true;
  (async () => {
   setLoading(true);
   setError('');
   try {
    const { data } = await axios.get(`${prodServerUrl}/admin/dashboard/overview`, { headers });
    if (!mounted) return;
    setStats(data?.data || null);
   } catch (e) {
    if (!mounted) return;
    setError(e?.response?.data?.message || e.message || 'Failed to load dashboard');
   } finally {
    if (mounted) setLoading(false);
   }
  })();
  return () => { mounted = false; };
 }, [headers]);

 const totalBlogs = stats?.content?.totalBlogs ?? 0;
 const totalQuestions = stats?.content?.totalQuestions ?? 0;
 const totalPolls = stats?.content?.totalPolls ?? 0;
 const approvedBlogs = stats?.content?.blogsByStatus?.approved ?? 0;
 const pendingBlogs = stats?.content?.blogsByStatus?.pending ?? 0;
 const declinedBlogs = stats?.content?.blogsByStatus?.declined ?? 0;
 const totalUsers = stats?.users?.totalUsers ?? 0;
 const activeUsers = stats?.users?.activeUsers ?? 0;
 const newUsersThisMonth = stats?.users?.newUsersThisMonth ?? 0;

 return (
  <div className="min-h-screen bg-gray-50">
   <Header />
   <div className="flex">
    <Sidebar />
    <main className={`flex-1 p-6 transition-all duration-300 ease-in-out ${
     sidebarOpen ? 'lg:ml-64 ml-0' : 'ml-0'
    }`}>
     <div className="max-w-7xl mx-auto">
      {loading && (
       <div className="mb-6 text-gray-600">Loading dashboard…</div>
      )}
      {!!error && (
       <div className="mb-6 text-red-600">{error}</div>
      )}
      {/* Welcome Section */}
      <div className="mb-8">
       <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to Admin Dashboard</h1>
       <p className="text-lg text-gray-600">Monitor and manage your platform{"'"}s content, users, and overall performance</p>
      </div>

      {/* Main Stats Grid - 2 boxes per row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
       {/* Total Content */}
       <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
         <div>
          <h3 className="text-blue-800 text-lg font-semibold mb-1">Total Content</h3>
          <p className="text-blue-600 text-sm">All published content across the platform</p>
         </div>
         <div className="p-4 bg-blue-500 rounded-2xl">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
         </div>
        </div>
        <div className="text-4xl font-bold text-blue-900 mb-2">{totalBlogs + totalQuestions + totalPolls}</div>
        <div className="flex space-x-4 text-sm text-blue-700">
         <span>{totalBlogs} Blogs</span>
         <span>•</span>
         <span>{totalQuestions} Questions</span>
         <span>•</span>
         <span>{totalPolls} Polls</span>
        </div>
       </div>

       {/* User Statistics */}
       <div className="p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
         <div>
          <h3 className="text-purple-800 text-lg font-semibold mb-1">User Community</h3>
          <p className="text-purple-600 text-sm">Active and engaged platform users</p>
         </div>
         <div className="p-4 bg-purple-500 rounded-2xl">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-6.13a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
         </div>
        </div>
        <div className="text-4xl font-bold text-purple-900 mb-2">{totalUsers.toLocaleString()}</div>
        <div className="flex space-x-4 text-sm text-purple-700">
         <span>{activeUsers} Active</span>
         <span>•</span>
         <span>{newUsersThisMonth} New This Month</span>
        </div>
       </div>
      </div>

      {/* Content Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
       {/* Approved Content */}
       <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 shadow-md hover:shadow-lg transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
         <div>
          <h4 className="text-green-800 font-semibold">Approved Content</h4>
          <p className="text-green-600 text-sm">Ready for publication</p>
         </div>
         <div className="p-3 bg-green-500 ">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
         </div>
        </div>
        <div className="text-3xl font-bold text-green-900">{approvedBlogs}</div>
       </div>

       {/* Pending Review */}
       <div className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 shadow-md hover:shadow-lg transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
         <div>
          <h4 className="text-yellow-800 font-semibold">Pending Review</h4>
          <p className="text-yellow-600 text-sm">Awaiting approval</p>
         </div>
         <div className="p-3 bg-yellow-500 ">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
         </div>
        </div>
        <div className="text-3xl font-bold text-yellow-900">{pendingBlogs}</div>
       </div>

       {/* Declined Content */}
       <div className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 shadow-md hover:shadow-lg transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
         <div>
          <h4 className="text-red-800 font-semibold">Declined Content</h4>
          <p className="text-red-600 text-sm">Needs revision</p>
         </div>
         <div className="p-3 bg-red-500 ">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
         </div>
        </div>
        <div className="text-3xl font-bold text-red-900">{declinedBlogs}</div>
       </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
       <h3 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h3>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/blog-approval" className="p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors group">
         <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500 group-hover:bg-blue-600 transition-colors">
           <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M5 7h14M5 7v12a2 2 0 002 2h10a2 2 0 002-2V7" />
           </svg>
          </div>
          <span className="font-medium text-gray-900">Review Blogs</span>
         </div>
        </Link>
        
        {/**
        <Link href="/admin/question-approval" className="p-4 bg-green-50 hover:bg-green-100 border border-green-200 transition-colors group">
         <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-500 group-hover:bg-green-600 transition-colors">
           <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
          </div>
          <span className="font-medium text-gray-900">Review Questions</span>
         </div>
        </Link>
        */}
        
        {/**
        <Link href="/admin/poll-approval" className="p-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors group">
         <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-500 group-hover:bg-purple-600 transition-colors">
           <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
           </svg>
          </div>
          <span className="font-medium text-gray-900">Review Polls</span>
         </div>
        </Link>
        */}
        
        <Link href="/admin/users" className="p-4 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-colors group">
         <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-500 group-hover:bg-orange-600 transition-colors">
           <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
           </svg>
          </div>
          <span className="font-medium text-gray-900">Manage Users</span>
         </div>
        </Link>
       </div>
      </div>
     </div>
    </main>
   </div>
  </div>
 );
}



