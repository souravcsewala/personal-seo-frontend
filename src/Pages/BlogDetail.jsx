'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { prodServerUrl } from '../global/server';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import LoginModal from '../components/auth/LoginModal';
import { useApp } from '../context/AppContext';
import { useSelector } from 'react-redux';
import LoadingIndicator from '../components/common/LoadingIndicator';

export default function BlogDetail({ initialBlog }) {
  const router = useRouter();
  const params = useParams();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const { sidebarOpen, likePost } = useApp();
  const auth = useSelector((s) => s.auth);

  const slug = params?.slug;
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [comments, setComments] = useState([]);
  const [replyStates, setReplyStates] = useState({}); // { [commentId]: { open, loading, items, posting, newReply, error, replyTargetId, editingId, editingText } }
  const [recommended, setRecommended] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const [blogEdit, setBlogEdit] = useState({ editing: false, saving: false, deleting: false, title: '', content: '' });
  const [followInfo, setFollowInfo] = useState({ loading: false, isFollowing: false, followers: 0, following: 0 });
  const QuillEditor = dynamic(() => import('../components/common/QuillEditor'), { ssr: false });
  const titleInputRef = useRef(null);

  // Keep focus on title when entering edit mode so typing doesn't go into the content editor
  useEffect(() => {
    if (blogEdit.editing) {
      const id = setTimeout(() => {
        try { titleInputRef.current && titleInputRef.current.focus(); } catch (_) {}
      }, 0);
      return () => clearTimeout(id);
    }
  }, [blogEdit.editing]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!slug) return;
      setLoading(true);
      setError('');
      try {
        let blogIdForComments = null;
        // If server provided blog, use it and skip client fetch
        if (initialBlog) {
          const b = initialBlog;
          blogIdForComments = b?._id;
          const normalized = {
            id: b._id,
            author: {
              name: b?.author?.fullname || 'Unknown',
              avatar: (b?.author?.profileimage?.signedUrl || b?.author?.profileimage?.url) || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face'
            },
            authorId: b?.author?._id || b?.author,
            publishDate: b?.createdAt ? new Date(b.createdAt).toLocaleDateString() : '',
            category: b?.category?.name,
            title: b?.title,
            image: b?.signedUrl || b?.image,
            description: b?.metaDescription,
            isLiked: false,
            likes: b?.likesCount || 0,
            shares: b?.shareCount || 0,
            comments: Array.isArray(b?.comments) ? b.comments.length : 0,
            contentHtml: b?.content,
          };
          setBlog(normalized);
        } else {
          const resp = await axios.get(`${prodServerUrl}/blogs/${encodeURIComponent(slug)}`);
          const b = resp?.data?.data;
          if (!b) throw new Error('Blog not found');
          blogIdForComments = b?._id;
          const normalized = {
            id: b._id,
            author: {
              name: b?.author?.fullname || 'Unknown',
              avatar: (b?.author?.profileimage?.signedUrl || b?.author?.profileimage?.url) || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face'
            },
            authorId: b?.author?._id || b?.author,
            publishDate: b?.createdAt ? new Date(b.createdAt).toLocaleDateString() : '',
            category: b?.category?.name,
            title: b?.title,
            image: b?.signedUrl || b?.image,
            description: b?.metaDescription,
            isLiked: false,
            likes: b?.likesCount || 0,
            shares: b?.shareCount || 0,
            comments: Array.isArray(b?.comments) ? b.comments.length : 0,
            contentHtml: b?.content,
          };
          setBlog(normalized);
        }

        // Fetch comments by id (route supports id or slug; we have id now)
        try {
          const idForComments = blogIdForComments || (initialBlog && initialBlog._id) || null;
          if (idForComments) {
            const cm = await axios.get(`${prodServerUrl}/blogs/${idForComments}/get-all-comments`);
            const list = Array.isArray(cm?.data?.data) ? cm.data.data : [];
            setComments(list);
          } else {
            setComments([]);
          }
        } catch (_) { setComments([]); }

        // Recommended by id or slug
        try {
          const rec = await axios.get(`${prodServerUrl}/blogs/${encodeURIComponent(slug)}/recommended`);
          const items = Array.isArray(rec?.data?.data) ? rec.data.data : [];
          setRecommended(items);
        } catch (_) { setRecommended([]); }
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || err.message || 'Failed to load blog');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [slug, initialBlog]);

  // Load follow stats for the author
  useEffect(() => {
    const authorId = blog?.authorId || (initialBlog && (initialBlog.author?._id || initialBlog.author));
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
  }, [blog?.authorId, initialBlog]);

  const handleToggleFollowAuthor = async () => {
    const authorId = blog?.authorId || (initialBlog && (initialBlog.author?._id || initialBlog.author));
    if (!authorId) return;
    if (!isAuthed) { router.push('/login'); return; }
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

  // Prefetch replies for all loaded comments so they appear without toggling
  useEffect(() => {
    const controller = { cancelled: false };
    async function fetchReplies(commentId) {
      try {
        setReplyStates((prev) => ({ ...prev, [commentId]: { ...(prev[commentId] || {}), loading: true, error: '', loaded: prev[commentId]?.loaded || false, items: prev[commentId]?.items || [] } }));
        const { data } = await axios.get(`${prodServerUrl}/blogs/${encodeURIComponent(blog?.id || slug)}/comments/${encodeURIComponent(commentId)}/replies`);
        if (controller.cancelled) return;
        const items = Array.isArray(data?.data) ? data.data : [];
        setReplyStates((prev) => ({
          ...prev,
          [commentId]: {
            ...(prev[commentId] || {}),
            loading: false,
            loaded: true,
            items,
            open: items.length > 0 ? true : (prev[commentId]?.open || false),
          },
        }));
      } catch (err) {
        if (controller.cancelled) return;
        setReplyStates((prev) => ({ ...prev, [commentId]: { ...(prev[commentId] || {}), loading: false, loaded: true, error: err?.response?.data?.message || 'Failed to load replies' } }));
      }
    }
    if (Array.isArray(comments) && comments.length > 0) {
      comments.forEach((c) => {
        if (!c || !c._id) return;
        const st = replyStates[c._id];
        if (!st || !st.loaded) fetchReplies(c._id);
      });
    }
    return () => { controller.cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comments]);

  // initialize saved state
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('savedBlogs') : null;
      const arr = raw ? JSON.parse(raw) : [];
      const key = slug || blog?.id;
      if (key && Array.isArray(arr)) setIsSaved(arr.includes(key));
    } catch (_) {}
  }, [slug, blog?.id]);

  // Dummy comments data
  const isAuthed = !!auth?.isAuthenticated && !!auth?.accessToken;

  // Related posts (placeholder)
  const relatedPosts = [];

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !blog) return;
    if (!isAuthed) { router.push('/login'); return; }
    try {
      const { data } = await axios.post(`${prodServerUrl}/blogs/${blog.id}/add-comments`, { content: newComment }, {
        headers: { 'x-auth-token': auth.accessToken }
      });
      const created = data?.data;
      if (created) {
        setComments((prev) => [created, ...prev]);
        setNewComment('');
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to add comment');
    }
  };

  const ensureReplyState = (commentId) => {
    setReplyStates((prev) => prev[commentId] ? prev : { ...prev, [commentId]: { open: false, loading: false, items: [], posting: false, newReply: '', error: '', replyTargetId: null, editingId: null, editingText: '' } });
  };

  const toggleReplies = async (commentId) => {
    ensureReplyState(commentId);
    setReplyStates((prev) => {
      const curr = prev[commentId] || { open: false };
      return { ...prev, [commentId]: { ...(curr || {}), open: !curr.open } };
    });
    const state = replyStates[commentId];
    const willOpen = !(state && state.open);
    if (willOpen && (!state || !(state.items && state.items.length))) {
      try {
        setReplyStates((prev) => ({ ...prev, [commentId]: { ...(prev[commentId] || {}), loading: true, error: '' } }));
        const { data } = await axios.get(`${prodServerUrl}/blogs/${encodeURIComponent(blog.id || slug)}/comments/${encodeURIComponent(commentId)}/replies`);
        const items = Array.isArray(data?.data) ? data.data : [];
        setReplyStates((prev) => ({ ...prev, [commentId]: { ...(prev[commentId] || {}), loading: false, loaded: true, items } }));
      } catch (err) {
        setReplyStates((prev) => ({ ...prev, [commentId]: { ...(prev[commentId] || {}), loading: false, loaded: true, error: err?.response?.data?.message || 'Failed to load replies' } }));
      }
    }
  };

  const handleAddReply = async (commentId) => {
    ensureReplyState(commentId);
    const content = (replyStates[commentId]?.newReply || '').trim();
    if (!content) return;
    if (!isAuthed) { router.push('/login'); return; }
    try {
      setReplyStates((prev) => ({ ...prev, [commentId]: { ...(prev[commentId] || {}), posting: true } }));
      const { data } = await axios.post(`${prodServerUrl}/blogs/${encodeURIComponent(blog.id || slug)}/comments/${encodeURIComponent(commentId)}/replies`, { content, parentId: replyStates[commentId]?.replyTargetId || undefined }, { headers: { 'x-auth-token': auth.accessToken } });
      const created = data?.data;
      setReplyStates((prev) => {
        const prevItems = prev[commentId]?.items || [];
        return { ...prev, [commentId]: { ...(prev[commentId] || {}), posting: false, newReply: '', replyTargetId: null, items: created ? [created, ...prevItems] : prevItems } };
      });
    } catch (err) {
      setReplyStates((prev) => ({ ...prev, [commentId]: { ...(prev[commentId] || {}), posting: false, error: err?.response?.data?.message || 'Failed to reply' } }));
    }
  };

  // Toggle like via backend
  const handleToggleLike = async () => {
    if (!blog) return;
    if (!isAuthed) { router.push('/login'); return; }
    try {
      const { data } = await axios.post(`${prodServerUrl}/blogs/${blog.id}/like`, {}, {
        headers: { 'x-auth-token': auth.accessToken }
      });
      const liked = !!data?.data?.liked;
      const likesCount = Number(data?.data?.likesCount ?? (blog.likes || 0));
      setBlog((prev) => ({ ...prev, isLiked: liked, likes: likesCount }));
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to react');
    }
  };

  // Share via backend (increments shareCount)
  const handleShare = async () => {
    if (!blog) return;
    if (!isAuthed) { router.push('/login'); return; }
    try {
      const { data } = await axios.post(`${prodServerUrl}/blogs/${blog.id}/share`, {}, {
        headers: { 'x-auth-token': auth.accessToken }
      });
      const shareCount = Number(data?.data?.shareCount ?? (blog.shares || 0) + 1);
      setBlog((prev) => ({ ...prev, shares: shareCount }));
      try {
        await navigator.share?.({ title: blog.title, url: typeof window !== 'undefined' ? window.location.href : '' });
      } catch (_) {}
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to share');
    }
  };

  // Save/Unsave in localStorage
  const handleToggleSave = () => {
    try {
      const key = slug || blog?.id;
      if (!key) return;
      const raw = typeof window !== 'undefined' ? localStorage.getItem('savedBlogs') : null;
      const arr = raw ? JSON.parse(raw) : [];
      let next = Array.isArray(arr) ? arr.slice() : [];
      if (next.includes(key)) next = next.filter((x) => x !== key);
      else next.push(key);
      localStorage.setItem('savedBlogs', JSON.stringify(next));
      setIsSaved(next.includes(key));
    } catch (_) {}
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onLoginClick={() => setShowLoginModal(true)} />
        <div className="flex">
          <Sidebar />
          <main className={`flex-1 p-6 transition-all duration-300 ease-in-out ${
            sidebarOpen ? 'lg:ml-64 ml-0' : 'ml-0'
          }`}>
            <div className="max-w-4xl mx-auto">
              <div className="py-12">
                <LoadingIndicator />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onLoginClick={() => setShowLoginModal(true)} />
        <div className="flex">
          <Sidebar />
          <main className={`flex-1 p-6 transition-all duration-300 ease-in-out ${
            sidebarOpen ? 'lg:ml-64 ml-0' : 'ml-0'
          }`}>
            <div className="max-w-4xl mx-auto">
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">{error || 'Blog post not found'}</h1>
                <button
                  onClick={() => router.push('/')}
                  className="bg-[#C96442] text-white px-6 py-2 rounded-lg hover:bg-[#C96442]/90 transition-colors"
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
    <div className="min-h-screen bg-gray-50">
      <Header onLoginClick={() => setShowLoginModal(true)} />
      
      <div className="flex">
        <Sidebar />
        
        <main className={`flex-1 p-6 px-2 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'lg:ml-64 ml-0' : 'ml-0'
        }`}>
          <div className="max-w-4xl mx-auto">
            {/* Back button */}
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>

            {/* Blog Header */}
            <article className="bg-white  rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <img
                    src={blog.author.avatar}
                    alt={blog.author.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h3 className="font-medium text-gray-900">{blog.author.name}</h3>
                    <p className="text-gray-500 text-sm">{blog.publishDate}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* Category Badge - Top Right */}
                  {blog.category && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#C96442]/10 text-[#C96442]">
                      {blog.category}
                    </span>
                  )}
                  {(() => {
                    const currentUserId = auth?.userId;
                    const isOwner = !!currentUserId && String(blog.authorId || '') === String(currentUserId || '');
                    if (isOwner) return null;
                    return (
                      <button
                        onClick={handleToggleFollowAuthor}
                        disabled={followInfo.loading}
                        className={`text-sm font-medium px-3 py-1.5 rounded-lg border cursor-pointer ${followInfo.isFollowing ? 'bg-gray-100 text-gray-800 border-gray-300' : 'bg-[#C96442] text-white border-[#C96442] hover:bg-[#C96442]/90'}`}
                        aria-label={followInfo.isFollowing ? 'Unfollow author' : 'Follow author'}
                      >
                        {followInfo.loading ? '...' : (followInfo.isFollowing ? 'Following' : 'Follow')}
                      </button>
                    );
                  })()}
                  {(() => {
                    const currentUserId = auth?.userId;
                    const isOwner = !!currentUserId && String(blog.authorId || '') === String(currentUserId || '');
                    if (!isOwner) return null;
                    return (
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => router.push(`/edit-blog/${encodeURIComponent(blog.id)}`)}
                          className="text-sm font-medium text-gray-600 hover:text-[#C96442]"
                          aria-label="Edit blog"
                        >
                          Edit
                        </button>
                        <button
                          onClick={async () => {
                            if (!auth?.isAuthenticated || !auth?.accessToken) { router.push('/login'); return; }
                            if (!window.confirm('Delete this blog? This cannot be undone.')) return;
                            try {
                              setBlogEdit((prev) => ({ ...prev, deleting: true }));
                              await axios.delete(`${prodServerUrl}/blogs/delete-blog/${encodeURIComponent(blog.id)}`, { headers: { 'x-auth-token': auth.accessToken } });
                              router.push('/');
                            } catch (err) {
                              alert(err?.response?.data?.message || 'Failed to delete blog');
                              setBlogEdit((prev) => ({ ...prev, deleting: false }));
                            }
                          }}
                          disabled={blogEdit.deleting}
                          className="text-sm font-medium text-red-600 hover:text-red-700"
                        >
                          {blogEdit.deleting ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {blogEdit.editing ? (
                <div className="mb-4 space-y-3">
                  <input
                    type="text"
                    value={blogEdit.title}
                    onChange={(e) => setBlogEdit((prev) => ({ ...prev, title: e.target.value }))}
                    onFocus={() => {
                      try {
                        const active = typeof document !== 'undefined' ? document.activeElement : null;
                        const editorEl = typeof document !== 'undefined' ? document.querySelector('.ql-editor') : null;
                        if (editorEl && (active === editorEl || (active && editorEl.contains(active)))) {
                          editorEl.blur();
                        }
                      } catch (_) {}
                    }}
                    ref={titleInputRef}
                    autoFocus
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent text-lg font-bold"
                  />
                </div>
              ) : (
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{blog.title}</h1>
              )}
              
                    {blog.image && (
                <img
                  src={blog.image}
                  alt={blog.title}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                />
              )}

              {/* Blog Content (render server HTML) */}
              <div className="prose prose-lg max-w-none">
                {blog.description && !blogEdit.editing && (
                  <p className="text-gray-600 mb-6">{blog.description}</p>
                )}
                {blogEdit.editing ? (
                  <div className="space-y-3">
                    <QuillEditor
                      value={blogEdit.content}
                      onChange={(html) => setBlogEdit((prev) => ({ ...prev, content: html }))}
                      height={350}
                      autoFocusEditor={false}
                    />
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={async () => {
                          if (!auth?.isAuthenticated || !auth?.accessToken) { router.push('/login'); return; }
                          const title = (blogEdit.title || '').trim();
                          const content = (blogEdit.content || '').trim();
                          if (!title || !content) { alert('Title and content are required'); return; }
                          try {
                            setBlogEdit((prev) => ({ ...prev, saving: true }));
                            const { data } = await axios.put(`${prodServerUrl}/blogs/update-blog/${encodeURIComponent(blog.id)}`, { title, content }, { headers: { 'x-auth-token': auth.accessToken } });
                            const updated = data?.data;
                            setBlog((prev) => ({ ...(prev || {}), title: updated?.title || title, contentHtml: updated?.content || content }));
                            setBlogEdit({ editing: false, saving: false, deleting: false, title: '', content: '' });
                          } catch (err) {
                            alert(err?.response?.data?.message || 'Failed to update blog');
                            setBlogEdit((prev) => ({ ...prev, saving: false }));
                          }
                        }}
                        disabled={blogEdit.saving}
                        className="px-4 py-2 bg-[#C96442] text-white rounded-lg hover:bg-[#C96442]/90 transition-colors disabled:opacity-60"
                      >
                        {blogEdit.saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setBlogEdit({ editing: false, saving: false, deleting: false, title: '', content: '' })}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-700 leading-relaxed space-y-4" dangerouslySetInnerHTML={{ __html: blog.contentHtml || '' }} />
                )}
              </div>

              {/* Engagement Stats */}
              <div className="flex items-center space-x-6 text-gray-500 mt-8 pt-6 border-t border-gray-200">
                <button 
                  onClick={handleToggleLike}
                  className={`flex items-center space-x-2 transition-colors cursor-pointer ${
                    blog.isLiked 
                      ? 'text-[#C96442]' 
                      : 'text-gray-500 hover:text-[#C96442]'
                  }`}
                >
                  <svg 
                    className="w-5 h-5" 
                    fill={blog.isLiked ? "#C96442" : "none"} 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 12.75c0-1.243 1.007-2.25 2.25-2.25H8.4c.621 0 1.216-.246 1.654-.684l3.6-3.6a2.25 2.25 0 113.182 3.182L15 10.5h4.5A2.25 2.25 0 0121.75 12.75l-1.125 5.063A2.25 2.25 0 0118.4 20.25H9.75A2.25 2.25 0 017.5 18v-5.25H4.5a2.25 2.25 0 01-2.25-2.25z" />
                  </svg>
                  <span>{blog.likes}</span>
                </button>
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03 8 9 8s9-3.582 9-8z" />
                  </svg>
                  <span>{blog.comments}</span>
                </div>
                <button onClick={handleShare} className="flex items-center space-x-2 hover:text-[#C96442] transition-colors cursor-pointer">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684z" />
                  </svg>
                  <span>{blog.shares}</span>
                </button>
                <button onClick={handleToggleSave} className={`hover:text-[#C96442] transition-colors cursor-pointer ${isSaved ? 'text-[#C96442]' : ''}`}>
                  <svg className="w-5 h-5" fill={isSaved ? '#C96442' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
              </div>
            </article>

            {/* Comments Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Comments ({comments.length})</h2>
              
              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="mb-8">
                <div className="flex space-x-4">
                  <img
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
                    alt="Your avatar"
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your thoughts..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent resize-none"
                      rows={3}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="bg-[#C96442] text-white px-6 py-2 rounded-lg hover:bg-[#C96442]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Post Comment
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              {/* Comments List */}
              <div className="space-y-6">
                {comments.map((comment, idx) => {
                  const avatar = (comment?.user?.profileimage?.signedUrl || comment?.user?.profileimage?.url) || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face";
                  const name = comment?.user?.fullname || "User";
                  const when = comment?.createdAt ? new Date(comment.createdAt).toLocaleString() : '';
                  const canEdit = isAuthed && (auth?.userId && String(comment?.user?._id || comment?.user) === String(auth.userId));
                  const canReplyToComment = isAuthed;
                  const [editing, setEditing] = [false, () => {}];
                  return (
                    <div key={comment?._id || comment?.id || idx} className="flex space-x-4">
                      <img
                        src={avatar}
                        alt={name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-gray-900">{name}</span>
                          {when && <span className="text-gray-500 text-sm">{when}</span>}
                          {canEdit && (
                            <>
                              <button onClick={async () => {
                                const next = prompt('Edit your comment', comment?.content || '');
                                if (next === null) return;
                                try {
                                  const { data } = await axios.put(`${prodServerUrl}/blogs/${blog.id}/comments/${comment._id}`, { content: next }, { headers: { 'x-auth-token': auth.accessToken } });
                                  const updated = data?.data;
                                  if (updated) {
                                    setComments((prev) => prev.map((c) => String(c._id) === String(comment._id) ? updated : c));
                                  }
                                } catch (err) { alert(err?.response?.data?.message || 'Failed to edit comment'); }
                              }} className="text-xs text-blue-600 hover:underline cursor-pointer">Edit</button>
                              <button onClick={async () => {
                                if (!confirm('Delete this comment?')) return;
                                try {
                                  await axios.delete(`${prodServerUrl}/blogs/${blog.id}/comments/${comment._id}`, { headers: { 'x-auth-token': auth.accessToken } });
                                  setComments((prev) => prev.filter((c) => String(c._id) !== String(comment._id)));
                                } catch (err) { alert(err?.response?.data?.message || 'Failed to delete comment'); }
                              }} className="text-xs text-red-600 hover:underline cursor-pointer ml-2">Delete</button>
                            </>
                          )}
                          {(() => {
                            const count = (replyStates[comment._id]?.items || []).length;
                            if (!canReplyToComment && count === 0) return null;
                            return (
                              <button onClick={() => toggleReplies(comment._id)} className="text-xs text-[#C96442] hover:text-[#A54F35] cursor-pointer ml-2">
                                {replyStates[comment._id]?.open ? 'Hide Replies' : (count > 0 ? `Show Replies (${count})` : 'Reply')}
                              </button>
                            );
                          })()}
                        </div>
                        <p className="text-gray-700 mb-3">{comment?.content}</p>
                        {replyStates[comment._id]?.open && (
                          <div className="space-y-3">
                            {(() => {
                              const targetId = replyStates[comment._id]?.replyTargetId || null;
                              const target = (replyStates[comment._id]?.items || []).find((r) => String(r?._id) === String(targetId));
                              if (!canReplyToComment && !targetId) {
                                return (
                                  <div className="text-sm text-gray-500">Select a reply below to respond.</div>
                                );
                              }
                              return (
                                <div className="flex-1">
                                  {target && (
                                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                      <span>
                                        Replying to <span className="font-medium">{target?.user?.fullname || 'Member'}</span>
                                      </span>
                                      <button
                                        onClick={() => setReplyStates((prev) => ({ ...prev, [comment._id]: { ...(prev[comment._id] || {}), replyTargetId: null } }))}
                                        className="text-[#C96442] hover:text-[#A54F35] cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  )}
                                  <div className="flex items-start space-x-2">
                                    <textarea
                                      value={replyStates[comment._id]?.newReply || ''}
                                      onChange={(e) => setReplyStates((prev) => ({ ...prev, [comment._id]: { ...(prev[comment._id] || {}), newReply: e.target.value } }))}
                                      rows={3}
                                      placeholder="Write a reply..."
                                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent"
                                    />
                                    <button
                                      onClick={() => handleAddReply(comment._id)}
                                      disabled={replyStates[comment._id]?.posting}
                                      className="px-4 py-2 bg-[#C96442] text-white rounded-lg hover:bg-[#C96442]/90 transition-colors cursor-pointer disabled:opacity-60"
                                    >
                                      {replyStates[comment._id]?.posting ? 'Posting...' : 'Reply'}
                                    </button>
                                  </div>
                                </div>
                              );
                            })()}
                            {replyStates[comment._id]?.loading && (
                              <div className="py-2"><LoadingIndicator /></div>
                            )}
                            {(() => {
                              const items = (replyStates[comment._id]?.items || []).slice().sort((a, b) => {
                                const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                                const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                                return ta - tb;
                              });
                              const byId = new Map(items.map((r) => [String(r._id || ''), r]));
                              return items.map((rep, rIdx) => (
                                <div key={(rep._id || rIdx)} className={`ml-6 rounded border border-gray-200 p-3 ${rep.parentId ? 'bg-gray-50 border-l-4 border-gray-200' : 'bg-gray-50'}`}>
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="text-sm text-gray-800 font-medium">{rep.user?.fullname || 'Member'}</div>
                                  <div className="flex items-center space-x-3">
                                    <div className="text-xs text-gray-500">{rep.createdAt ? new Date(rep.createdAt).toLocaleString() : ''}</div>
                                    {(() => {
                                      const currentUserId = auth?.userId;
                                      const replyAuthorId = rep?.user && (rep.user._id || rep.user);
                                      const canReplyToReply = isAuthed && String(replyAuthorId || '') !== String(currentUserId || '');
                                      const isOwner = isAuthed && String(replyAuthorId || '') === String(currentUserId || '');
                                      return (
                                        <>
                                          {canReplyToReply && (
                                            <button
                                              onClick={() => {
                                                ensureReplyState(comment._id);
                                                const name = rep.user?.fullname || 'Member';
                                                setReplyStates((prev) => ({
                                                  ...prev,
                                                  [comment._id]: {
                                                    ...(prev[comment._id] || {}),
                                                    open: true,
                                                    replyTargetId: rep._id,
                                                    newReply: (prev[comment._id]?.newReply && prev[comment._id]?.newReply.length > 0)
                                                      ? prev[comment._id].newReply
                                                      : `@${name} `,
                                                  },
                                                }));
                                              }}
                                              className="text-[#C96442] hover:text-[#A54F35] text-xs font-medium"
                                            >
                                              Reply
                                            </button>
                                          )}
                                          {isOwner && !replyStates[comment._id]?.editingId && (
                                            <button
                                              onClick={() => setReplyStates((prev) => ({ ...prev, [comment._id]: { ...(prev[comment._id] || {}), editingId: rep._id, editingText: rep.content || '' } }))}
                                              className="text-gray-600 hover:text-[#C96442] text-xs font-medium"
                                            >
                                              Edit
                                            </button>
                                          )}
                                          {isOwner && (
                                            <button
                                              onClick={async () => {
                                                if (!confirm('Delete this reply?')) return;
                                                try {
                                                  await axios.delete(`${prodServerUrl}/blogs/${encodeURIComponent(blog.id || slug)}/comments/${encodeURIComponent(comment._id)}/replies/${encodeURIComponent(rep._id)}`, { headers: { 'x-auth-token': auth.accessToken } });
                                                  setReplyStates((prev) => {
                                                    const items = (prev[comment._id]?.items || []).filter((r) => String((r._id || '')) !== String(rep._id));
                                                    return { ...prev, [comment._id]: { ...(prev[comment._id] || {}), items } };
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
                                  {replyStates[comment._id]?.editingId === rep._id ? (
                                    <div className="space-y-2">
                                      <textarea
                                        value={replyStates[comment._id]?.editingText || ''}
                                        onChange={(e) => setReplyStates((prev) => ({ ...prev, [comment._id]: { ...(prev[comment._id] || {}), editingText: e.target.value } }))}
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent"
                                      />
                                      <div className="flex items-center space-x-2">
                                        <button
                                          onClick={async () => {
                                            const text = (replyStates[comment._id]?.editingText || '').trim();
                                            if (!text) return;
                                            try {
                                              const { data } = await axios.put(`${prodServerUrl}/blogs/${encodeURIComponent(blog.id || slug)}/comments/${encodeURIComponent(comment._id)}/replies/${encodeURIComponent(rep._id)}`, { content: text }, { headers: { 'x-auth-token': auth.accessToken } });
                                              const updated = data?.data;
                                              setReplyStates((prev) => {
                                                const items = (prev[comment._id]?.items || []).map((r) => String((r._id || '')) === String(rep._id) ? { ...r, content: updated?.content || text } : r);
                                                return { ...prev, [comment._id]: { ...(prev[comment._id] || {}), items, editingId: null, editingText: '' } };
                                              });
                                            } catch (err) {
                                              alert(err?.response?.data?.message || 'Failed to update reply');
                                            }
                                          }}
                                          className="px-3 py-1.5 bg-[#C96442] text-white rounded hover:bg-[#C96442]/90 text-xs"
                                        >
                                          Save
                                        </button>
                                        <button
                                          onClick={() => setReplyStates((prev) => ({ ...prev, [comment._id]: { ...(prev[comment._id] || {}), editingId: null, editingText: '' } }))}
                                          className="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 text-xs"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-gray-700 text-sm leading-relaxed">{rep.content}</div>
                                  )}
                                </div>
                              ));
                            })()}
                            {(!replyStates[comment._id]?.loading && (replyStates[comment._id]?.items || []).length === 0) && (
                              <div className="text-gray-500 text-sm">No replies yet.</div>
                            )}
                          </div>
                        )}
                        {/* like button placeholder for comments */}
                      </div>
                    </div>
                  );
                })}
                {comments.length === 0 && (
                  <div className="text-gray-600">No comments yet. Be the first to comment.</div>
                )}
              </div>
            </div>

            {/* Recommended Posts */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Recommended for You</h2>
              <div className="space-y-6">
                    {recommended.map((post) => (
                  <div key={post._id} className="flex space-x-4 cursor-pointer hover:bg-gray-50 p-4 rounded-lg transition-colors" onClick={() => router.push(`/blog/${encodeURIComponent(post.slug || post._id)}`)}>
                    { (post.signedUrl || post.image) && (
                      <img
                        src={post.signedUrl || post.image}
                        alt={post.title}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{post.title}</h3>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">{post.metaDescription}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{post?.author?.fullname}</span>
                        <span>•</span>
                        <span>{post?.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {recommended.length === 0 && (
                  <div className="text-gray-600">No recommendations available.</div>
                )}
              </div>
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
