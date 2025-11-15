'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useSelector } from '../redux/useSelectorSafe';
import axios from 'axios';
import dynamic from 'next/dynamic';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import LoginModal from '../components/auth/LoginModal';
import { prodServerUrl } from '../global/server';
import { useApp } from '../context/AppContext';
import LoadingIndicator from '../components/common/LoadingIndicator';

function sanitizeAndAutolink(unsafeHtml) {
 try {
  if (typeof window === 'undefined') return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(String(unsafeHtml || ''), 'text/html');
  doc.querySelectorAll('script, style, iframe, object, embed').forEach((el) => el.remove());
  const walk = (node) => {
   if (!node || !node.attributes) return;
   [...node.attributes].forEach((attr) => {
    const name = attr.name.toLowerCase();
    const value = String(attr.value || '').toLowerCase();
    if (name.startsWith('on') || value.startsWith('javascript:')) {
     node.removeAttribute(attr.name);
    }
   });
   node.childNodes && node.childNodes.forEach(walk);
  };
  doc.body && doc.body.childNodes && doc.body.childNodes.forEach(walk);
  // Autolink URLs in text nodes
  const urlRegex = /(https?:\/\/[^\s<]+[^\s<\.)])/gi;
  const linkifyNode = (node) => {
   if (!node) return;
   if (node.nodeType === Node.TEXT_NODE) {
    const text = node.nodeValue || '';
    if (!text) return;
    urlRegex.lastIndex = 0;
    if (!urlRegex.test(text)) return;
    urlRegex.lastIndex = 0;
    const frag = doc.createDocumentFragment();
    let lastIndex = 0;
    let m;
    while ((m = urlRegex.exec(text)) !== null) {
     const start = m.index;
     const url = m[0];
     if (start > lastIndex) frag.appendChild(doc.createTextNode(text.slice(lastIndex, start)));
     const a = doc.createElement('a');
     a.setAttribute('href', url);
     a.setAttribute('target', '_blank');
     a.setAttribute('rel', 'nofollow noopener ugc');
     a.className = 'text-[#C96442] underline break-all';
     a.appendChild(doc.createTextNode(url));
     frag.appendChild(a);
     lastIndex = start + url.length;
    }
    if (lastIndex < text.length) frag.appendChild(doc.createTextNode(text.slice(lastIndex)));
    node.parentNode && node.parentNode.replaceChild(frag, node);
    return;
   }
   if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'A') {
    node.childNodes && [...node.childNodes].forEach(linkifyNode);
   }
  };
  doc.body && linkifyNode(doc.body);
  return doc.body ? doc.body.innerHTML : '';
 } catch (_) {
  return '';
 }
}

