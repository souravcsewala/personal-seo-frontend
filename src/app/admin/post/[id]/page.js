'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { prodServerUrl } from '../../../../global/server';
import { useApp } from '../../../../context/AppContext';
import Header from '../../../../components/layout/Header';
import Sidebar from '../../../../components/layout/Sidebar';

export default function AdminPostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { sidebarOpen } = useApp();
  const auth = useSelector((s) => s.auth);
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

  const id = String(params?.id || '');
  const token = useMemo(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('authState') : null;
      const stored = raw ? JSON.parse(raw) : null;
      return auth?.accessToken || stored?.accessToken || '';
    } catch (_) { return ''; }
  }, [auth]);

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`${prodServerUrl}/blogs/${encodeURIComponent(id)}`);
        if (!mounted) return;
        setBlog(res?.data?.data || null);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e.message || 'Failed to load post');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const updateStatus = async (nextStatus) => {
    try {
      await axios.put(`${prodServerUrl}/admin/blogs/${encodeURIComponent(id)}/status`, { status: nextStatus }, {
        headers: { 'x-auth-token': token },
      });
      setBlog(prev => prev ? { ...prev, status: nextStatus } : prev);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Failed to update status');
    }
  };

  if (!loading && (!blog || error)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className={`flex-1 p-6 transition-all duration-300 ease-in-out ${
            sidebarOpen ? 'lg:ml-64 ml-0' : 'ml-0'
          }`}>
            <div className="max-w-4xl mx-auto bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">{error || 'Post not found'}</h1>
                <button
                  onClick={() => router.back()}
                  className="bg-[#C96442] hover:bg-[#A54F35] text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className={`flex-1 p-6 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'lg:ml-64 ml-0' : 'ml-0'
        }`}>
          <div className="max-w-4xl mx-auto bg-white rounded-lg border border-gray-200 p-6">
            {/* Back Button */}
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
            {!!blog && (
              <>
                <div className="flex items-center space-x-3 mb-4">
                  <div>
                    <div className="font-medium text-gray-900">{blog?.author?.fullname || 'Author'}</div>
                    <div className="text-gray-500 text-sm">{new Date(blog.createdAt).toLocaleDateString()}</div>
                  </div>
                  <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${
                    (blog.status || 'pending') === 'approved' ? 'bg-green-100 text-green-800' :
                    (blog.status || 'pending') === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {((blog.status || 'pending') === 'rejected' ? 'declined' : (blog.status || 'pending')).toUpperCase()}
                  </span>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-4">{blog.title}</h1>
                {(blog.signedUrl || blog.image) && (
                  <img src={blog.signedUrl || blog.image} alt={blog.imageAlt || blog.title} className="w-full h-64 object-cover rounded-lg mb-4" />
                )}
                {blog.metaDescription && (
                  <p className="text-gray-700 mb-4">{blog.metaDescription}</p>
                )}
                {!!blog.content && (
                  <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: blog.content }} />
                )}
              </>
            )}

            {!!blog && (
              <div className="mt-8 flex gap-3">
                {((blog.status || 'pending') === 'pending') && (
                  <>
                    <button onClick={() => updateStatus('approved')} className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer">Approve</button>
                    <button onClick={() => updateStatus('rejected')} className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer">Decline</button>
                  </>
                )}
                {((blog.status || 'pending') === 'approved') && (
                  <button onClick={() => updateStatus('rejected')} className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer">Decline</button>
                )}
                {((blog.status || 'pending') === 'rejected') && (
                  <button onClick={() => updateStatus('approved')} className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer">Approve</button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}



