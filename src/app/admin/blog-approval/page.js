'use client';

// Force dynamic rendering to prevent prerender errors with client hooks
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { prodServerUrl } from '../../../global/server';
import { useSelector } from '../../../redux/useSelectorSafe';
import { useRouter } from 'next/navigation';
import { useApp } from '../../../context/AppContext';
import Header from '../../../components/layout/Header';
import Sidebar from '../../../components/layout/Sidebar';
import Link from 'next/link';
import Image from 'next/image';

const statusOptions = ['all', 'pending', 'approved', 'declined'];

export default function BlogApprovalPage() {
 const { sidebarOpen } = useApp();
 const auth = useSelector((s) => s.auth, { isAuthenticated: false, accessToken: null });
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
 const [status, setStatus] = useState('all');
 const [blogs, setBlogs] = useState([]);
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
    const params = { page, limit };
    if (search) params.search = search;
    if (status && status !== 'all') params.status = status;
    const resp = await axios.get(`${prodServerUrl}/admin/blogs`, {
     params,
     headers: { 'x-auth-token': token },
     signal: controller.signal,
    });
    const { data, pagination } = resp.data || {};
    setBlogs(Array.isArray(data) ? data : []);
    if (pagination) setTotal(pagination.total || 0);
   } catch (_) {}
  }
  if (token) load();
  return () => controller.abort();
 }, [token, page, search, status]);

 const handleSetStatus = async (id, nextStatus) => {
  try {
   const payload = { status: nextStatus };
   await axios.put(`${prodServerUrl}/admin/blogs/${id}/status`, payload, {
    headers: { 'x-auth-token': token },
   });
   // refresh list
   const resp = await axios.get(`${prodServerUrl}/admin/blogs`, {
    params: { page, limit, search: search || undefined, status: status && status !== 'all' ? status : undefined },
    headers: { 'x-auth-token': token },
   });
   const { data, pagination } = resp.data || {};
   setBlogs(Array.isArray(data) ? data : []);
   if (pagination) setTotal(pagination.total || 0);
  } catch (_) {}
 };

 const handleDelete = async (id) => {
  try {
   const ok = typeof window !== 'undefined' ? window.confirm('Delete this post permanently?') : true;
   if (!ok) return;
   await axios.delete(`${prodServerUrl}/blogs/delete-blog/${encodeURIComponent(id)}`, {
    headers: { 'x-auth-token': token },
   });
   // refresh list
   const resp = await axios.get(`${prodServerUrl}/admin/blogs`, {
    params: { page, limit, search: search || undefined, status: status && status !== 'all' ? status : undefined },
    headers: { 'x-auth-token': token },
   });
   const { data, pagination } = resp.data || {};
   setBlogs(Array.isArray(data) ? data : []);
   if (pagination) setTotal(pagination.total || 0);
  } catch (_) {}
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
       <h1 className="text-2xl font-bold text-gray-900">Available Posts</h1>
       <div className="flex items-center gap-3 w-full sm:w-auto">
        <input
         value={search}
         onChange={e => setSearch(e.target.value)}
         placeholder="Search posts..."
         className="w-full sm:w-64 px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#C96442] focus:border-transparent"
        />
        <select
         value={status}
         onChange={e => setStatus(e.target.value)}
         className="px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#C96442] focus:border-transparent"
        >
         {statusOptions.map(opt => (
          <option key={opt} value={opt}>{opt[0].toUpperCase()+opt.slice(1)}</option>
         ))}
        </select>
       </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
       {blogs.map(item => (
        <article key={item._id} className="bg-white shadow-sm border border-gray-200 p-5 flex flex-col h-full">
         <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
           <span className={`text-xs px-2 py-1 font-medium ${
            (item.status || 'pending') === 'approved' ? 'bg-green-100 text-green-700' :
            (item.status || 'pending') === 'rejected' ? 'bg-red-100 text-red-700' :
            'bg-yellow-100 text-yellow-700'
           }`}>
            {((item.status || 'pending') === 'rejected' ? 'declined' : (item.status || 'pending')).toUpperCase()}
           </span>
           {item?.author?.profileimage?.url ? (
            <Image src={item.author.profileimage.url} alt={item?.author?.fullname || 'Author'} width={32} height={32} className="w-8 h-8 " />
           ) : (
            <div className="w-8 h-8 bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-semibold">
             {(item?.author?.fullname || 'U').charAt(0).toUpperCase()}
            </div>
           )}
          </div>
          <div className="flex items-center space-x-2 mb-2">
           <span className="font-medium text-gray-900">{item?.author?.fullname || 'Unknown'}</span>
           <span className="text-gray-400">•</span>
           <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">Blog</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-4 line-clamp-2">{item.title}</h3>
         </div>

         {/* Actions */}
         <div className="mt-auto">
          {(item.status || 'pending') === 'pending' && (
           <div className="space-y-2">
            <Link href={`/admin/post/${item._id}`} className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 transition-colors">View Post</Link>
            <div className="flex gap-2">
             <button onClick={()=>handleSetStatus(item._id,'approved')} className="flex-1 border-2 border-green-400 text-green-600 hover:bg-green-50 px-4 py-2 transition-colors cursor-pointer">Approve</button>
             <button onClick={()=>handleSetStatus(item._id,'rejected')} className="flex-1 border-2 border-red-400 text-red-600 hover:bg-red-50 px-4 py-2 transition-colors cursor-pointer">Decline</button>
            </div>
            <button onClick={()=>handleDelete(item._id)} className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 transition-colors cursor-pointer">Delete</button>
           </div>
          )}

          {(item.status || 'pending') === 'approved' && (
           <div className="space-y-2">
            <Link href={`/admin/post/${item._id}`} className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 transition-colors">View Post</Link>
            <button onClick={()=>handleSetStatus(item._id,'rejected')} className="w-full border-2 border-red-400 text-red-600 hover:bg-red-50 px-4 py-2 transition-colors cursor-pointer">Decline</button>
            <button onClick={()=>handleDelete(item._id)} className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 transition-colors cursor-pointer">Delete</button>
           </div>
          )}

          {(item.status || 'pending') === 'rejected' && (
           <div className="space-y-2">
            <Link href={`/admin/post/${item._id}`} className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 transition-colors">View Post</Link>
            <button onClick={()=>handleSetStatus(item._id,'approved')} className="w-full border-2 border-green-400 text-green-600 hover:bg-green-50 px-4 py-2 transition-colors cursor-pointer">Approve</button>
            <button onClick={()=>handleDelete(item._id)} className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 transition-colors cursor-pointer">Delete</button>
           </div>
          )}
         </div>
        </article>
       ))}
      </div>
      <div className="mt-6 flex items-center justify-between">
       <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-3 py-2 border disabled:opacity-50">Prev</button>
       <div className="text-sm text-gray-600">Page {page} • {total} posts</div>
       <button disabled={page*limit>=total} onClick={()=>setPage(p=>p+1)} className="px-3 py-2 border disabled:opacity-50">Next</button>
      </div>
     </div>
    </main>
   </div>
  </div>
 );
}



