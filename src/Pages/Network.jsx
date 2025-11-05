'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { useApp } from '../context/AppContext';
import { prodServerUrl } from '../global/server';

export default function Network() {
  const router = useRouter();
  const { sidebarOpen } = useApp();
  const auth = useSelector((s) => s.auth);
  const isLoggedIn = !!auth?.isAuthenticated && !!auth?.accessToken;

  const [activeTab, setActiveTab] = useState('followers'); // 'followers' | 'following'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  useEffect(() => {
    if (!isLoggedIn) {
      try { router.push('/login'); } catch (_) {}
    }
  }, [isLoggedIn, router]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!auth?.userId) return;
      setLoading(true);
      setError('');
      try {
        const [f1, f2] = await Promise.all([
          axios.get(`${prodServerUrl}/users/${encodeURIComponent(auth.userId)}/followers`, { params: { limit: 100 } }),
          axios.get(`${prodServerUrl}/users/${encodeURIComponent(auth.userId)}/following`, { params: { limit: 100 } }),
        ]);
        if (cancelled) return;
        setFollowers(Array.isArray(f1?.data?.data) ? f1.data.data : []);
        setFollowing(Array.isArray(f2?.data?.data) ? f2.data.data : []);
      } catch (e) {
        if (cancelled) return;
        setError(e?.response?.data?.message || e.message || 'Failed to load network');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [auth?.userId]);

  const list = activeTab === 'followers' ? followers : following;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className={`flex-1 p-6 transition-all duration-300 ease-in-out ${sidebarOpen ? 'lg:ml-64 ml-0' : 'ml-0'}`}>
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Your Network</h1>
              <p className="text-gray-600">Manage your followers and who you follow.</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('followers')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${activeTab === 'followers' ? 'bg-[#C96442] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Followers
                </button>
                <button
                  onClick={() => setActiveTab('following')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${activeTab === 'following' ? 'bg-[#C96442] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Following
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700 mb-6">{error}</div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {loading ? (
                <div className="p-6">Loading...</div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {list.map((u, idx) => (
                    <li key={idx} className="p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="w-8 h-8 rounded-full bg-gray-200 inline-block" />
                        <span className="text-gray-900 font-medium">{u.fullname || 'Member'}</span>
                      </div>
                      <button
                        onClick={() => {
                          if (u.fullname) router.push(`/blogger/${encodeURIComponent(u.fullname)}`);
                        }}
                        className="text-sm text-[#C96442] hover:text-[#A54F35] cursor-pointer"
                      >
                        View
                      </button>
                    </li>
                  ))}
                  {list.length === 0 && (
                    <li className="p-6 text-gray-600">No {activeTab} yet.</li>
                  )}
                </ul>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


