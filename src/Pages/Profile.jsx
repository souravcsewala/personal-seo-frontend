"use client";

import { useEffect, useRef, useState } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import LoginModal from '../components/auth/LoginModal';
// import ProfileEditModal from '../components/auth/ProfileEditModal';
// import ContentEditModal from '../components/ContentEditModal';
import { useApp } from '../context/AppContext';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { prodServerUrl } from '../global/server';
import { useRouter } from 'next/navigation';

export default function Profile() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ fullname: '', bio: '', location: '', website: '', socialLink: '', phone: '', profileimage: null });
  const [showContentEditModal, setShowContentEditModal] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const { sidebarOpen, likePost } = useApp();
  const [activeTab, setActiveTab] = useState('posts');
  const auth = useSelector((s) => s.auth);
  const isLoggedIn = (() => {
    if (auth?.isAuthenticated && auth?.accessToken) return true;
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('authState') : null;
      const stored = raw ? JSON.parse(raw) : null;
      return !!(stored && stored.accessToken);
    } catch (_) { return false; }
  })();
  const router = useRouter();
  const isValidHttpUrl = (val) => {
    try { const u = new URL(String(val)); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; }
  };

  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0, likes: 0 });

  const [currentUserId, setCurrentUserId] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [interests, setInterests] = useState([]); // [{_id,name}]
  const [allCats, setAllCats] = useState([]);
  const [modalInterests, setModalInterests] = useState([]);
  const [postsPage, setPostsPage] = useState(1);
  const [postsLimit] = useState(30);
  const [postsHasMore, setPostsHasMore] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const loadMoreRef = useRef(null);

  const [userQuestions, setUserQuestions] = useState([]);
  const [questionsPage, setQuestionsPage] = useState(1);
  const [questionsLimit] = useState(30);
  const [questionsHasMore, setQuestionsHasMore] = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  const [userPolls, setUserPolls] = useState([
    {
      id: 1,
      title: "What's your biggest SEO challenge in 2024?",
      date: "3 days ago",
      votes: 45,
      tags: ["SEO", "Challenges"],
      options: [
        { text: "Technical SEO", votes: 15 },
        { text: "Content Strategy", votes: 12 },
        { text: "Link Building", votes: 18 }
      ]
    }
  ]);

  // Load profile, stats, and user's posts
  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    let token = auth?.accessToken;
    if (!token) {
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem('authState') : null;
        const stored = raw ? JSON.parse(raw) : null;
        token = stored?.accessToken || null;
      } catch (_) {}
    }
    if (!token) return;
    const headers = { 'x-auth-token': token };
    (async () => {
      try {
        const [profileRes, statsRes, catsRes] = await Promise.all([
          axios.get(`${prodServerUrl}/auth/user-profile`, { headers }),
          axios.get(`${prodServerUrl}/auth/user-stats`, { headers }),
          axios.get(`${prodServerUrl}/get-all-category`),
        ]);
        const profile = profileRes?.data?.data || {};
        if (profile && profile._id) setCurrentUserId(profile._id);
        setUserData({
          name: profile.fullname || '',
          handle: profile.email ? `@${profile.email.split('@')[0]}` : '',
          avatar: profile?.profileimage?.signedUrl || profile?.profileimage?.url || '',
          location: profile?.location || '',
          website: profile?.website || '',
          badges: [],
        });
        const its = Array.isArray(profile?.interested_topic) ? profile.interested_topic : [];
        setInterests(its.map(c => ({ _id: c?._id || c, name: c?.name || '' })).filter(x => x._id));
        const cats = Array.isArray(catsRes?.data?.data) ? catsRes.data.data : [];
        setAllCats(cats.map(c => ({ _id: c._id, name: c.name })));
        setEditForm({
          fullname: profile.fullname || '',
          bio: profile.bio || '',
          location: profile.location || '',
          website: profile.website || '',
          socialLink: profile.socialLink || '',
          phone: profile.phone || '',
          profileimage: null,
        });
        const s = statsRes?.data?.data || {};
        setStats({
          posts: Number(s.posts || 0),
          followers: Number(s.followers || 0),
          following: Number(s.following || 0),
          likes: Number(s.likes || 0),
        });
      } catch (_) {}
    })();
  }, [isLoggedIn, auth?.accessToken]);

  // Load posts with pagination
  const loadUserPosts = async (page, userIdParam) => {
    if (!isLoggedIn || postsLoading || !postsHasMore) return;
    const targetUserId = userIdParam || currentUserId || auth?.user?._id || auth?.userId || null;
    if (!targetUserId) return;
    setPostsLoading(true);
    let token = auth?.accessToken;
    if (!token) {
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem('authState') : null;
        const stored = raw ? JSON.parse(raw) : null;
        token = stored?.accessToken || null;
      } catch (_) {}
    }
    const headers = token ? { 'x-auth-token': token } : {};
    try {
      const { data } = await axios.get(`${prodServerUrl}/blogs/get-blog-by-author/${encodeURIComponent(targetUserId)}`, {
        headers,
        params: { page, limit: postsLimit },
      });
      const items = data?.data || [];
      const total = Number(data?.pagination?.total || 0);
      const mapped = items.map((d) => ({
        id: d._id,
        slug: d.slug,
        title: d.title,
        excerpt: d.metaDescription || '',
        image: d.signedUrl || d.image || '',
        imageAlt: d.imageAlt || d.title || 'Featured image',
        tags: Array.isArray(d.tags) ? d.tags : [],
        date: d?.createdAt ? new Date(d.createdAt).toLocaleDateString() : '',
        isLiked: false,
        likes: Number(d.likesCount || 0),
        comments: Array.isArray(d.comments) ? d.comments.length : 0,
      }));
      setUserPosts((prev) => (page === 1 ? mapped : [...prev, ...mapped]));
      const nextHasMore = page * postsLimit < total;
      setPostsHasMore(nextHasMore);
      setPostsPage(page);
    } catch (_) {
      // on error, stop further auto-loading to avoid loops
      setPostsHasMore(false);
    } finally {
      setPostsLoading(false);
    }
  };

  // Reset and load first page when auth ready
  useEffect(() => {
    if (!isLoggedIn) return;
    if (!currentUserId) return;
    setUserPosts([]);
    setPostsPage(1);
    setPostsHasMore(true);
    loadUserPosts(1, currentUserId);
    // Reset questions
    setUserQuestions([]);
    setQuestionsPage(1);
    setQuestionsHasMore(true);
  }, [isLoggedIn, auth?.accessToken, currentUserId]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!isLoggedIn) return;
    if (!currentUserId) return;
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting) {
        if (activeTab === 'posts' && postsHasMore && !postsLoading) {
          loadUserPosts(postsPage + 1, currentUserId);
        }
        if (activeTab === 'questions' && questionsHasMore && !questionsLoading) {
          loadUserQuestions(questionsPage + 1, currentUserId);
        }
      }
    }, { root: null, rootMargin: '0px', threshold: 1.0 });
    observer.observe(el);
    return () => { observer.disconnect(); };
  }, [isLoggedIn, postsHasMore, postsLoading, postsPage, questionsHasMore, questionsLoading, questionsPage, activeTab, currentUserId]);

  // Load questions
  const loadUserQuestions = async (page, userIdParam) => {
    if (!isLoggedIn || questionsLoading || !questionsHasMore) return;
    const targetUserId = userIdParam || currentUserId || auth?.user?._id || auth?.userId || null;
    if (!targetUserId) return;
    setQuestionsLoading(true);
    let token = auth?.accessToken;
    if (!token) {
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem('authState') : null;
        const stored = raw ? JSON.parse(raw) : null;
        token = stored?.accessToken || null;
      } catch (_) {}
    }
    const headers = token ? { 'x-auth-token': token } : {};
    try {
      const { data } = await axios.get(`${prodServerUrl}/questions/by-author/${encodeURIComponent(targetUserId)}`, {
        headers,
        params: { page, limit: questionsLimit },
      });
      const items = data?.data || [];
      const total = Number(data?.pagination?.total || 0);
      const mapped = items.map((d) => ({
        id: d._id,
        slug: d.slug,
        title: d.title,
        tags: Array.isArray(d.tags) ? d.tags : [],
        date: d?.createdAt ? new Date(d.createdAt).toLocaleDateString() : '',
      }));
      setUserQuestions((prev) => (page === 1 ? mapped : [...prev, ...mapped]));
      const nextHasMore = page * questionsLimit < total;
      setQuestionsHasMore(nextHasMore);
      setQuestionsPage(page);
    } catch (_) {
      setQuestionsHasMore(false);
    } finally {
      setQuestionsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLoginClick={() => setShowLoginModal(true)} />
      
      <div className="flex">
        <Sidebar />
        
        <main className={`flex-1 p-6 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'lg:ml-64 ml-0' : 'ml-0'
        }`}>
          <div className="max-w-4xl mx-auto">
            {/* Profile Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
              <div className="flex items-start space-x-6">
                {userData?.avatar ? (
                  <img
                    src={userData.avatar}
                    alt={userData?.name || 'Profile'}
                    className="w-24 h-24 rounded-full"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-2xl text-gray-600">
                    {(userData?.name || 'U').charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{userData?.name || 'Your Profile'}</h1>
                  <p className="text-[#C96442] text-lg mb-2">{userData?.handle || ''}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                    <span>📍 {userData?.location || 'N/A'}</span>
                    <span>🌐 <Link href={userData?.website || '#'} className="text-[#C96442] hover:underline">{userData?.website || 'N/A'}</Link></span>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {(userData?.badges || []).map((badge, index) => (
                      <span
                        key={index}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}
                      >
                        {badge.name}
                      </span>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{stats.posts}</div>
                      <div className="text-sm text-gray-500">Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{stats.likes}</div>
                      <div className="text-sm text-gray-500">Likes</div>
                    </div>
                  </div>
                </div>
                {/* Interests */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">Your Interests</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {interests.length ? interests.map((c) => (
                      <span key={c._id} className="px-3 py-1 rounded-full bg-[#C96442]/10 text-[#C96442] text-sm">{c.name || 'Category'}</span>
                    )) : <span className="text-gray-500">No interests selected.</span>}
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => { setModalInterests(interests.map(i => i._id)); setShowProfileEditModal(true); }}
                    className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab('posts')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm cursor-pointer ${
                      activeTab === 'posts'
                        ? 'border-[#C96442] text-[#C96442]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Posts ({userPosts.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('questions')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm cursor-pointer ${
                      activeTab === 'questions'
                        ? 'border-[#C96442] text-[#C96442]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Questions ({userQuestions.length})
                  </button>
                  
                  <button
                    onClick={() => router.push('/saved')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm cursor-pointer ${
                      activeTab === 'saved'
                        ? 'border-[#C96442] text-[#C96442]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Saved
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'posts' && (
                  <div className="space-y-6">
                    {userPosts.map((post) => (
                      <div
                        key={post.id}
                        className="border-b border-gray-200 pb-6 last:border-b-0 cursor-pointer"
                        onClick={() => router.push(`/blog/${encodeURIComponent(post.slug || post.id)}`)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xl font-semibold text-gray-900 flex-1">{post.title}</h3>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); router.push(`/edit-blog/${encodeURIComponent(post.id)}`); }}
                              className="p-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                              title="Edit post"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!confirm('Delete this post? This action cannot be undone.')) return;
                                try {
                                  const headers = { 'x-auth-token': auth.accessToken };
                                  await axios.delete(`${prodServerUrl}/blogs/delete-blog/${encodeURIComponent(post.id)}`, { headers });
                                  setUserPosts(prev => prev.filter(p => p.id !== post.id));
                                } catch (e) {
                                  alert(e?.response?.data?.message || e.message || 'Failed to delete');
                                }
                              }}
                              className="p-2 text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                              title="Delete post"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0h8a1 1 0 001-1V5a1 1 0 00-1-1h-3.5a1 1 0 01-.894-.553L12 3l-.606.447A1 1 0 0110.5 4H7a1 1 0 00-1 1v1z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        {post.image && (
                          <img src={post.image} alt={post.imageAlt} className="w-full h-48 object-cover rounded-lg mb-3" />
                        )}
                        <p className="text-gray-600 mb-3">{post.excerpt}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-2">
                            {post.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="bg-[#C96442]/10 text-[#C96442] px-2 py-1 rounded-full text-sm font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{post.date}</span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); likePost(post.id); }}
                              className={`flex items-center space-x-1 transition-colors cursor-pointer ${
                                post.isLiked 
                                  ? 'text-[#C96442]' 
                                  : 'text-gray-500 hover:text-[#C96442]'
                              }`}
                            >
                              <svg 
                                className="w-4 h-4" 
                                fill={post.isLiked ? "#C96442" : "none"} 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              <span>{post.likes}</span>
                            </button>
                            <div className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              <span>{post.comments}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={loadMoreRef} />
                    {postsLoading && (
                      <div className="text-center text-gray-500 py-4">Loading…</div>
                    )}
                    {!postsHasMore && userPosts.length > 0 && (
                      <div className="text-center text-gray-400 py-4 text-sm">No more posts</div>
                    )}
                  </div>
                )}

                {activeTab === 'questions' && (
                  <div className="space-y-6">
                    {userQuestions.map((q) => (
                      <div
                        key={q.id}
                        className="border-b border-gray-200 pb-6 last:border-b-0 cursor-pointer"
                        onClick={() => router.push(`/question/${encodeURIComponent(q.slug || q.id)}`)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xl font-semibold text-gray-900 flex-1">{q.title}</h3>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); router.push(`/question/${encodeURIComponent(q.slug || q.id)}`); }}
                              className="p-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                              title="Edit question"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!confirm('Delete this question? This action cannot be undone.')) return;
                                try {
                                  const headers = { 'x-auth-token': auth.accessToken };
                                  await axios.delete(`${prodServerUrl}/questions/${encodeURIComponent(q.id)}`, { headers });
                                  setUserQuestions(prev => prev.filter(x => x.id !== q.id));
                                } catch (e) {
                                  alert(e?.response?.data?.message || e.message || 'Failed to delete');
                                }
                              }}
                              className="p-2 text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                              title="Delete question"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0h8a1 1 0 001-1V5a1 1 0 00-1-1h-3.5a1 1 0 01-.894-.553L12 3l-.606.447A1 1 0 0110.5 4H7a1 1 0 00-1 1v1z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-2">
                            {(q.tags || []).map((tag, index) => (
                              <span
                                key={index}
                                className="bg-[#C96442]/10 text-[#C96442] px-2 py-1 rounded-full text-sm font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{q.date}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {questionsLoading && (
                      <div className="text-center text-gray-500 py-4">Loading…</div>
                    )}
                    {!questionsHasMore && userQuestions.length > 0 && (
                      <div className="text-center text-gray-400 py-4 text-sm">No more questions</div>
                    )}
                  </div>
                )}

                {activeTab === 'polls' && (
                  <div className="space-y-6">
                    {userPolls.map((poll) => (
                      <div key={poll.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xl font-semibold text-gray-900 flex-1">{poll.title}</h3>
                          <button
                            onClick={() => openContentEdit('poll', poll)}
                            className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                            title="Edit poll"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                        <div className="space-y-2 mb-4">
                          {poll.options.map((option, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="text-gray-700">{option.text}</span>
                              <span className="text-sm text-gray-500">{option.votes} votes</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-2">
                            {poll.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="bg-[#C96442]/10 text-[#C96442] px-2 py-1 rounded-full text-sm font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{poll.date}</span>
                            <div className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              <span>{poll.votes} total votes</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'saved' && (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No saved posts yet</h3>
                    <p className="text-gray-500">Posts you save will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* <Footer /> */}
      
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />

      {/* Profile Edit Modal */}
      {showProfileEditModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Edit Profile</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Full name</label>
                <input
                  type="text"
                  value={editForm.fullname}
                  onChange={(e) => setEditForm(f => ({ ...f, fullname: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C96442]"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Bio</label>
                <textarea
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) => setEditForm(f => ({ ...f, bio: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C96442]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm(f => ({ ...f, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C96442]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    value={editForm.website}
                    onChange={(e) => setEditForm(f => ({ ...f, website: e.target.value }))}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C96442]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Social Link</label>
                <input
                  type="url"
                  value={editForm.socialLink}
                  onChange={(e) => setEditForm(f => ({ ...f, socialLink: e.target.value }))}
                  placeholder="https://twitter.com/yourhandle"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C96442]"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C96442]"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Profile Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditForm(f => ({ ...f, profileimage: e.target.files && e.target.files[0] ? e.target.files[0] : null }))}
                />
              </div>
              {/* Interests in modal */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Your Interests</label>
                <div className="flex flex-wrap gap-2">
                  {allCats.map((c) => {
                    const selected = modalInterests.some(id => String(id) === String(c._id));
                    return (
                      <button
                        key={c._id}
                        onClick={() => {
                          setModalInterests(prev => selected ? prev.filter(id => String(id) !== String(c._id)) : [...prev, c._id]);
                        }}
                        className={`px-3 py-1 rounded-full text-sm border ${selected ? 'bg-[#C96442] text-white border-[#C96442]' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'}`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowProfileEditModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    if (editForm.website && !isValidHttpUrl(editForm.website)) { alert('Please enter a valid website URL (include http/https).'); return; }
                    if (editForm.socialLink && !isValidHttpUrl(editForm.socialLink)) { alert('Please enter a valid social link URL (include http/https).'); return; }
                    const headers = { 'x-auth-token': auth.accessToken };
                    const fd = new FormData();
                    if (editForm.fullname) fd.append('fullname', editForm.fullname);
                    fd.append('bio', editForm.bio || '');
                    fd.append('location', editForm.location || '');
                    fd.append('website', editForm.website || '');
                    fd.append('socialLink', editForm.socialLink || '');
                    fd.append('phone', editForm.phone || '');
                    if (editForm.profileimage) fd.append('profileimage', editForm.profileimage);
                    const { data } = await axios.put(`${prodServerUrl}/auth/edit-profile`, fd, { headers });
                    const updated = data?.data || {};
                    setUserData(u => ({
                      ...u,
                      name: updated.fullname || u.name,
                      avatar: updated?.profileimage?.signedUrl || updated?.profileimage?.url || u.avatar,
                      location: updated.location || u.location,
                      website: updated.website || u.website,
                    }));
                    // update interests
                    await axios.put(`${prodServerUrl}/auth/interested-topic-update`, { interested_topic: modalInterests }, { headers });
                    // refresh profile interests
                    try {
                      const { data: prof } = await axios.get(`${prodServerUrl}/auth/user-profile`, { headers });
                      const profile = prof?.data || {};
                      const its = Array.isArray(profile?.interested_topic) ? profile.interested_topic : [];
                      setInterests(its.map(c => ({ _id: c?._id || c, name: c?.name || '' })).filter(x => x._id));
                    } catch (_) {}
                    setShowProfileEditModal(false);
                  } catch (e) {
                    alert(e?.response?.data?.message || e.message || 'Failed to update profile');
                  }
                }}
                className="px-4 py-2 bg-[#C96442] text-white rounded-lg hover:bg-[#C96442]/90"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Edit Modal */}
      {showContentEditModal && editingContent && (
        <ContentEditModal
          content={editingContent}
          onSave={handleContentEdit}
          onClose={() => {
            setShowContentEditModal(false);
            setEditingContent(null);
          }}
        />
      )}
    </div>
  );
}
