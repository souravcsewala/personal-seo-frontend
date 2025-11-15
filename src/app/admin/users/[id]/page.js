'use client';

// Force dynamic rendering to prevent prerender errors with client hooks
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from '../../../../redux/useSelectorSafe';
import axios from 'axios';
import { prodServerUrl } from '../../../../global/server';
import { useApp } from '../../../../context/AppContext';
import Header from '../../../../components/layout/Header';
import Sidebar from '../../../../components/layout/Sidebar';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { sidebarOpen } = useApp();
  const auth = useSelector((s) => s.auth, { isAuthenticated: false, accessToken: null });
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

  const userId = String(params?.id || '');
  const token = useMemo(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('authState') : null;
      const stored = raw ? JSON.parse(raw) : null;
      return auth?.accessToken || stored?.accessToken || '';
    } catch (_) { return ''; }
  }, [auth]);

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingRole, setSavingRole] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!userId) return;
      setLoading(true);
      setError('');
      try {
        const [uRes, pRes] = await Promise.all([
          axios.get(`${prodServerUrl}/admin/users/${encodeURIComponent(userId)}`, { headers: { 'x-auth-token': token } }),
          axios.get(`${prodServerUrl}/blogs/get-blog-by-author/${encodeURIComponent(userId)}`),
        ]);
        if (!mounted) return;
        setUser(uRes?.data?.data || null);
        const list = Array.isArray(pRes?.data?.data) ? pRes.data.data : [];
        setPosts(list);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e.message || 'Failed to load user');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [userId, token]);

  const toggleRole = async () => {
    try {
      if (!user?._id) return;
      setSavingRole(true);
      const current = String(user.role || 'user').toLowerCase();
      const nextRole = current === 'admin' ? 'user' : 'admin';
      await axios.put(`${prodServerUrl}/admin/users/${encodeURIComponent(user._id)}/role`, { role: nextRole }, {
        headers: { 'x-auth-token': token },
      });
      setUser(prev => prev ? { ...prev, role: nextRole } : prev);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Failed to update role');
    } finally {
      setSavingRole(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className={`flex-1 p-6 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'lg:ml-64 ml-0' : 'ml-0'
        }`}>
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <button
                onClick={() => router.back()}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back</span>
              </button>
            </div>

            {loading && <div className="mb-6 text-gray-600">Loading…</div>}
            {!!error && <div className="mb-6 text-red-600">{error}</div>}

            {!!user && (
              <div className="bg-white border border-gray-200 p-6 mb-6">
                <div className="flex items-start gap-4">
                  {user?.profileimage?.signedUrl || user?.profileimage?.url ? (
                    <Image src={user.profileimage.signedUrl || user.profileimage.url} alt={user?.fullname || 'User'} width={80} height={80} className="w-20 h-20 rounded-full" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-2xl font-semibold">
                      {(user?.fullname || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900">{user.fullname}</h1>
                        <div className="text-gray-500">{user.email}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${String(user.role).toLowerCase()==='admin'?'bg-purple-100 text-purple-700':'bg-gray-100 text-gray-700'}`}>
                          {String(user.role || 'user').toUpperCase()}
                        </span>
                        <button
                          onClick={toggleRole}
                          disabled={savingRole}
                          className="bg-[#C96442] hover:bg-[#A54F35] disabled:opacity-60 text-white px-3 py-1.5 transition-colors cursor-pointer text-sm"
                          title="Toggle role between Admin and User"
                        >
                          {savingRole ? 'Saving…' : (String(user.role || 'user').toLowerCase()==='admin' ? 'Make User' : 'Make Admin')}
                        </button>
                      </div>
                    </div>
                    {user?.bio && <div className="mt-3 text-gray-700">{user.bio}</div>}
                    <div className="mt-3 text-sm text-gray-500 flex flex-wrap gap-4">
                      <span>📍 {user?.location || 'N/A'}</span>
                      {user?.website && (
                        <span>🌐 <Link href={user.website} className="text-[#C96442] hover:underline">{user.website}</Link></span>
                      )}
                      <span>📅 Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{user?.posts ?? 0}</div>
                    <div className="text-sm text-gray-500">Posts</div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">User Posts</h2>
              {posts.length === 0 && !loading && (
                <div className="text-gray-600">No posts found.</div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <article key={post._id} className="bg-white border border-gray-200 p-5 flex flex-col h-full">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Blog</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          (post.status || 'pending') === 'approved' ? 'bg-green-100 text-green-700' :
                          (post.status || 'pending') === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {((post.status || 'pending') === 'rejected' ? 'declined' : (post.status || 'pending')).toUpperCase()}
                        </span>
                      </div>
                      {post.signedUrl || post.image ? (
                        <img src={post.signedUrl || post.image} alt={post.imageAlt || post.title} className="w-full h-36 object-cover mb-3" />
                      ) : null}
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{post.title}</h3>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</span>
                      <Link href={`/admin/post/${post._id}`} className="text-sm text-[#C96442] hover:underline">View</Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
