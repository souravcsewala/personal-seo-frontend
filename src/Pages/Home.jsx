'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import LoginModal from '../components/auth/LoginModal';
import { useApp } from '../context/AppContext';
import { prodServerUrl } from '../global/server';
import LoadingIndicator from '../components/common/LoadingIndicator';

export default function Home({ initialFeed = [] }) {
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [fabExpanded, setFabExpanded] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedContentType, setSelectedContentType] = useState(null);
  const searchParams = useSearchParams();
  const { likePost, votePoll, sidebarOpen } = useApp();
  const auth = useSelector((s) => s.auth);
  const isLoggedIn = !!auth?.isAuthenticated && !!auth?.accessToken;
  const [feed, setFeed] = useState(initialFeed || []);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState('');
  const [savedKeys, setSavedKeys] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [trending, setTrending] = useState([]);
  const [communityStats, setCommunityStats] = useState({ activeMembers: 0, postsToday: 0, topContributors: 0 });
  const [statsLoading, setStatsLoading] = useState(false);
  const [announcement, setAnnouncement] = useState(null);
  const [announcementList, setAnnouncementList] = useState([]);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [followingOptions, setFollowingOptions] = useState([]);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [selectedFollowingId, setSelectedFollowingId] = useState('all');
  

  console.log("auth",auth.accessToken)

  // Fetch feed from backend (public vs auth)
  useEffect(() => {
    let mounted = true;
    async function loadInitial() {
      if (!mounted) return;
      if (initialFeed && initialFeed.length && !isLoggedIn) {
        // already have public feed SSR
        setHasMore(true);
        setFeedLoading(false);
        return;
      }
      setFeed([]);
      setPage(1);
      setHasMore(true);
      setFeedLoading(true);
      setFeedError('');
      try {
        const url = isLoggedIn ? `${prodServerUrl}/feed` : `${prodServerUrl}/feed/public`;
        const headers = isLoggedIn ? { 'x-auth-token': auth.accessToken } : {};
        console.log("headers",headers)
        const params = { limit: 30, page: 1 };
        if (isLoggedIn && selectedFollowingId && selectedFollowingId !== 'all') params.authorId = selectedFollowingId;
        const { data } = await axios.get(url, { headers, params });
        const items = Array.isArray(data?.data) ? data.data : [];
        setFeed(items);
        setHasMore(!!data?.pagination?.hasMore);
        setPage(1);
      } catch (err) {
        // Fallback to public feed if auth feed fails due to missing/invalid token
        const status = err?.response?.status;
        if (isLoggedIn && (status === 400 || status === 401 || status === 403)) {
          try {
            const { data } = await axios.get(`${prodServerUrl}/feed/public`, { params: { limit: 30, page: 1 } });
            const items = Array.isArray(data?.data) ? data.data : [];
            setFeed(items);
            setHasMore(!!data?.pagination?.hasMore);
            setPage(1);
            setFeedError('');
          } catch (err2) {
            setFeedError(err2?.response?.data?.message || err2.message || 'Failed to load feed');
            setFeed([]);
          }
        } else {
          setFeedError(err?.response?.data?.message || err.message || 'Failed to load feed');
          setFeed([]);
        }
      } finally {
        if (mounted) setFeedLoading(false);
      }
    }
    loadInitial();
    return () => { mounted = false; };
  }, [isLoggedIn, auth?.accessToken, initialFeed, selectedFollowingId]);

  // initialize saved keys
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('savedBlogs') : null;
      const arr = raw ? JSON.parse(raw) : [];
      if (Array.isArray(arr)) setSavedKeys(arr);
    } catch (_) {}
  }, []);

  // Load categories list from backend (no counts yet)
  useEffect(() => {
    let mounted = true;
    async function loadCategories() {
      try {
        const { data } = await axios.get(`${prodServerUrl}/get-all-category`);
        const items = Array.isArray(data?.data) ? data.data : [];
        if (!mounted) return;
        setAllCategories(items);
        setCategories(items.slice(0, 4));
      } catch (_) {
        if (!mounted) return;
        setAllCategories([]);
        setCategories([]);
      }
    }
    loadCategories();
    return () => { mounted = false; };
  }, []);

  // Load trending from backend
  useEffect(() => {
    let mounted = true;
    async function loadTrending() {
      try {
        const { data } = await axios.get(`${prodServerUrl}/feed/trending`, { params: { limit: 5 } });
        const items = Array.isArray(data?.data) ? data.data : [];
        if (!mounted) return;
        setTrending(items);
      } catch (_) {
        if (!mounted) return;
        setTrending([]);
      }
    }
    loadTrending();
    return () => { mounted = false; };
  }, []);

  // Load following list for filter (when logged in)
  useEffect(() => {
    let cancelled = false;
    async function loadFollowing() {
      try {
        if (!isLoggedIn || !auth?.userId) { setFollowingOptions([]); return; }
        setFollowingLoading(true);
        const { data } = await axios.get(`${prodServerUrl}/users/${encodeURIComponent(auth.userId)}/following`, { params: { limit: 200 } });
        if (cancelled) return;
        const arr = Array.isArray(data?.data) ? data.data : [];
        setFollowingOptions(arr);
      } catch (_) {
        if (cancelled) return;
        setFollowingOptions([]);
      } finally {
        if (!cancelled) setFollowingLoading(false);
      }
    }
    loadFollowing();
    return () => { cancelled = true; };
  }, [isLoggedIn, auth?.userId]);

  // Helpers for announcements
  const isActiveWindow = (a) => {
    const now = new Date();
    if (a?.startAt && now < new Date(a.startAt)) return false;
    if (a?.endAt && now > new Date(a.endAt)) return false;
    return !!a?.isActive;
  };

  // Load announcements and prepare rotation list
  useEffect(() => {
    let mounted = true;
    async function loadAnnouncements() {
      try {
        const res = await axios.get(`${prodServerUrl}/announcements`, { params: { page: 1, limit: 10 } });
        if (!mounted) return;
        const items = Array.isArray(res?.data?.data) ? res.data.data : [];
        // Show all announcements on the top bar, ordered by priority then newest
        const ordered = items.slice().sort((a, b) => {
          const p = (b.priority || 0) - (a.priority || 0);
          if (p !== 0) return p;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        setAnnouncementList(ordered);
        setAnnouncementIndex(0);
        setAnnouncement(ordered[0] || null);
      } catch (_) {
        if (!mounted) return;
        setAnnouncementList([]);
        setAnnouncement(null);
      }
    }
    loadAnnouncements();
    return () => { mounted = false; };
  }, []);

  // Rotate through active announcements automatically
  useEffect(() => {
    if (!announcementList || announcementList.length <= 1) return;
    let cancelled = false;
    const interval = setInterval(() => {
      if (cancelled) return;
      setAnnouncementIndex((idx) => {
        const next = (idx + 1) % announcementList.length;
        setAnnouncement(announcementList[next]);
        return next;
      });
    }, 8000); // 8 seconds
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [announcementList]);

  // Load community stats
  useEffect(() => {
    let mounted = true;
    async function loadStats() {
      try {
        setStatsLoading(true);
        const { data } = await axios.get(`${prodServerUrl}/feed/community-stats`);
        if (!mounted) return;
        const s = data?.data || {};
        setCommunityStats({
          activeMembers: Number(s.activeMembers || 0),
          postsToday: Number(s.postsToday || 0),
          topContributors: Number(s.topContributors || 0),
        });
      } catch (_) {
        if (!mounted) return;
        setCommunityStats({ activeMembers: 0, postsToday: 0, topContributors: 0 });
      } finally {
        if (mounted) setStatsLoading(false);
      }
    }
    loadStats();
    return () => { mounted = false; };
  }, []);

  // Normalize API feed into UI cards
  const allContent = useMemo(() => {
    const mapped = feed.map((it) => {
      const type = it?.type;
      const doc = it?.doc || {};
      const createdAt = doc?.createdAt || it?.createdAt;
      const author = doc?.author || {};
      const authorName = author?.fullname || 'Unknown';
      const authorAvatar = author?.profileimage?.signedUrl || author?.profileimage?.url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face';
      const title = type === 'blog' ? doc?.title : (type === 'question' ? doc?.title : doc?.title);
      const description = type === 'blog' ? doc?.metaDescription : (type === 'question' ? doc?.description : doc?.description);
      const image = type === 'blog' ? (doc?.signedUrl || doc?.image) : undefined;
      const userVoted = it?.userVoted;
      const userVote = it?.userVote;
      const likesCount = typeof it.likes === 'number' ? it.likes : (doc?.likesCount || 0);
      const shareCount = typeof it.shares === 'number' ? it.shares : (doc?.shareCount || 0);
      return {
        id: doc?._id,
        slug: doc?.slug,
        type,
        contentType: type,
        author: { name: authorName, avatar: authorAvatar },
        publishDate: createdAt ? new Date(createdAt).toLocaleDateString() : '',
        title: title || '',
        description: description || '',
        image,
        category: doc?.category?.name,
        likes: likesCount,
        shares: shareCount,
        comments: Array.isArray(doc?.comments) ? doc.comments.length : 0,
        totalVotes: Array.isArray(doc?.options) ? doc.options.reduce((s,o)=>s+(o.votes||0),0) : 0,
        options: doc?.options,
        isLiked: typeof it.isLiked === 'boolean' ? it.isLiked : false,
        userVoted,
        userVote,
      };
    });
    // newest first by original order or createdAt
    return mapped.sort((a, b) => 0);
  }, [feed]);

  // Apply filters when selected
  const filteredContent = allContent.filter(item => {
    const categoryMatch = !selectedCategory || item.category === selectedCategory;
    const contentTypeMatch = !selectedContentType || item.contentType === selectedContentType;
    return categoryMatch && contentTypeMatch;
  });

  // Load next page
  const loadMore = async () => {
    if (isLoading || feedLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const url = isLoggedIn ? `${prodServerUrl}/feed` : `${prodServerUrl}/feed/public`;
      const headers = isLoggedIn ? { 'x-auth-token': auth.accessToken } : {};
      const nextPage = page + 1;
      const params = { limit: 30, page: nextPage };
      if (isLoggedIn && selectedFollowingId && selectedFollowingId !== 'all') params.authorId = selectedFollowingId;
      const { data } = await axios.get(url, { headers, params });
      console.log(data)
      const items = Array.isArray(data?.data) ? data.data : [];
      setFeed(prev => [...prev, ...items]);
      setHasMore(!!data?.pagination?.hasMore);
      setPage(nextPage);
    } catch (err) {
      // keep current feed; optionally surface a toast
    } finally {
      setIsLoading(false);
    }
  };

  

  // Infinite scroll handler
  const handleScroll = () => {
    if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 600) {
      loadMore();
    }
  };

  // Add scroll listener
  React.useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoading, feedLoading, hasMore, page]);

  // Initialize/Sync selected category from URL query
  React.useEffect(() => {
    const fromQuery = searchParams?.get('category');
    if (fromQuery !== selectedCategory) {
      setSelectedCategory(fromQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Handle click outside FAB to collapse
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (fabExpanded && !event.target.closest('.fab-container')) {
        setFabExpanded(false);
      }
    };

    if (fabExpanded) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [fabExpanded]);

  // Handle poll voting
  const handlePollVote = async (pollId, optionIndex) => {
    if (!isLoggedIn) { router.push('/login'); return; }
    try {
      await axios.post(
        `${prodServerUrl}/polls/${encodeURIComponent(pollId)}/vote`,
        { optionIndexes: [optionIndex] },
        { headers: { 'x-auth-token': auth.accessToken } }
      );
      // fetch results to update UI
      const { data } = await axios.get(`${prodServerUrl}/polls/${encodeURIComponent(pollId)}/results`, {
        headers: isLoggedIn ? { 'x-auth-token': auth.accessToken } : {},
      });
      const r = data?.data;
      if (r) {
        setFeed((prev) => prev.map((it) => {
          const id = it?.doc?._id || it?.id;
          if (String(id) !== String(pollId)) return it;
          const next = { ...it };
          next.doc = { ...(it.doc || {}), options: Array.isArray(r.options) ? r.options : (it.doc?.options || []) };
          // mark user vote locally for UI
          next.userVoted = true;
          next.userVote = Array.isArray(r.userVote) ? r.userVote[0] : (typeof optionIndex === 'number' ? optionIndex : 0);
          return next;
        }));
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to vote');
    }
  };

  // Helpers for blog actions
  const keyFor = (item) => item.slug || item.id;

  const toSlug = (s) => {
    try {
      const str = String(s || '').toLowerCase().trim();
      if (!str) return '';
      return str
        .normalize('NFKD')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
    } catch (_) { return ''; }
  };

  const handleToggleSave = (item) => {
    try {
      const key = keyFor(item);
      if (!key) return;
      const raw = typeof window !== 'undefined' ? localStorage.getItem('savedBlogs') : null;
      const arr = raw ? JSON.parse(raw) : [];
      let next = Array.isArray(arr) ? arr.slice() : [];
      if (next.includes(key)) next = next.filter((x) => x !== key);
      else next.push(key);
      localStorage.setItem('savedBlogs', JSON.stringify(next));
      setSavedKeys(next);
    } catch (_) {}
  };

  const handleToggleLike = async (item) => {
    if (!isLoggedIn) { router.push('/login'); return; }
    try {
      if (item.contentType === 'blog') {
        const { data } = await axios.post(`${prodServerUrl}/blogs/${item.id}/like`, {}, { headers: { 'x-auth-token': auth.accessToken } });
        const liked = !!data?.data?.liked;
        const likesCount = Number(data?.data?.likesCount ?? (item.likes || 0));
        setFeed((prev) => prev.map((it) => {
          if ((it.doc?._id || it.id) !== item.id) return it;
          const nextDoc = { ...(it.doc || {}), likesCount };
          return { ...it, doc: nextDoc, likes: likesCount, isLiked: liked };
        }));
      } else if (item.contentType === 'question') {
        const { data } = await axios.post(`${prodServerUrl}/questions/${item.id}/like`, {}, { headers: { 'x-auth-token': auth.accessToken } });
        const liked = !!data?.data?.liked;
        const likesCount = Number(data?.data?.likesCount ?? (item.likes || 0));
        setFeed((prev) => prev.map((it) => {
          if ((it.doc?._id || it.id) !== item.id) return it;
          const nextDoc = { ...(it.doc || {}), likesCount };
          return { ...it, doc: nextDoc, likes: likesCount, isLiked: liked };
        }));
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to react');
    }
  };

  const handleShare = async (item) => {
    const pretty = encodeURIComponent(item.slug || item.id || '');
    const path = item.contentType === 'blog' ? `/blog/${pretty}`
      : item.contentType === 'question' ? `/question/${pretty}`
      : item.contentType === 'poll' ? `/poll/${pretty}`
      : '/';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}${path}`;

    // Increment share count when authenticated
    if (isLoggedIn) {
      try {
        if (item.contentType === 'blog') {
          const { data } = await axios.post(`${prodServerUrl}/blogs/${item.id}/share`, {}, { headers: { 'x-auth-token': auth.accessToken } });
          const shareCount = Number((data?.data?.shareCount ?? (item.shares || 0)));
          setFeed((prev) => prev.map((it) => {
            if ((it.doc?._id || it.id) !== item.id) return it;
            const nextDoc = { ...(it.doc || {}), shareCount };
            return { ...it, doc: nextDoc, shares: shareCount };
          }));
        } else if (item.contentType === 'question') {
          const { data } = await axios.post(`${prodServerUrl}/questions/${item.id}/share`, {}, { headers: { 'x-auth-token': auth.accessToken } });
          const shareCount = Number((data?.data?.shareCount ?? (item.shares || 0)));
          setFeed((prev) => prev.map((it) => {
            if ((it.doc?._id || it.id) !== item.id) return it;
            const nextDoc = { ...(it.doc || {}), shareCount };
            return { ...it, doc: nextDoc, shares: shareCount };
          }));
        }
      } catch (err) {
        // Ignore counter error; allow sharing to proceed
      }
    }

    try {
      if (navigator.share) {
        await navigator.share({ title: item.title, url: shareUrl });
      } else if (navigator.clipboard && typeof window !== 'undefined') {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard');
      }
    } catch (_) {}
  };

  // Render poll options
  const renderPollOptions = (poll) => {
    if (poll.userVoted) {
      // Show results after voting
      return (
        <div className="space-y-3">
          {poll.options.map((option, index) => {
            const percentage = poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0;
            const isUserVote = index === poll.userVote;
            return (
              <div key={index} className="relative">
                <div className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                  isUserVote ? 'border-[#C96442] bg-[#C96442]/5' : 'border-gray-200'
                }`}>
                  <span className={`font-medium ${isUserVote ? 'text-[#C96442]' : 'text-gray-700'}`}>
                    {option.text}
                  </span>
                  <span className="text-sm text-gray-500">
                    {option.votes} votes ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full ${isUserVote ? 'bg-[#C96442]' : 'bg-gray-400'}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
          <p className="text-sm text-gray-500 mt-2">Total votes: {poll.totalVotes}</p>
        </div>
      );
    } else {
      // Show voting options
      return (
        <div className="space-y-2">
          {poll.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handlePollVote(poll.id, index)}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-[#C96442] hover:bg-[#C96442]/5 transition-colors cursor-pointer"
            >
              {option.text}
            </button>
          ))}
        </div>
      );
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
            {announcement && (
              <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-900 rounded px-4 py-2">
                <marquee id="head" direction="left" scrollamount="6">
                  {announcementList && announcementList.length > 0 ? (
                    announcementList.map((it, idx) => (
                      <React.Fragment key={it._id || idx}>
                        <a
                          href={it.linkUrl || '/announcements'}
                          className="text-[#C96442] font-semibold"
                          target={it.linkUrl && it.linkUrl.startsWith('http') ? '_blank' : undefined}
                          rel="noopener noreferrer"
                        >
                          {it.title}
                        </a>
                        {idx < announcementList.length - 1 && (
                          <span className="mx-6 text-amber-400">•</span>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <a href={announcement?.linkUrl || '/announcements'} className="text-[#C96442] font-semibold" target={announcement?.linkUrl && announcement.linkUrl.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
                      {announcement?.title}
                    </a>
                  )}
                </marquee>
                <div className="text-right mt-1">
                  <button onClick={() => router.push('/announcements')} className="text-xs text-gray-600 hover:text-[#C96442] cursor-pointer">See all announcements</button>
                </div>
              </div>
            )}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Latest SEO Insights</h1>
              <p className="text-gray-600">Discover the latest trends, tips, and strategies from the SEO community.</p>
            </div>

            <div className="space-y-6">
              {feedLoading && (
                <div className="rounded-lg border border-gray-200 p-4"><LoadingIndicator /></div>
              )}
              {feedError && (
                <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">{feedError}</div>
              )}
              {(selectedCategory || selectedContentType) && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {selectedCategory && (
                    <button
                      onClick={() => {
                        setSelectedCategory(null);
                        const url = new URL(window.location.href);
                        url.searchParams.delete('category');
                        window.history.replaceState({}, '', url.toString());
                      }}
                      className="inline-flex items-center px-3 py-1 rounded-full bg-[#C96442]/10 text-[#C96442] text-sm font-medium hover:bg-[#C96442]/20 transition-colors cursor-pointer"
                    >
                      <span className="mr-2">Category: {selectedCategory}</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  {selectedContentType && (
                    <button
                      onClick={() => {
                        setSelectedContentType(null);
                      }}
                      className="inline-flex items-center px-3 py-1 rounded-full bg-[#C96442]/10 text-[#C96442] text-sm font-medium hover:bg-[#C96442]/20 transition-colors cursor-pointer"
                    >
                      <span className="mr-2">Type: {selectedContentType === 'question' ? 'Discussions' : selectedContentType === 'blog' ? 'Blogs' : 'Polls'}</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
              {filteredContent.map((item) => (
                <article key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    {/* <img
                      src={item.author.avatar}
                      alt={item.author.name}
                      className="w-10 h-10 rounded-full"
                    /> */}
                    <div className="flex-1">
                      {/* Mobile: Stack author and content type on one line, date on next line */}
                      <div className="block lg:hidden">
                        <div className="flex items-center space-x-2 mb-1">
                          <span 
                            className="font-medium text-gray-900 cursor-pointer hover:text-[#C96442] transition-colors"
                            onClick={() => {
                              if (item.contentType === 'blog') {
                                router.push(`/blogger/${encodeURIComponent(item.author.name)}`);
                              }
                            }}
                          >
                            {item.author.name}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.contentType === 'blog' ? 'bg-blue-100 text-blue-800' :
                            item.contentType === 'question' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {item.contentType === 'blog' ? 'Blog' : 
                             item.contentType === 'question' ? 'Question' : 'Poll'}
                          </span>
                        </div>
                        <div className="text-gray-500 text-sm">
                          {item.publishDate}
                        </div>
                      </div>
                      
                      {/* Desktop: Keep original layout */}
                      <div className="hidden lg:flex items-center space-x-2">
                        <span 
                          className="font-medium text-gray-900 cursor-pointer hover:text-[#C96442] transition-colors"
                          onClick={() => {
                            if (item.contentType === 'blog') {
                              router.push(`/blogger/${encodeURIComponent(item.author.name)}`);
                            }
                          }}
                        >
                          {item.author.name}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500">{item.publishDate}</span>
                        <span className="text-gray-400">•</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.contentType === 'blog' ? 'bg-blue-100 text-blue-800' :
                          item.contentType === 'question' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {item.contentType === 'blog' ? 'Blog' : 
                           item.contentType === 'question' ? 'Question' : 'Poll'}
                        </span>
                      </div>
                    </div>
                  </div>


                  <h2 
                    className="text-xl font-bold text-gray-900 mb-3 cursor-pointer hover:text-[#C96442] transition-colors"
                    onClick={() => {
                      const slug = item.slug || item.id;
                      if (!slug) return;
                      if (item.contentType === 'blog') {
                        router.push(`/blog/${encodeURIComponent(slug)}`);
                      } else if (item.contentType === 'question') {
                        router.push(`/question/${encodeURIComponent(slug)}`);
                      } else if (item.contentType === 'poll') {
                        router.push(`/poll/${encodeURIComponent(slug)}`);
                      }
                    }}
                  >
                    {item.title}
                  </h2>
                  {item.contentType === 'blog' ? (
                    <p className="text-gray-600 mb-4">{item.description}</p>
                  ) : (
                    <div className="text-gray-700 leading-relaxed prose max-w-none mb-4" dangerouslySetInnerHTML={{ __html: item.description || '' }} />
                  )}

                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-48 object-cover rounded-lg mb-4 cursor-pointer hover:opacity-95"
                      onClick={() => {
                        if (item.contentType === 'blog') {
                          const slug = item.slug || item.id;
                          router.push(`/blog/${encodeURIComponent(slug)}`);
                        }
                      }}
                    />
                  )}

                  {/* Poll options */}
                  {item.contentType === 'poll' && (
                    <div className="mb-4">
                      {renderPollOptions(item)}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6 text-gray-500">
                      {item.contentType !== 'poll' && (
                        <button 
                          onClick={() => handleToggleLike(item)}
                          className={`flex items-center space-x-2 transition-colors cursor-pointer ${
                            item.isLiked 
                              ? 'text-[#C96442]' 
                              : 'text-gray-500 hover:text-[#C96442]'
                          }`}
                        >
                          <svg 
                            className="w-5 h-5" 
                            fill={item.isLiked ? "#C96442" : "none"} 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 12.75c0-1.243 1.007-2.25 2.25-2.25H8.4c.621 0 1.216-.246 1.654-.684l3.6-3.6a2.25 2.25 0 113.182 3.182L15 10.5h4.5A2.25 2.25 0 0121.75 12.75l-1.125 5.063A2.25 2.25 0 0118.4 20.25H9.75A2.25 2.25 0 017.5 18v-5.25H4.5a2.25 2.25 0 01-2.25-2.25z" />
                          </svg>
                          <span>{item.likes || 0}</span>
                        </button>
                      )}
                      {item.contentType === 'poll' && (
                        <div className="flex items-center space-x-2 text-gray-500">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <span>{item.totalVotes || 0} votes</span>
                        </div>
                      )}
                      <button onClick={() => {
                        if (item.contentType === 'blog') {
                          const slug = item.slug || item.id;
                          router.push(`/blog/${encodeURIComponent(slug)}`);
                        }
                      }} className="flex items-center space-x-2 hover:text-[#C96442] transition-colors cursor-pointer">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>{item.comments || item.answers || 0}</span>
                      </button>
                      <button onClick={() => handleShare(item)} className="flex items-center space-x-2 hover:text-[#C96442] transition-colors cursor-pointer">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684z" />
                        </svg>
                        <span>{item.shares || 0}</span>
                      </button>
                      <button onClick={() => handleToggleSave(item)} className={`hover:text-[#C96442] transition-colors cursor-pointer ${savedKeys.includes(keyFor(item)) ? 'text-[#C96442]' : ''}`}>
                        <svg className="w-5 h-5" fill={savedKeys.includes(keyFor(item)) ? '#C96442' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Give an Answer button for questions */}
                    {item.contentType === 'question' && (
                      <button 
                        onClick={() => {
                          const pretty = item.slug || item.id;
                          router.push(`/question/${encodeURIComponent(pretty)}`);
                        }}
                        className="bg-[#C96442] hover:bg-[#A54F35] text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium cursor-pointer"
                      >
                        Give an Answer
                      </button>
                    )}
                  </div>
                </article>
              ))}
              
              {/* Loader for infinite scroll */}
              {isLoading && <LoadingIndicator />}
            </div>
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="hidden xl:block w-80 p-6 space-y-6">
          {/* Community Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Community Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-[#C96442]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <span className="text-gray-700">Active Members</span>
                </div>
                <span className="font-semibold text-gray-900">{statsLoading ? '...' : communityStats.activeMembers.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-[#C96442]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-gray-700">Posts Today</span>
                </div>
                <span className="font-semibold text-gray-900">{statsLoading ? '...' : communityStats.postsToday.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-[#C96442]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <span className="text-gray-700">Top Contributors</span>
                </div>
                <span className="font-semibold text-gray-900">{statsLoading ? '...' : communityStats.topContributors.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Content Type Filter */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What are you looking for?</h3>
            <div className="space-y-3">
              {isLoggedIn && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Following</label>
                  {Array.isArray(followingOptions) && followingOptions.length > 0 ? (
                    <select
                      value={selectedFollowingId}
                      onChange={(e) => setSelectedFollowingId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C96442] focus:border-transparent"
                    >
                      <option value="all">All</option>
                      {followingOptions.map((u, idx) => (
                        <option key={u._id || idx} value={u._id || ''}>{u.fullname || 'Member'}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-sm text-gray-500">You do not follow anyone yet.</div>
                  )}
                </div>
              )}
              <button 
                onClick={() => {
                  setSelectedContentType(null);
                  setSelectedCategory(null); // Reset category filter when showing all content
                }}
                className={`w-full flex items-center justify-between py-3 px-4 text-left rounded-lg transition-colors cursor-pointer ${
                  !selectedContentType 
                    ? 'bg-[#C96442]/10 text-[#C96442] border border-[#C96442]/20' 
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  <span className="font-medium">All Content</span>
                </div>
                <span className="text-sm text-gray-500">{allContent.length}</span>
              </button>
              
              <button 
                onClick={() => {
                  setSelectedContentType('blog');
                  setSelectedCategory(null); // Reset category filter when content type is selected
                }}
                className={`w-full flex items-center justify-between py-3 px-4 text-left rounded-lg transition-colors cursor-pointer ${
                  selectedContentType === 'blog' 
                    ? 'bg-[#C96442]/10 text-[#C96442] border border-[#C96442]/20' 
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-medium">Blogs</span>
                </div>
                <span className="text-sm text-gray-500">{allContent.filter(item => item.contentType === 'blog').length}</span>
              </button>

              <button 
                onClick={() => {
                  setSelectedContentType('question');
                  setSelectedCategory(null);
                }}
                className={`w-full flex items-center justify-between py-3 px-4 text-left rounded-lg transition-colors cursor-pointer ${
                  selectedContentType === 'question' 
                    ? 'bg-[#C96442]/10 text-[#C96442] border border-[#C96442]/20' 
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="font-medium">Discussions</span>
                </div>
                <span className="text-sm text-gray-500">{allContent.filter(item => item.contentType === 'question').length}</span>
              </button>

              {/*
              <button 
                onClick={() => {
                  setSelectedContentType('poll');
                  setSelectedCategory(null);
                }}
                className={`w-full flex items-center justify-between py-3 px-4 text-left rounded-lg transition-colors cursor-pointer ${
                  selectedContentType === 'poll' 
                    ? 'bg-[#C96442]/10 text-[#C96442] border border-[#C96442]/20' 
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="font-medium">Polls</span>
                </div>
                <span className="text-sm text-gray-500">{allContent.filter(item => item.contentType === 'poll').length}</span>
              </button>
              */}
            </div>
          </div>

          {/* Popular Categories */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Categories</h3>
            <div className="space-y-3">
              {(showAllCategories ? allCategories : categories).map((category, index) => (
                <button 
                  key={index}
                  onClick={() => {
                    setSelectedCategory(category.name);
                    setSelectedContentType(null); // Reset content type filter when category is selected
                  }}
                  className="w-full flex items-center justify-between py-2 text-left hover:bg-gray-50 rounded-lg px-2 cursor-pointer"
                >
                  <span className="text-gray-700">{category.name}</span>
                  {typeof category.count !== 'undefined' && (
                    <span className="bg-[#C96442]/10 text-[#C96442] px-2 py-1 rounded-full text-sm font-medium">
                      {category.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="text-[#C96442] hover:text-[#C96442]/80 font-medium text-sm mt-4 transition-colors cursor-pointer"
            >
              {showAllCategories ? 'Show Less' : 'View All Categories'}
            </button>
          </div>

          {/* Trending Posts (dynamic) */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Trending Posts</h3>
            <div className="space-y-3">
              {trending.map((item, index) => {
                const title = item?.doc?.title || (item?.type || 'Item');
                const catName = item?.doc?.category?.name;
                const isBlog = item?.type === 'blog';
                const slug = item?.doc?.slug || item?.doc?._id;
                const go = () => {
                  if (!isBlog || !slug) return;
                  router.push(`/blog/${encodeURIComponent(slug)}`);
                };
                return (
                  <div key={(item?.doc?._id || index)} className="items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-[#C96442] font-bold">#{index + 1}</span>
                      <button onClick={go} className={`text-left text-gray-700 hover:text-[#C96442] ${isBlog ? 'cursor-pointer' : 'cursor-default'}`}>
                        {title}
                      </button>
                      {isBlog && catName && (
                        <button onClick={go} className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-[#C96442]/10 text-[#C96442] cursor-pointer">
                          {catName}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {trending.length === 0 && (
                <div className="text-gray-600">No trending posts right now.</div>
              )}
            </div>
          </div>

          
        </aside>
      </div>

      {/* <Footer /> */}
      
      {/* Mobile Expandable Floating Action Button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50 fab-container">
        {/* Mini Buttons */}
        <div className={`absolute bottom-16 right-0 space-y-3 transition-all duration-300 ease-in-out ${
          fabExpanded ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-75 translate-y-4 pointer-events-none'
        }`}>
          {/* New Blog Button */}
          <button
            onClick={() => {
              router.push('/publish-blog');
              setFabExpanded(false);
            }}
            className="bg-[#C96442] text-white p-3 rounded-full shadow-lg hover:bg-[#C96442]/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C96442] cursor-pointer"
            aria-label="Create new blog post"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* Ask Question Button */}
          <button
            onClick={() => {
              router.push('/ask-question');
              setFabExpanded(false);
            }}
            className="bg-[#C96442] text-white p-3 rounded-full shadow-lg hover:bg-[#C96442]/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C96442] cursor-pointer"
            aria-label="Ask a question"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>

        {/* Main FAB Button */}
        <button
          onClick={() => setFabExpanded(!fabExpanded)}
          className={`bg-[#C96442] text-white p-4 rounded-full shadow-lg hover:bg-[#C96442]/90 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C96442] cursor-pointer ${
            fabExpanded ? 'rotate-45' : 'rotate-0'
          }`}
          aria-label={fabExpanded ? "Close add menu" : "Add new content"}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </div>
  );
}
