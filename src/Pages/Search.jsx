'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { prodServerUrl } from '../global/server';

export default function SearchPage() {
  const params = useSearchParams();
  const router = useRouter();
  const q = params?.get('q') || '';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!q) { setItems([]); return; }
      setLoading(true); setError('');
      try {
        const { data } = await axios.get(`${prodServerUrl}/blogs/search`, { params: { q, limit: 30 } });
        if (!mounted) return;
        setItems(Array.isArray(data?.data) ? data.data : []);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || err.message || 'Search failed');
        setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [q]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-3xl mx-auto bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-4">
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center px-3 py-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-[#C96442] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Search Results</h1>
            <p className="text-sm text-gray-600 mb-6">Query: {q}</p>
            {loading && (<div className="text-gray-600">Searching...</div>)}
            {error && (<div className="text-red-700 bg-red-50 border border-red-200 p-3 rounded mb-4">{error}</div>)}
            <div className="space-y-4">
              {items.map((b) => (
                <article key={b._id} onClick={() => router.push(`/blog/${encodeURIComponent(b.slug || b._id)}`)} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <h2 className="font-semibold text-gray-900">{b.title}</h2>
                  <p className="text-sm text-gray-600 line-clamp-2">{b.metaDescription}</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 mt-2">
                    <span>{b?.author?.fullname || 'Unknown'}</span>
                    <span>•</span>
                    <span>{b?.category?.name || ''}</span>
                    <span>•</span>
                    <span>{b?.createdAt ? new Date(b.createdAt).toLocaleDateString() : ''}</span>
                  </div>
                </article>
              ))}
              {!loading && !error && items.length === 0 && (
                <div className="text-gray-600">No results found.</div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


