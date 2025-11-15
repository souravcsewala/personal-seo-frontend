'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import LoginModal from '../components/auth/LoginModal';
import { useApp } from '../context/AppContext';
import Link from 'next/link';
import axios from 'axios';
import { prodServerUrl } from '../global/server';
import { useSelector } from '../redux/useSelectorSafe';

export default function BloggerProfile() {
 const router = useRouter();
 const params = useParams();
 const [showLoginModal, setShowLoginModal] = useState(false);
 const { sidebarOpen } = useApp();

 const [items, setItems] = useState([]);
 const [questionItems, setQuestionItems] = useState([]);
 const [author, setAuthor] = useState({ name: '', avatar: '' });
 const [authorId, setAuthorId] = useState('');
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState('');
 const [page, setPage] = useState(1);
 const [hasMore, setHasMore] = useState(true);
 const limit = 100;
 const auth = useSelector((s) => s.auth, { isAuthenticated: false, accessToken: null });
 const [followInfo, setFollowInfo] = useState({ loading: false, isFollowing: false, followers: 0, following: 0 });
 const [activeTab, setActiveTab] = useState('blogs');

 if (!params) {
  return <div>Loading...</div>;
 }

 const { name } = params;
 const decodedName = decodeURIComponent(name || '');

 const resolveAuthorAndMaybeSet = async () => {
  try {
   const { data } = await axios.get(`${prodServerUrl}/blogs/search`, { params: { q: decodedName, page: 1, limit: 5 } });
   const raw = Array.isArray(data?.data) ? data.data : [];
   const match = raw.find((d) => (d?.author?.fullname || '').toLowerCase() === decodedName.toLowerCase());
   if (match && match.author) {
    const id = match.author._id || '';
    if (id) setAuthorId(id);
    setAuthor({
     name: match.author.fullname || decodedName,
     avatar: match.author.profileimage?.signedUrl || match.author.profileimage?.url || '',
    });
    return id;
   }
   return '';
  } catch (_) {
   return '';
  }
 };

 const fetchPage = async (pageToLoad) => {
  if (loading || !decodedName) return;
  setLoading(true);
  setError('');
  try {
   let useAuthorId = authorId;
   if (!useAuthorId) {
    useAuthorId = await resolveAuthorAndMaybeSet();
    setAuthorId(useAuthorId || '');
   }
   if (!useAuthorId) {
    setHasMore(false);
    setItems(pageToLoad === 1 ? [] : items);
    setError('No posts found for this author.');
    return;
   }
   const { data } = await axios.get(`${prodServerUrl}/blogs/get-blog-by-author/${encodeURIComponent(useAuthorId)}`, {
    params: { page: pageToLoad, limit },
   });
   console.log("author data",data)
   const arr = Array.isArray(data?.data) ? data.data : [];
   const mapped = arr.map((d) => {
    const authorAvatar = (d?.author?.profileimage?.signedUrl || d?.author?.profileimage?.url || '');
    return {
     id: d?._id,
     slug: d?.slug,
     title: d?.title || '',
     description: d?.metaDescription || '',
     image: d?.signedUrl || d?.image || '',
     imageAlt: d?.imageAlt || d?.title || 'Featured image',
     publishDate: d?.createdAt ? new Date(d.createdAt).toLocaleDateString() : '',
     likes: Number(d?.likesCount || 0),
     comments: Array.isArray(d?.comments) ? d.comments.length : 0,
     author: {
      name: d?.author?.fullname || decodedName,
      avatar: authorAvatar,
     }
    };
   });
   setItems((prev) => (pageToLoad === 1 ? mapped : [...prev, ...mapped]));
   if (pageToLoad === 1) {
    const a = mapped[0]?.author;
    if (a && (a.name || a.avatar)) setAuthor(a);
    // also load questions for this author for the Questions tab
    try {
     const qRes = await axios.get(`${prodServerUrl}/questions/by-author/${encodeURIComponent(useAuthorId)}`, { params: { page: 1, limit } });
     const qArr = Array.isArray(qRes?.data?.data) ? qRes.data.data : [];
     const mappedQ = qArr.map((q) => ({
      id: q?._id,
      slug: q?.slug,
      title: q?.title || '',
      description: q?.description || '',
      publishDate: q?.createdAt ? new Date(q.createdAt).toLocaleDateString() : '',
      comments: Array.isArray(q?.answers) ? q.answers.length : 0,
      author: {
       name: q?.author?.fullname || decodedName,
      }
     }));
     setQuestionItems(mappedQ);
    } catch (_) { setQuestionItems([]); }
   }
   const total = Number(data?.pagination?.total || 0);
   const nextHasMore = pageToLoad * limit < total;
   setHasMore(nextHasMore);
   setPage(pageToLoad);
  } catch (e) {
   setError(e?.response?.data?.message || e.message || 'Failed to load posts');
   setHasMore(false);
  } finally {
   setLoading(false);
  }
 };

 useEffect(() => {
  setItems([]);
  setAuthor({ name: '', avatar: '' });
  setPage(1);
  setHasMore(true);
  if (decodedName) fetchPage(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [decodedName]);

 // Load follow stats when authorId is known
 useEffect(() => {
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
 }, [authorId]);

 const handleToggleFollowAuthor = async () => {
  if (!authorId) return;
  if (!(auth?.isAuthenticated && auth?.accessToken)) { try { router.push('/login'); } catch (_) {} return; }
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

 const totalLikes = useMemo(() => items.reduce((sum, p) => sum + (p.likes || 0), 0), [items]);
 const totalComments = useMemo(() => items.reduce((sum, p) => sum + (p.comments || 0), 0), [items]);

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
       className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors cursor-pointer"
      >
       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
       </svg>
       <span>Back</span>
      </button>

      <div className="bg-white shadow-sm border border-gray-200 p-8 mb-8">
       <div className="flex items-center space-x-6">
         <img
         src={author.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face'}
         alt={author.name || decodedName}
         className="w-24 h-24 object-cover"
        /> 
        <div>
         <h1 className="text-3xl font-bold text-gray-900 mb-1">{author.name || decodedName}</h1>
         <p className="text-gray-600 mb-3">Posts authored by {author.name || decodedName}</p>
         <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600">Followers: {followInfo.followers}</span>
          <span className="text-sm text-gray-600">Following: {followInfo.following}</span>
          <button
           onClick={handleToggleFollowAuthor}
           disabled={followInfo.loading}
           className={`text-sm font-medium px-3 py-1.5 border cursor-pointer ${followInfo.isFollowing ? 'bg-gray-100 text-gray-800 border-gray-300' : 'bg-[#C96442] text-white border-[#C96442] hover:bg-[#C96442]/90'}`}
          >
           {followInfo.loading ? '...' : (followInfo.isFollowing ? 'Following' : 'Follow')}
          </button>
         </div>
         {/* <div className="flex flex-wrap gap-4 text-sm text-gray-500">
          <span>📍 N/A</span>
          <span>🌐 <span className="text-gray-400">N/A</span></span>
          <span>Joined N/A</span>
         </div> */}
        </div>
       </div>
       {/* author stats hidden as requested */}
      </div>

      <div className="space-y-6">
       <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-gray-900">Authored by {author.name || decodedName}</h2>
        <div className="flex space-x-2">
         <button onClick={() => setActiveTab('blogs')} className={`px-3 py-1.5 text-sm font-medium cursor-pointer ${activeTab==='blogs' ? 'bg-[#C96442] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Blogs</button>
         <button onClick={() => setActiveTab('questions')} className={`px-3 py-1.5 text-sm font-medium cursor-pointer ${activeTab==='questions' ? 'bg-[#C96442] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Questions</button>
        </div>
       </div>

       {error && (
        <div className="border border-red-300 bg-red-50 p-4 text-red-700">{error}</div>
       )}

       {activeTab === 'blogs' && items.length === 0 && !loading ? (
        <div className="text-center py-12">
         <p className="text-gray-500">No posts found for this author.</p>
        </div>
       ) : activeTab === 'blogs' ? (
        <div className="space-y-6">
         {items.map((post) => (
          <article key={post.id} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
           <div className="flex items-center space-x-3 mb-4">
             <img
             src={post.author.avatar}
             alt={post.author.name}
             className="w-10 h-10 "
            /> 
            <div className="flex-1">
             <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">{post.author.name}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">{post.publishDate}</span>
              <span className="text-gray-400">•</span>
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800">Blog</span>
             </div>
            </div>
           </div>

           <h3
            className="text-xl font-bold text-gray-900 mb-3 cursor-pointer hover:text-[#C96442] transition-colors"
            onClick={() => {
             const slug = post.slug || post.id;
             if (slug) router.push(`/blog/${encodeURIComponent(slug)}`);
            }}
           >
            {post.title}
           </h3>
           <p className="text-gray-600 mb-4">{post.description}</p>

           {post.image && (
            <img
             src={post.image}
             alt={post.title}
             className="w-full h-48 object-cover mb-4"
            />
           )}

           <div className="flex items-center space-x-6 text-gray-500">
            <div className="flex items-center space-x-2">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
             </svg>
             <span>{post.likes || 0}</span>
            </div>
            <div className="flex items-center space-x-2">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
             </svg>
             <span>{post.comments || 0}</span>
            </div>
           </div>
          </article>
         ))}
         {hasMore && (
          <div className="pt-2">
           <button
            disabled={loading}
            onClick={() => fetchPage(page + 1)}
            className={`w-full bg-[#C96442] hover:bg-[#A54F35] text-white px-4 py-2 transition-colors cursor-pointer ${loading ? 'opacity-75' : ''}`}
           >
            {loading ? 'Loading...' : 'Load More'}
           </button>
          </div>
         )}
        </div>
       ) : (
        <div className="space-y-6">
         {questionItems.map((q) => (
          <article key={q.id} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
           <div className="flex items-center space-x-3 mb-4">
            <div className="flex-1">
             <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">{q.author.name}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">{q.publishDate}</span>
              <span className="text-gray-400">•</span>
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800">Question</span>
             </div>
            </div>
           </div>
           <h3
            className="text-xl font-bold text-gray-900 mb-3 cursor-pointer hover:text-[#C96442] transition-colors"
            onClick={() => {
             const slug = q.slug || q.id;
             if (slug) router.push(`/question/${encodeURIComponent(slug)}`);
            }}
           >
            {q.title}
           </h3>
           <div className="text-gray-700 leading-relaxed prose max-w-none mb-4" dangerouslySetInnerHTML={{ __html: q.description }} />
           <div className="flex items-center space-x-6 text-gray-500">
            <div className="flex items-center space-x-2">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
             </svg>
             <span>{q.comments || 0}</span>
            </div>
           </div>
          </article>
         ))}
         {questionItems.length === 0 && (
          <div className="text-center py-12">
           <p className="text-gray-500">No questions found for this author.</p>
          </div>
         )}
        </div>
       )}
      </div>
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
