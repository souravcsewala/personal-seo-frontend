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

export default function AdminQuestionDetailPage() {
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

 const id = String(params?.id || '');
 const token = useMemo(() => {
  try {
   const raw = typeof window !== 'undefined' ? localStorage.getItem('authState') : null;
   const stored = raw ? JSON.parse(raw) : null;
   return auth?.accessToken || stored?.accessToken || '';
  } catch (_) { return ''; }
 }, [auth]);

 const [question, setQuestion] = useState(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');
 const [deleting, setDeleting] = useState(false);

 useEffect(() => {
  let mounted = true;
  (async () => {
   if (!id) return;
   setLoading(true);
   setError('');
   try {
    const res = await axios.get(`${prodServerUrl}/questions/${encodeURIComponent(id)}`);
    if (!mounted) return;
    setQuestion(res?.data?.data || null);
   } catch (e) {
    if (!mounted) return;
    setError(e?.response?.data?.message || e.message || 'Failed to load question');
   } finally {
    if (mounted) setLoading(false);
   }
  })();
  return () => { mounted = false; };
 }, [id]);

 const updateStatus = async (nextStatus) => {
  try {
   await axios.put(`${prodServerUrl}/questions/${encodeURIComponent(id)}`, { status: nextStatus }, {
    headers: { 'x-auth-token': token },
   });
   setQuestion(prev => prev ? { ...prev, status: nextStatus } : prev);
  } catch (e) {
   setError(e?.response?.data?.message || e.message || 'Failed to update status');
  }
 };

 const handleDelete = async () => {
  try {
   if (!id) return;
   const ok = typeof window !== 'undefined' ? window.confirm('Are you sure you want to delete this question? This action cannot be undone.') : true;
   if (!ok) return;
   setDeleting(true);
   await axios.delete(`${prodServerUrl}/questions/${encodeURIComponent(id)}`, {
    headers: { 'x-auth-token': token },
   });
   router.push('/admin/question-approval');
  } catch (e) {
   setError(e?.response?.data?.message || e.message || 'Failed to delete question');
  } finally {
   setDeleting(false);
  }
 };

 if (!loading && (!question || error)) {
  return (
   <div className="min-h-screen bg-gray-50">
    <Header />
    <div className="flex">
     <Sidebar />
     <main className={`flex-1 p-6 transition-all duration-300 ease-in-out ${
      sidebarOpen ? 'lg:ml-64 ml-0' : 'ml-0'
     }`}>
      <div className="max-w-4xl mx-auto bg-white border border-gray-200 p-6">
       <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{error || 'Question not found'}</h1>
        <button
         onClick={() => router.back()}
         className="bg-[#C96442] hover:bg-[#A54F35] text-white px-6 py-2 transition-colors"
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
     <div className="max-w-4xl mx-auto bg-white border border-gray-200 p-6">
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
      {!!question && (
       <>
        <div className="flex items-center space-x-3 mb-4">
         <div>
          <div className="font-medium text-gray-900">{question?.author?.fullname || 'Author'}</div>
          <div className="text-gray-500 text-sm">{new Date(question.createdAt).toLocaleDateString()}</div>
         </div>
         <span className={`ml-auto px-2 py-0.5 text-xs font-medium ${
          (question.status || 'pending') === 'approved' ? 'bg-green-100 text-green-800' :
          (question.status || 'pending') === 'rejected' ? 'bg-red-100 text-red-700' :
          'bg-yellow-100 text-yellow-700'
         }`}>
          {((question.status || 'pending') === 'rejected' ? 'declined' : (question.status || 'pending')).toUpperCase()}
         </span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">{question.title || 'Question'}</h1>
        {!!question.description && (
         <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: question.description }} />
        )}
       </>
      )}

      {!!question && (
       <div className="mt-8 flex flex-col gap-3">
        {((question.status || 'pending') === 'pending') && (
         <div className="flex gap-3">
          <button onClick={() => updateStatus('approved')} className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 transition-colors cursor-pointer">Approve</button>
          <button onClick={() => updateStatus('rejected')} className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 transition-colors cursor-pointer">Decline</button>
         </div>
        )}
        {((question.status || 'pending') === 'approved') && (
         <div className="flex gap-3">
          <button onClick={() => updateStatus('rejected')} className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 transition-colors cursor-pointer">Decline</button>
         </div>
        )}
        {((question.status || 'pending') === 'rejected') && (
         <div className="flex gap-3">
          <button onClick={() => updateStatus('approved')} className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 transition-colors cursor-pointer">Approve</button>
         </div>
        )}
        <button
         onClick={handleDelete}
         disabled={deleting}
         className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-4 py-2 transition-colors cursor-pointer"
        >
         {deleting ? 'Deleting…' : 'Delete Question'}
        </button>
       </div>
      )}
     </div>
    </main>
   </div>
  </div>
 );
}