export default function QuestionDetail() {
 const router = useRouter();
 const params = useParams();
 const searchParams = useSearchParams();
 const [showLoginModal, setShowLoginModal] = useState(false);
 const [newAnswer, setNewAnswer] = useState('');
 const [question, setQuestion] = useState(null);
 const [answers, setAnswers] = useState([]);
 const [replyStates, setReplyStates] = useState({}); // { [answerId]: { open, loading, loaded, error, posting, newReply, replyTargetId, items, editingReplyId, editingReplyText } }
 const [answerEdit, setAnswerEdit] = useState({ id: null, text: '', saving: false, deleting: false });
 const [loading, setLoading] = useState(true);
 const [posting, setPosting] = useState(false);
 const [error, setError] = useState('');
 const auth = useSelector((s) => s.auth, { isAuthenticated: false, accessToken: null });
 const isLoggedIn = !!auth?.isAuthenticated && !!auth?.accessToken;
 const questionId = params?.slug || params?.id;
 const fallbackId = searchParams?.get('id');
 const { sidebarOpen } = useApp();
 const [questionEdit, setQuestionEdit] = useState({ editing: false, saving: false, deleting: false, title: '', description: '' });
 const QuillEditor = dynamic(() => import('../components/common/QuillEditor'), { ssr: false });
 const [followInfo, setFollowInfo] = useState({ loading: false, isFollowing: false, followers: 0, following: 0 });

 useEffect(() => {
  if (!questionId) return;
  let mounted = true;
  async function loadAll() {
   try {
    setLoading(true);
    setError('');
    let qRes;
    try {
     qRes = await axios.get(`${prodServerUrl}/questions/${encodeURIComponent(questionId)}`);
    } catch (e) {
     // fallback to id query if provided
     if (fallbackId) {
      qRes = await axios.get(`${prodServerUrl}/questions/${encodeURIComponent(fallbackId)}`);
     } else {
      throw e;
     }
    }
    const qData = qRes?.data?.data;
    const idForAnswers = qData?._id || fallbackId || questionId;
    const aRes = await axios.get(`${prodServerUrl}/questions/${encodeURIComponent(idForAnswers)}/answers`, { params: { limit: 50 } });
    if (!mounted) return;
    setQuestion(qData || null);
    setAnswers(Array.isArray(aRes?.data?.data) ? aRes.data.data : []);
    // If URL uses ObjectId or has ?id, and slug exists, redirect to slug-only URL
    const looksLikeObjectId = String(questionId || '').match(/^[0-9a-fA-F]{24}$/);
    if (qData && qData.slug) {
     const current = typeof window !== 'undefined' ? window.location.pathname : '';
     const desired = `/question/${encodeURIComponent(qData.slug)}`;
     if (looksLikeObjectId || current !== desired || (fallbackId && current.indexOf('?') !== -1)) {
      router.replace(desired);
     }
    }
   } catch (err) {
    if (!mounted) return;
    setError(err?.response?.data?.message || 'Failed to load question');
    setQuestion(null);
    setAnswers([]);
   } finally {
    if (mounted) setLoading(false);
   }
  }
  loadAll();
  return () => { mounted = false; };
 }, [questionId, fallbackId]);

 // Load follow stats for question author
 useEffect(() => {
  const authorId = question?.author && (question.author._id || question.author);
  if (!authorId) return;
  let cancelled = false;
  async function loadFollow() {
   try {
    setFollowInfo((p) => ({ ...p, loading: true }));
    const headers = (auth?.isAuthenticated && auth?.accessToken) ? { 'x-auth-token': auth.accessToken } : {};
    const { data } = await axios.get(`${prodServerUrl}/users/${encodeURIComponent(authorId)}/follow-stats`, { headers });
    const d = data?.data || {};
    if (cancelled) return;
    setFollowInfo({ loading: false, isFollowing: !!d.isFollowing, followers: Number(d.followers || 0), following: Number(d.following || 0) });
   } catch (_) {
    if (cancelled) return;
    setFollowInfo((p) => ({ ...p, loading: false }));
   }
  }
  loadFollow();
  return () => { cancelled = true; };
 }, [question?.author]);

 const handleToggleFollowAuthor = async () => {
  const authorId = question?.author && (question.author._id || question.author);
  if (!authorId) return;
  if (!isLoggedIn) { router.push('/login'); return; }
  try {
   setFollowInfo((p) => ({ ...p, loading: true }));
   if (followInfo.isFollowing) {
    const { data } = await axios.delete(`${prodServerUrl}/users/${encodeURIComponent(authorId)}/follow`, { headers: { 'x-auth-token': auth.accessToken } });
    const d = data?.data || {};
    setFollowInfo({ loading: false, isFollowing: !!d.isFollowing, followers: Number(d.followers || 0), following: Number(d.following || 0) });
   } else {
    const { data } = await axios.post(`${prodServerUrl}/users/${encodeURIComponent(authorId)}/follow`, {}, { headers: { 'x-auth-token': auth.accessToken } });
    const d = data?.data || {};
    setFollowInfo({ loading: false, isFollowing: !!d.isFollowing, followers: Number(d.followers || 0), following: Number(d.following || 0) });
   }
  } catch (err) {
   setFollowInfo((p) => ({ ...p, loading: false }));
   alert(err?.response?.data?.message || 'Failed to update follow');
  }
 };

 // Prefetch replies for all loaded answers so they are visible to everyone without toggling
 useEffect(() => {
  const controller = { cancelled: false };
  async function fetchReplies(answerId) {
   try {
    setReplyStates((prev) => ({ ...prev, [answerId]: { ...(prev[answerId] || {}), loading: true, error: '', loaded: prev[answerId]?.loaded || false, items: prev[answerId]?.items || [] } }));
    const { data } = await axios.get(`${prodServerUrl}/questions/answers/${encodeURIComponent(answerId)}/replies`);
    if (controller.cancelled) return;
    const items = Array.isArray(data?.data) ? data.data : [];
    setReplyStates((prev) => ({
     ...prev,
     [answerId]: {
      ...(prev[answerId] || {}),
      loading: false,
      loaded: true,
      items,
      // auto-open if there are replies
      open: items.length > 0 ? true : (prev[answerId]?.open || false),
     },
    }));
   } catch (err) {
    if (controller.cancelled) return;
    setReplyStates((prev) => ({ ...prev, [answerId]: { ...(prev[answerId] || {}), loading: false, loaded: true, error: err?.response?.data?.message || 'Failed to load replies' } }));
   }
  }
  if (Array.isArray(answers) && answers.length > 0) {
   answers.forEach((a) => {
    if (!a || !a._id) return;
    const st = replyStates[a._id];
    if (!st || !st.loaded) fetchReplies(a._id);
   });
  }
  return () => { controller.cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [answers]);

 const handleAddAnswer = async (e) => {
  e.preventDefault();
  if (!isLoggedIn) { router.push('/login'); return; }
  const content = newAnswer.trim();
  if (!content) return;
  try {
   setPosting(true);
   const targetId = (question && question._id) ? question._id : questionId;
   const { data } = await axios.post(
    `${prodServerUrl}/questions/${encodeURIComponent(targetId)}/answers`,
    { content },
    { headers: { 'x-auth-token': auth.accessToken } }
   );
   const created = data?.data;
   if (created) setAnswers((prev) => [created, ...prev]);
   setNewAnswer('');
  } catch (err) {
   alert(err?.response?.data?.message || 'Failed to add answer');
  } finally {
   setPosting(false);
  }
 };

 const handleAcceptAnswer = async (answerId) => {
  if (!isLoggedIn) { router.push('/login'); return; }
  try {
   const { data } = await axios.post(
    `${prodServerUrl}/questions/answers/${encodeURIComponent(answerId)}/accept`,
    {},
    { headers: { 'x-auth-token': auth.accessToken } }
   );
   const toggled = !!(data && data.data && data.data.isAccepted);
   setAnswers((prev) => {
    if (toggled) {
     // Mark only this answer as accepted
     return prev.map((a) => ({ ...a, isAccepted: String(a._id) === String(answerId) }));
    }
    // Unaccept: clear accepted flag for all
    return prev.map((a) => ({ ...a, isAccepted: false }));
   });
  } catch (err) {
   alert(err?.response?.data?.message || 'Failed to accept answer');
  }
 };

 const handleLikeAnswer = async (answerId) => {
  if (!isLoggedIn) { router.push('/login'); return; }
  try {
   const { data } = await axios.post(
    `${prodServerUrl}/questions/answers/${encodeURIComponent(answerId)}/like`,
    {},
    { headers: { 'x-auth-token': auth.accessToken } }
   );
   const liked = !!data?.data?.liked;
   const likes = Number(data?.data?.likes || data?.data?.likesCount || 0);
   setAnswers((prev) => prev.map((a) => String(a._id) === String(answerId) ? { ...a, likes } : a));
  } catch (err) {
   alert(err?.response?.data?.message || 'Failed to react');
  }
 };

 const startEditAnswer = (answer) => {
  setAnswerEdit({ id: answer._id, text: answer.content || '', saving: false, deleting: false });
 };

 const cancelEditAnswer = () => {
  setAnswerEdit({ id: null, text: '', saving: false, deleting: false });
 };

 const saveEditAnswer = async () => {
  if (!isLoggedIn || !answerEdit.id) { router.push('/login'); return; }
  const content = (answerEdit.text || '').trim();
  if (!content) return;
  try {
   setAnswerEdit((prev) => ({ ...prev, saving: true }));
   const { data } = await axios.put(
    `${prodServerUrl}/questions/answers/${encodeURIComponent(answerEdit.id)}`,
    { content },
    { headers: { 'x-auth-token': auth.accessToken } }
   );
   const updated = data?.data;
   setAnswers((prev) => prev.map((a) => String(a._id) === String(answerEdit.id) ? { ...a, content: updated?.content || content } : a));
   cancelEditAnswer();
  } catch (err) {
   alert(err?.response?.data?.message || 'Failed to update answer');
   setAnswerEdit((prev) => ({ ...prev, saving: false }));
  }
 };

 const deleteAnswer = async (answerId) => {
  if (!isLoggedIn) { router.push('/login'); return; }
  if (!window.confirm('Delete this answer? This cannot be undone.')) return;
  try {
   setAnswerEdit((prev) => (String(prev.id) === String(answerId) ? { ...prev, deleting: true } : prev));
   await axios.delete(`${prodServerUrl}/questions/answers/${encodeURIComponent(answerId)}`, { headers: { 'x-auth-token': auth.accessToken } });
   setAnswers((prev) => prev.filter((a) => String(a._id) !== String(answerId)));
   cancelEditAnswer();
  } catch (err) {
   alert(err?.response?.data?.message || 'Failed to delete answer');
   setAnswerEdit((prev) => ({ ...prev, deleting: false }));
  }
 };

 const ensureReplyState = (answerId) => {
  setReplyStates((prev) => prev[answerId] ? prev : { ...prev, [answerId]: { open: false, loading: false, error: '', posting: false, newReply: '', replyTargetId: null, items: [], editingReplyId: null, editingReplyText: '' } });
 };

 const toggleReplies = async (answerId) => {
  ensureReplyState(answerId);
  setReplyStates((prev) => {
   const curr = prev[answerId] || { open: false };
   return { ...prev, [answerId]: { ...(curr || {}), open: !curr.open } };
  });
  // If opening and not loaded yet, fetch replies
  const state = replyStates[answerId];
  const willOpen = !(state && state.open);
  if (willOpen && !(state && state.loaded)) {
   try {
    setReplyStates((prev) => ({ ...prev, [answerId]: { ...(prev[answerId] || {}), loading: true, error: '' } }));
    const { data } = await axios.get(`${prodServerUrl}/questions/answers/${encodeURIComponent(answerId)}/replies`);
    const items = Array.isArray(data?.data) ? data.data : [];
    setReplyStates((prev) => ({ ...prev, [answerId]: { ...(prev[answerId] || {}), loading: false, loaded: true, items } }));
   } catch (err) {
    setReplyStates((prev) => ({ ...prev, [answerId]: { ...(prev[answerId] || {}), loading: false, loaded: true, error: err?.response?.data?.message || 'Failed to load replies' } }));
   }
  }
 };

 const handleAddReply = async (answerId) => {
  if (!isLoggedIn) { router.push('/login'); return; }
  ensureReplyState(answerId);
  const content = (replyStates[answerId]?.newReply || '').trim();
  if (!content) return;
  try {
   setReplyStates((prev) => ({ ...prev, [answerId]: { ...(prev[answerId] || {}), posting: true } }));
   const { data } = await axios.post(
    `${prodServerUrl}/questions/answers/${encodeURIComponent(answerId)}/replies`,
    { content, parentId: replyStates[answerId]?.replyTargetId || undefined },
    { headers: { 'x-auth-token': auth.accessToken } }
   );
   const created = data?.data;
   setReplyStates((prev) => {
    const prevItems = prev[answerId]?.items || [];
    return { ...prev, [answerId]: { ...(prev[answerId] || {}), posting: false, newReply: '', replyTargetId: null, items: created ? [created, ...prevItems] : prevItems } };
   });
  } catch (err) {
   setReplyStates((prev) => ({ ...prev, [answerId]: { ...(prev[answerId] || {}), posting: false, error: err?.response?.data?.message || 'Failed to reply' } }));
  }
 };

 if (loading) {
  return (
   <div className="min-h-screen bg-gray-50">
    <Header onLoginClick={() => setShowLoginModal(true)} />
    <div className="flex">
     <Sidebar />
     <main className={`flex-1 p-6 transition-all duration-300 ease-in-out ${
      true ? 'lg:ml-64 ml-0' : 'ml-0'
     }`}>
      <div className="max-w-4xl mx-auto">
       <div className="py-12"><LoadingIndicator /></div>
      </div>
     </main>
    </div>
   </div>
  );
 }

 if (!question) {
  return (
   <div className="min-h-screen bg-gray-50">
    <Header onLoginClick={() => setShowLoginModal(true)} />
    <div className="flex">
     <Sidebar />
     <main className={`flex-1 p-6 transition-all duration-300 ease-in-out ${
      true ? 'lg:ml-64 ml-0' : 'ml-0'
     }`}>
      <div className="max-w-4xl mx-auto">
       <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{error || 'Question not found'}</h1>
        <button
         onClick={() => router.push('/')}
         className="bg-[#C96442] text-white px-6 py-2 hover:bg-[#C96442]/90 transition-colors"
        >
         Back to Home
        </button>
       </div>
      </div>
     </main>
    </div>
   </div>
  );
 }

 return (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
   <Header onLoginClick={() => setShowLoginModal(true)} />
   
   <div className="flex">
    <Sidebar />
    
    <main className={`flex-1 p-6 transition-all duration-300 ease-in-out ${
     sidebarOpen ? 'lg:ml-64 ml-0' : 'ml-0'
    }`}>
     <div className="max-w-5xl mx-auto">
      <div className="mb-6">
       <button
        onClick={() => router.back()}
        className="flex items-center space-x-2 text-gray-600 hover:text-[#C96442] transition-colors group"
       >
        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="font-medium">Back</span>
       </button>
      </div>
      {/* Question Header */}
      <div className="mb-8">
       <div className="flex items-center space-x-4 mb-6">
        <div className="w-14 h-14 bg-gradient-to-br from-[#C96442] to-[#A54F35] flex items-center justify-center text-white font-bold text-lg border-2 border-gray-200 shadow-sm">
         {question.author?.fullname?.charAt(0)?.toUpperCase() || 'M'}
        </div>
        <div className="flex-1">
         <h2 className="text-lg font-bold text-gray-900">{question.author?.fullname || 'Member'}</h2>
         <p className="text-gray-500 text-sm flex items-center space-x-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{new Date(question.createdAt).toLocaleString()}</span>
         </p>
        </div>
        <div className="flex items-center space-x-3">
         <span className="px-4 py-1.5 bg-gradient-to-r from-green-100 to-green-50 text-green-800 text-sm font-semibold border border-green-200">
          Question
         </span>
         {(() => {
          const currentUserId = auth?.userId;
          const ownerId = question?.author && (question.author._id || question.author);
          const isOwner = isLoggedIn && String(ownerId || '') === String(currentUserId || '');
          if (isOwner) return null;
          return (
           <button
            onClick={handleToggleFollowAuthor}
            disabled={followInfo.loading}
            className={`text-sm font-semibold px-4 py-2 border-2 transition-all duration-200 cursor-pointer ${
             followInfo.isFollowing 
              ? 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50' 
              : 'bg-gradient-to-r from-[#C96442] to-[#B85538] text-white border-transparent hover:from-[#B85538] hover:to-[#A54F35] shadow-md hover:shadow-lg'
            }`}
           >
            {followInfo.loading ? (
             <span className="flex items-center space-x-1">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>...</span>
             </span>
            ) : (followInfo.isFollowing ? 'Following' : 'Follow')}
           </button>
          );
         })()}
        </div>
       </div>
       
       {questionEdit.editing ? (
        <div className="mb-4 space-y-3">
         <input
          type="text"
          value={questionEdit.title}
          onChange={(e) => setQuestionEdit((prev) => ({ ...prev, title: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent text-lg font-bold"
         />
        </div>
       ) : (
       <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-6 leading-tight">
        {question.title}
       </h1>
       )}
       
       <div className="flex items-center space-x-6 text-gray-600 mb-6">
        <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50">
         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
         </svg>
         <span className="font-semibold">{answers.length} answers</span>
        </div>
        {(() => {
         const currentUserId = auth?.userId;
         const ownerId = question?.author && (question.author._id || question.author);
         const isOwner = isLoggedIn && String(ownerId || '') === String(currentUserId || '');
         if (!isOwner) return null;
         return (
          <div className="flex items-center space-x-3 ml-auto">
           <button
            onClick={() => router.push(`/edit-question/${encodeURIComponent(question._id)}`)}
            className="text-sm font-semibold text-gray-600 hover:text-[#C96442] px-3 py-1.5 hover:bg-[#C96442]/10 transition-all duration-200 flex items-center space-x-1"
           >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Edit</span>
           </button>
           <button
            onClick={async () => {
             if (!isLoggedIn) { router.push('/login'); return; }
             if (!window.confirm('Delete this question? This cannot be undone.')) return;
             try {
              setQuestionEdit((prev) => ({ ...prev, deleting: true }));
              await axios.delete(`${prodServerUrl}/questions/${encodeURIComponent(question._id)}`, { headers: { 'x-auth-token': auth.accessToken } });
              router.push('/');
             } catch (err) {
              alert(err?.response?.data?.message || 'Failed to delete question');
              setQuestionEdit((prev) => ({ ...prev, deleting: false }));
             }
            }}
            disabled={questionEdit.deleting}
            className="text-sm font-semibold text-red-600 hover:text-red-700 px-3 py-1.5 hover:bg-red-50 transition-all duration-200 flex items-center space-x-1"
           >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0h8a1 1 0 001-1V5a1 1 0 00-1-1h-3.5a1 1 0 01-.894-.553L12 3l-.606.447A1 1 0 0110.5 4H7a1 1 0 00-1 1v1z" />
            </svg>
            <span>{questionEdit.deleting ? 'Deleting...' : 'Delete'}</span>
           </button>
          </div>
         );
        })()}
       </div>
      </div>

      {/* Question Content */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 md:p-10 mb-8 fade-in">
       {questionEdit.editing ? (
        <div className="space-y-3">
         <QuillEditor
          value={questionEdit.description}
          onChange={(html) => setQuestionEdit((prev) => ({ ...prev, description: html }))}
          height={350}
         />
         <div className="flex items-center space-x-3">
          <button
           onClick={async () => {
            if (!isLoggedIn) { router.push('/login'); return; }
            const title = (questionEdit.title || '').trim();
            const description = (questionEdit.description || '').trim();
            if (!title || !description) { alert('Title and description are required'); return; }
            try {
             setQuestionEdit((prev) => ({ ...prev, saving: true }));
             const { data } = await axios.put(`${prodServerUrl}/questions/${encodeURIComponent(question._id)}`, { title, description }, { headers: { 'x-auth-token': auth.accessToken } });
             const updated = data?.data;
             setQuestion((prev) => ({ ...(prev || {}), title: updated?.title || title, description: updated?.description || description, slug: updated?.slug || prev?.slug }));
             setQuestionEdit({ editing: false, saving: false, deleting: false, title: '', description: '' });
            } catch (err) {
             alert(err?.response?.data?.message || 'Failed to update question');
             setQuestionEdit((prev) => ({ ...prev, saving: false }));
            }
           }}
           disabled={questionEdit.saving}
           className="px-6 py-2.5 bg-gradient-to-r from-[#C96442] to-[#B85538] text-white hover:from-[#B85538] hover:to-[#A54F35] transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 font-semibold"
          >
           {questionEdit.saving ? 'Saving...' : 'Save'}
          </button>
          <button
           onClick={() => setQuestionEdit({ editing: false, saving: false, deleting: false, title: '', description: '' })}
           className="px-6 py-2.5 border-2 border-gray-300 hover:bg-gray-50 transition-colors font-semibold text-gray-700"
          >
           Cancel
          </button>
         </div>
        </div>
       ) : (
       <div className="prose prose-lg max-w-none prose-headings:font-bold prose-p:text-gray-700 prose-a:text-[#C96442] prose-a:no-underline hover:prose-a:underline">
         <div className="text-gray-700 text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeAndAutolink(question.description) }} />
       </div>
       )}
       
       {/* Tags */}
       {Array.isArray(question.tags) && question.tags.length > 0 && (
        <div className="mt-8 pt-8 border-t-2 border-gray-100">
         <div className="flex flex-wrap gap-2">
          {question.tags.map((tag, index) => (
           <span
            key={index}
            className="px-4 py-1.5 bg-gradient-to-r from-[#C96442]/10 to-[#C96442]/5 text-[#C96442] text-sm font-semibold border border-[#C96442]/20"
           >
            #{tag}
           </span>
          ))}
         </div>
        </div>
       )}
      </div>

      {/* Add Answer Form */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 md:p-10 mb-8">
       <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-6">
        Your Answer
       </h3>
       <form onSubmit={handleAddAnswer}>
        <textarea
         value={newAnswer}
         onChange={(e) => setNewAnswer(e.target.value)}
         placeholder="Share your knowledge and help the community by providing a detailed answer..."
         rows={8}
         className="w-full px-4 py-3 border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent mb-4 bg-gray-50 focus:bg-white transition-all duration-200 resize-none"
         required
        />
        <div className="flex justify-end">
         <button
          type="submit"
          disabled={posting}
          className="bg-gradient-to-r from-[#C96442] to-[#B85538] text-white px-8 py-3 hover:from-[#B85538] hover:to-[#A54F35] transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 font-semibold"
         >
          {posting ? 'Posting...' : 'Post Answer'}
         </button>
        </div>
       </form>
      </div>

      {/* Answers Section */}
      <div className="mb-8">
       <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-8">
        Answers ({answers.length})
       </h2>
       
       <div className="space-y-6">
        {answers.map((answer) => (
         <div key={answer._id} className={`bg-white rounded-2xl shadow-md border-2 p-6 md:p-8 transition-all duration-200 ${
          answer.isAccepted ? 'border-green-300 bg-gradient-to-br from-green-50 to-white' : 'border-gray-200 hover-lift'
         }`}>
          <div className="flex items-start space-x-4">
           <div className="w-12 h-12 bg-gradient-to-br from-[#C96442] to-[#A54F35] flex items-center justify-center text-white font-bold flex-shrink-0 border-2 border-gray-200 shadow-sm">
            {answer.author?.fullname?.charAt(0)?.toUpperCase() || 'M'}
           </div>
           <div className="flex-1">
            <div className="flex items-center space-x-3 mb-4">
             <h3 className="font-bold text-gray-900 text-lg">{answer.author?.fullname || 'Member'}</h3>
             <span className="text-gray-500 text-sm flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{new Date(answer.createdAt).toLocaleString()}</span>
             </span>
             {answer.isAccepted && (
              <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold shadow-sm flex items-center space-x-1">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
               </svg>
               <span>Accepted Answer</span>
              </span>
             )}
            </div>
            {answerEdit.id === answer._id ? (
             <div className="mb-4 space-y-2">
              <textarea
               value={answerEdit.text}
               onChange={(e) => setAnswerEdit((prev) => ({ ...prev, text: e.target.value }))}
               rows={6}
               className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent"
              />
              <div className="flex items-center space-x-3">
               <button onClick={saveEditAnswer} disabled={answerEdit.saving} className="px-6 py-2.5 bg-gradient-to-r from-[#C96442] to-[#B85538] text-white hover:from-[#B85538] hover:to-[#A54F35] transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 font-semibold">{answerEdit.saving ? 'Saving...' : 'Save'}</button>
               <button onClick={cancelEditAnswer} className="px-6 py-2.5 border-2 border-gray-300 hover:bg-gray-50 transition-colors font-semibold text-gray-700">Cancel</button>
              </div>
             </div>
            ) : (
             <div className="text-gray-700 leading-relaxed prose prose-lg max-w-none mb-6 prose-p:text-gray-700 prose-a:text-[#C96442] prose-a:no-underline hover:prose-a:underline" dangerouslySetInnerHTML={{ __html: sanitizeAndAutolink(answer.content) }} />
            )}
            <div className="flex items-center space-x-4 pt-4 border-t border-gray-100">
             <button onClick={() => handleLikeAnswer(answer._id)} className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-[#C96442] hover:bg-gray-50 transition-all duration-200 cursor-pointer">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="font-semibold">{answer.likes || 0}</span>
             </button>
             {(() => {
              const currentUserId = auth?.userId;
              const questionOwnerId = question?.author && (question.author._id || question.author);
              const canAccept = isLoggedIn && String(questionOwnerId || '') === String(currentUserId || '');
              if (!canAccept) return null;
              return (
               <button 
                onClick={() => handleAcceptAnswer(answer._id)}
                className={`px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                 answer.isAccepted 
                  ? 'text-red-600 hover:text-red-700 hover:bg-red-50' 
                  : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                }`}
               >
                {answer.isAccepted ? 'Unaccept Answer' : 'Accept Answer'}
               </button>
              );
             })()}
             {(() => {
              const currentUserId = auth?.userId;
              const answerAuthorId = answer?.author && (answer.author._id || answer.author);
              const isOwner = isLoggedIn && String(answerAuthorId || '') === String(currentUserId || '');
              return isOwner ? (
               <>
                {answerEdit.id === answer._id ? null : (
                 <button onClick={() => startEditAnswer(answer)} className="text-sm font-semibold text-gray-600 hover:text-[#C96442] px-4 py-2 hover:bg-[#C96442]/10 transition-all duration-200">Edit</button>
                )}
                <button onClick={() => deleteAnswer(answer._id)} className="text-sm font-semibold text-red-600 hover:text-red-700 px-4 py-2 hover:bg-red-50 transition-all duration-200" disabled={answerEdit.deleting}>{answerEdit.deleting && answerEdit.id === answer._id ? 'Deleting...' : 'Delete'}</button>
               </>
              ) : null;
             })()}
             {(() => {
              const currentUserId = auth?.userId;
              const answerAuthorId = answer?.author && (answer.author._id || answer.author);
              const canReply = isLoggedIn && String(answerAuthorId || '') !== String(currentUserId || '');
              if (!canReply && (replyStates[answer._id]?.items || []).length === 0) return null;
              const count = (replyStates[answer._id]?.items || []).length;
              return (
               <button 
                onClick={() => toggleReplies(answer._id)}
                className="text-[#C96442] hover:text-[#A54F35] text-sm font-semibold px-4 py-2 hover:bg-[#C96442]/10 transition-all duration-200"
               >
                {replyStates[answer._id]?.open ? 'Hide Replies' : (count > 0 ? `Show Replies (${count})` : 'Reply')}
               </button>
              );
             })()}
            </div>
            {replyStates[answer._id]?.open && (
             <div className="mt-4 space-y-4">
              {/* Reply form */}
              <div className="flex items-start space-x-2">
               <textarea
                value={replyStates[answer._id]?.newReply || ''}
                onChange={(e) => setReplyStates((prev) => ({ ...prev, [answer._id]: { ...(prev[answer._id] || {}), newReply: e.target.value } }))}
                rows={3}
                placeholder="Write a reply..."
                className="flex-1 px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent"
               />
               <button
                onClick={() => handleAddReply(answer._id)}
                disabled={replyStates[answer._id]?.posting}
                className="px-4 py-2 bg-[#C96442] text-white hover:bg-[#C96442]/90 transition-colors cursor-pointer disabled:opacity-60"
               >
                {replyStates[answer._id]?.posting ? 'Posting...' : 'Reply'}
               </button>
              </div>
              {replyStates[answer._id]?.error && (
               <div className="text-red-600 text-sm">{replyStates[answer._id]?.error}</div>
              )}
              {/* Replies list */}
              <div className="space-y-3">
               {replyStates[answer._id]?.loading && (
                <div className="py-2"><LoadingIndicator /></div>
               )}
               {(() => {
                const items = (replyStates[answer._id]?.items || []).slice().sort((a, b) => {
                 const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                 const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                 return ta - tb;
                });
                const byId = new Map(items.map((r) => [String(r._id || ''), r]));
                return items.map((rep, idx) => (
                <div key={(rep._id || idx)} className={` border border-gray-200 p-3 ${rep.parentId ? 'bg-gray-50 ml-4 border-l-4 border-gray-200' : 'bg-gray-50'}`}>
                 <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-800 font-medium">{rep.user?.fullname || 'Member'}</div>
                  <div className="flex items-center space-x-3">
                   <div className="text-xs text-gray-500">{rep.createdAt ? new Date(rep.createdAt).toLocaleString() : ''}</div>
                   {(() => {
                    const currentUserId = auth?.userId;
                    const replyAuthorId = rep?.user && (rep.user._id || rep.user);
                    const canReplyToReply = isLoggedIn && String(replyAuthorId || '') !== String(currentUserId || '');
                    const isOwner = isLoggedIn && String(replyAuthorId || '') === String(currentUserId || '');
                    return (
                     <>
                      {canReplyToReply && (
                       <button
                      onClick={() => {
                         ensureReplyState(answer._id);
                         const name = rep.user?.fullname || 'Member';
                         setReplyStates((prev) => ({
                          ...prev,
                          [answer._id]: {
                           ...(prev[answer._id] || {}),
                           open: true,
                         replyTargetId: rep._id,
                           newReply: (prev[answer._id]?.newReply && prev[answer._id]?.newReply.length > 0)
                            ? prev[answer._id].newReply
                            : `@${name} `,
                          },
                         }));
                        }}
                        className="text-[#C96442] hover:text-[#A54F35] text-xs font-medium"
                       >
                        Reply
                       </button>
                      )}
                      {isOwner && !replyStates[answer._id]?.editingReplyId && (
                       <button
                        onClick={() => setReplyStates((prev) => ({ ...prev, [answer._id]: { ...(prev[answer._id] || {}), editingReplyId: rep._id, editingReplyText: rep.content || '' } }))}
                        className="text-gray-600 hover:text-[#C96442] text-xs font-medium"
                       >
                        Edit
                       </button>
                      )}
                      {isOwner && (
                       <button
                        onClick={async () => {
                         if (!window.confirm('Delete this reply?')) return;
                         try {
                          await axios.delete(`${prodServerUrl}/questions/answers/${encodeURIComponent(answer._id)}/replies/${encodeURIComponent(rep._id)}`, { headers: { 'x-auth-token': auth.accessToken } });
                          setReplyStates((prev) => {
                           const items = (prev[answer._id]?.items || []).filter((r) => String((r._id || '')) !== String(rep._id));
                           return { ...prev, [answer._id]: { ...(prev[answer._id] || {}), items } };
                          });
                         } catch (err) {
                          alert(err?.response?.data?.message || 'Failed to delete reply');
                         }
                        }}
                        className="text-red-600 hover:text-red-700 text-xs font-medium"
                       >
                        Delete
                       </button>
                      )}
                     </>
                    );
                   })()}
                  </div>
                 </div>
                 {rep.parentId && byId.get(String(rep.parentId)) && (
                  <div className="text-xs text-gray-500 mb-1">↪︎ Replying to {byId.get(String(rep.parentId))?.user?.fullname || 'Member'}</div>
                 )}
                 {replyStates[answer._id]?.editingReplyId === rep._id ? (
                  <div className="space-y-2">
                   <textarea
                    value={replyStates[answer._id]?.editingReplyText || ''}
                    onChange={(e) => setReplyStates((prev) => ({ ...prev, [answer._id]: { ...(prev[answer._id] || {}), editingReplyText: e.target.value } }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent"
                   />
                   <div className="flex items-center space-x-2">
                    <button
                     onClick={async () => {
                      const text = (replyStates[answer._id]?.editingReplyText || '').trim();
                      if (!text) return;
                      try {
                       const { data } = await axios.put(
                        `${prodServerUrl}/questions/answers/${encodeURIComponent(answer._id)}/replies/${encodeURIComponent(rep._id)}`,
                        { content: text },
                        { headers: { 'x-auth-token': auth.accessToken } }
                       );
                       const updated = data?.data;
                       setReplyStates((prev) => {
                        const items = (prev[answer._id]?.items || []).map((r) => String((r._id || '')) === String(rep._id) ? { ...r, content: updated?.content || text } : r);
                        return { ...prev, [answer._id]: { ...(prev[answer._id] || {}), items, editingReplyId: null, editingReplyText: '' } };
                       });
                      } catch (err) {
                       alert(err?.response?.data?.message || 'Failed to update reply');
                      }
                     }}
                     className="px-3 py-1.5 bg-[#C96442] text-white hover:bg-[#C96442]/90 text-xs"
                    >
                     Save
                    </button>
                    <button
                     onClick={() => setReplyStates((prev) => ({ ...prev, [answer._id]: { ...(prev[answer._id] || {}), editingReplyId: null, editingReplyText: '' } }))}
                     className="px-3 py-1.5 border border-gray-300 hover:bg-gray-50 text-xs"
                    >
                     Cancel
                    </button>
                   </div>
                  </div>
                 ) : (
                  <div className="text-gray-700 text-sm leading-relaxed prose max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeAndAutolink(rep.content) }} />
                 )}
                </div>
                ));
               })()}
               {(!replyStates[answer._id]?.loading && (replyStates[answer._id]?.items || []).length === 0) && (
                <div className="text-gray-500 text-sm">No replies yet.</div>
               )}
              </div>
             </div>
            )}
           </div>
          </div>
         </div>
        ))}
       </div>
      </div>

      {/* Related Questions (optional: can be added later) */}
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
