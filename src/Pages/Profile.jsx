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

  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0, likes: 0 });

  const [userPosts, setUserPosts] = useState([]);
  const [postsPage, setPostsPage] = useState(1);
  const [postsLimit] = useState(30);
  const [postsHasMore, setPostsHasMore] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const loadMoreRef = useRef(null);

  const [userQuestions, setUserQuestions] = useState([
    {
      id: 1,
      title: "How to handle duplicate content issues with multiple product variants?",
      date: "1 week ago",
      answers: 8,
      tags: ["Technical SEO", "E-commerce"]
    },
    {
      id: 2,
      title: "Best practices for optimizing images for Core Web Vitals?",
      date: "2 weeks ago",
      answers: 12,
      tags: ["Performance", "Images"]
    }
  ]);

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
    const headers = { 'x-auth-token': auth.accessToken };
    (async () => {
      try {
        const [profileRes, statsRes] = await Promise.all([
          axios.get(`${prodServerUrl}/auth/user-profile`, { headers }),
          axios.get(`${prodServerUrl}/auth/user-stats`, { headers }),
        ]);
        const profile = profileRes?.data?.data || {};
        setUserData({
          name: profile.fullname || '',
          handle: profile.email ? `@${profile.email.split('@')[0]}` : '',
          avatar: profile?.profileimage?.signedUrl || profile?.profileimage?.url || '',
          location: profile?.location || '',
          website: profile?.website || '',
          badges: [],
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
  const loadUserPosts = async (page) => {
    if (!isLoggedIn || postsLoading || !postsHasMore) return;
    setPostsLoading(true);
    const headers = { 'x-auth-token': auth.accessToken };
    try {
      const { data } = await axios.get(`${prodServerUrl}/blogs/get-blog-by-author/${auth?.user?._id || auth?.userId || ''}`, {
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
    setUserPosts([]);
    setPostsPage(1);
    setPostsHasMore(true);
    loadUserPosts(1);
  }, [isLoggedIn, auth?.accessToken]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!isLoggedIn) return;
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting && postsHasMore && !postsLoading && activeTab === 'posts') {
        loadUserPosts(postsPage + 1);
      }
    }, { root: null, rootMargin: '0px', threshold: 1.0 });
    observer.observe(el);
    return () => { observer.disconnect(); };
  }, [isLoggedIn, postsHasMore, postsLoading, postsPage, activeTab]);

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
                
                <div className="flex space-x-3">
                  <button 
                    onClick={() => router.push('/publish-blog')}
                    className="bg-[#C96442] text-white px-6 py-2 rounded-lg hover:bg-[#C96442]/90 transition-colors cursor-pointer"
                  >
                    Write a Post
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
                      <div key={post.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xl font-semibold text-gray-900 flex-1">{post.title}</h3>
                          <button
                            onClick={() => router.push(`/edit-blog/${encodeURIComponent(post.id)}`)}
                            className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                            title="Edit post"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
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
                              onClick={() => likePost(post.id)}
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
                    {userQuestions.map((question) => (
                      <div key={question.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xl font-semibold text-gray-900 flex-1">{question.title}</h3>
                          <button
                            onClick={() => openContentEdit('question', question)}
                            className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                            title="Edit question"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-2">
                            {question.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="bg-[#C96442]/10 text-[#C96442] px-2 py-1 rounded-full text-sm font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{question.date}</span>
                            <div className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              <span>{question.answers} answers</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
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
        <ProfileEditModal
          userData={userData}
          onSave={handleProfileEdit}
          onClose={() => setShowProfileEditModal(false)}
        />
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
