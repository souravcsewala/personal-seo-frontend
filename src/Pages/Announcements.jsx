'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import LoginModal from '../components/auth/LoginModal';
import { useApp } from '../context/AppContext';
import { prodServerUrl } from '../global/server';
import LoadingIndicator from '../components/common/LoadingIndicator';

export default function Announcements() {
  const router = useRouter();
  const { sidebarOpen } = useApp();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const formatDate = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${day}-${m}-${y}`; // dd-mm-yyyy
  };

  const getStatus = (a) => {
    const now = new Date();
    if (a?.startAt && now < new Date(a.startAt)) return 'Upcoming';
    if (a?.endAt && now > new Date(a.endAt)) return 'Expired';
    return a?.isActive ? 'Active' : 'Inactive';
  };

  const load = async (p = 1) => {
    try {
      setLoading(true);
      setError('');
      const { data } = await axios.get(`${prodServerUrl}/announcements`, { params: { page: p, limit: 20 } });
      const list = Array.isArray(data?.data) ? data.data : [];
      if (p === 1) setItems(list); else setItems(prev => [...prev, ...list]);
      setHasMore(!!data?.pagination?.hasMore);
      setPage(p);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load announcements');
      if (p === 1) setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLoginClick={() => setShowLoginModal(true)} />

      <div className="flex">
        <Sidebar />

        <main className={`flex-1 p-6 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'lg:ml-64 ml-0' : 'ml-0'
        }`}>
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>

            <h1 className="text-3xl font-bold text-gray-900 mb-6">Announcements</h1>

            {error && (
              <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700 mb-4">{error}</div>
            )}

            <div className="space-y-4">
              {loading && items.length === 0 ? (
                <div className="py-8"><LoadingIndicator /></div>
              ) : (
                <>
                  {items.map((a) => (
                    <article key={a._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                      <div className="mb-2">
                        <h2 className="text-lg font-semibold text-gray-900">{a.title}</h2>
                      </div>
                      <div className="text-sm text-gray-600 mb-3 flex flex-wrap gap-3 items-center">
                        {(() => {
                          const status = getStatus(a);
                          const statusClass = status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : status === 'Upcoming'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800';
                          return (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded ${statusClass}`}>{status}</span>
                          );
                        })()}
                        <span>Start: {formatDate(a.startAt)}</span>
                        <span>End: {formatDate(a.endAt)}</span>
                      </div>
                      {a.contentHtml ? (
                        <div className="text-gray-700 leading-relaxed prose max-w-none" dangerouslySetInnerHTML={{ __html: a.contentHtml }} />
                      ) : (
                        <p className="text-gray-700">No content</p>
                      )}
                      {a.linkUrl && (
                        <div className="mt-2">
                          <a href={a.linkUrl} target={a.linkUrl.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="text-[#C96442] hover:underline">
                            Visit link
                          </a>
                        </div>
                      )}
                    </article>
                  ))}
                  {!loading && items.length === 0 && !error && (
                    <div className="text-gray-600">No announcements yet.</div>
                  )}
                </>
              )}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => load(page + 1)}
                  disabled={loading}
                  className="px-4 py-2 bg-[#C96442] text-white rounded-lg hover:bg-[#C96442]/90 transition-colors disabled:opacity-60"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </div>
  );
}



