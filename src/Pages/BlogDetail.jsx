'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { prodServerUrl } from '../global/server';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import LoginModal from '../components/auth/LoginModal';
import { useApp } from '../context/AppContext';
import { useSelector } from 'react-redux';

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
  const [recommended, setRecommended] = useState([]);
  const [isSaved, setIsSaved] = useState(false);

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
              <div className="text-center py-12 text-gray-600">Loading...</div>
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
          <div className="max-w-5xl mx-4xl">
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
                
                {/* Category Badge - Top Right */}
                {blog.category && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#C96442]/10 text-[#C96442]">
                    {blog.category}
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">{blog.title}</h1>
              
                    {blog.image && (
                <img
                  src={blog.image}
                  alt={blog.title}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                />
              )}

              {/* Blog Content (render server HTML) */}
              <div className="prose prose-lg max-w-none">
                {blog.description && (
                  <p className="text-gray-600 mb-6">{blog.description}</p>
                )}
                <div className="text-gray-700 leading-relaxed space-y-4" dangerouslySetInnerHTML={{ __html: blog.contentHtml || '' }} />
              </div>

              {/* Engagement Stats */}
              <div className="flex items-center space-x-6 text-gray-500 mt-8 pt-6 border-t border-gray-200">
                <button 
                  onClick={handleToggleLike}
                  className={`flex items-center space-x-2 transition-colors ${
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
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
                        </div>
                        <p className="text-gray-700 mb-3">{comment?.content}</p>
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
