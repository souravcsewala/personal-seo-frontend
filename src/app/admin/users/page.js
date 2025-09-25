'use client';

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { prodServerUrl } from '../../../global/server';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useApp } from '../../../context/AppContext';
import Header from '../../../components/layout/Header';
import Sidebar from '../../../components/layout/Sidebar';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminUsersPage() {
  const { sidebarOpen } = useApp();
  const auth = useSelector((s) => s.auth);
  const router = useRouter();
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
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(12);
  const token = useMemo(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('authState') : null;
      const stored = raw ? JSON.parse(raw) : null;
      return auth?.accessToken || stored?.accessToken || '';
    } catch (_) { return ''; }
  }, [auth]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const params = { page, limit, search: search || undefined };
        const resp = await axios.get(`${prodServerUrl}/admin/users`, {
          params,
          headers: { 'x-auth-token': token },
          signal: controller.signal,
        });
        const { data, pagination } = resp.data || {};
        setUsers(Array.isArray(data) ? data : []);
        if (pagination) { setTotal(pagination.total || 0); }
      } catch (_) {}
    }
    if (token) load();
    return () => controller.abort();
  }, [token, page, search]);

  const filtered = users;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className={`flex-1 p-6 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'lg:ml-64 ml-0' : 'ml-0'
        }`}>
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Users</h1>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C96442] focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(user => (
                <div key={user._id} className="bg-white rounded-lg border border-gray-200 p-5">
                  <div className="flex items-center space-x-3 mb-3">
                    {user?.profileimage?.signedUrl || user?.profileimage?.url ? (
                      <Image src={user.profileimage.signedUrl || user.profileimage.url} alt={user.fullname || 'User'} width={48} height={48} className="w-12 h-12 rounded-full" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-lg font-semibold">
                        {(user?.fullname || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-gray-900">{user.fullname}</div>
                      <div className="text-gray-500 text-sm">{user.email}</div>
                    </div>
                  </div>
                  <div className="text-gray-600 text-sm mb-4">Posts: {user.posts || 0}</div>
                  <Link href={`/admin/users/${user._id}`} className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg transition-colors">View Details</Link>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between">
              <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-3 py-2 border rounded disabled:opacity-50">Prev</button>
              <div className="text-sm text-gray-600">Page {page} • {total} users</div>
              <button disabled={page*limit>=total} onClick={()=>setPage(p=>p+1)} className="px-3 py-2 border rounded disabled:opacity-50">Next</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}



