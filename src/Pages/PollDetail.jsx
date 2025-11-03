'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import LoginModal from '../components/auth/LoginModal';
import { prodServerUrl } from '../global/server';
import { useApp } from '../context/AppContext';

function sanitizeHtml(unsafeHtml) {
  try {
    if (typeof window === 'undefined') return '';
    const parser = new DOMParser();
    const doc = parser.parseFromString(String(unsafeHtml || ''), 'text/html');
    // remove scripts and styles
    doc.querySelectorAll('script, style, iframe, object, embed').forEach((el) => el.remove());
    // remove event handlers and javascript: urls
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
    return doc.body ? doc.body.innerHTML : '';
  } catch (_) {
    return '';
  }
}

export default function PollDetail() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { sidebarOpen } = useApp();
  const auth = useSelector((s) => s.auth);
  const isLoggedIn = !!auth?.isAuthenticated && !!auth?.accessToken;

  const pollIdParam = params?.slug || params?.id;
  const fallbackId = searchParams?.get('id');

  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [voting, setVoting] = useState(false);

  const totalVotes = useMemo(() => {
    if (!poll || !Array.isArray(poll.options)) return 0;
    return poll.options.reduce((sum, o) => sum + Number(o.votes || 0), 0);
  }, [poll]);

  useEffect(() => {
    if (!pollIdParam && !fallbackId) return;
    let mounted = true;
    async function loadPoll() {
      try {
        setLoading(true);
        setError('');
        let pRes;
        try {
          pRes = await axios.get(`${prodServerUrl}/polls/${encodeURIComponent(pollIdParam)}`);
        } catch (e) {
          if (fallbackId) {
            pRes = await axios.get(`${prodServerUrl}/polls/${encodeURIComponent(fallbackId)}`);
          } else {
            throw e;
          }
        }
        const data = pRes?.data?.data;
        if (!mounted) return;
        // Get results (includes user vote if any)
        const rRes = await axios.get(`${prodServerUrl}/polls/${encodeURIComponent(data?._id || fallbackId || pollIdParam)}/results`, {
          headers: isLoggedIn ? { 'x-auth-token': auth.accessToken } : {},
        });
        const results = rRes?.data?.data;
        const merged = {
          ...(data || {}),
          options: Array.isArray(results?.options) ? results.options : (data?.options || []),
          userVoted: !!results?.userVoted,
          userVote: Array.isArray(results?.userVote) ? results.userVote[0] : results?.userVote,
        };
        setPoll(merged);

        // Redirect to slug-only URL when available
        const looksLikeObjectId = String(pollIdParam || '').match(/^[0-9a-fA-F]{24}$/);
        if (merged && merged.slug) {
          const desired = `/poll/${encodeURIComponent(merged.slug)}`;
          const current = typeof window !== 'undefined' ? window.location.pathname : '';
          const hasQuery = typeof window !== 'undefined' && window.location.search && window.location.search.length > 1;
          if (looksLikeObjectId || current !== desired || (fallbackId && hasQuery)) {
            router.replace(desired);
          }
        }
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || 'Failed to load poll');
        setPoll(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadPoll();
    return () => { mounted = false; };
  }, [pollIdParam, fallbackId, isLoggedIn, auth?.accessToken]);

  const handleVote = async (optionIndex) => {
    if (!poll || !poll._id) return;
    if (!isLoggedIn) { router.push('/login'); return; }
    try {
      setVoting(true);
      await axios.post(
        `${prodServerUrl}/polls/${encodeURIComponent(poll._id)}/vote`,
        { optionIndexes: [optionIndex] },
        { headers: { 'x-auth-token': auth.accessToken } }
      );
      const { data } = await axios.get(`${prodServerUrl}/polls/${encodeURIComponent(poll._id)}/results`, {
        headers: isLoggedIn ? { 'x-auth-token': auth.accessToken } : {},
      });
      const r = data?.data;
      setPoll((prev) => ({
        ...(prev || {}),
        options: Array.isArray(r?.options) ? r.options : (prev?.options || []),
        userVoted: true,
        userVote: Array.isArray(r?.userVote) ? r.userVote[0] : optionIndex,
      }));
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to vote');
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="flex">
        <Sidebar />

        <main className={`flex-1 p-6 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'lg:ml-64 ml-0' : 'ml-0'
        }`}>
          <div className="max-w-3xl mx-auto">
            {loading && (
              <div className="rounded-lg border border-gray-200 p-4 text-gray-600">Loading poll...</div>
            )}
            {error && (
              <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700 mb-4">{error}</div>
            )}
            {poll && (
              <article className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{poll.title}</h1>
                {!!poll.category?.name && (
                  <div className="text-sm text-gray-500 mb-4">Category: {poll.category.name}</div>
                )}

                {!!poll.description && (
                  <div className="prose max-w-none mb-6 text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeHtml(poll.description) }} />
                )}

                {/* Voting/Results */}
                <div className="space-y-3">
                  {Array.isArray(poll.options) && poll.options.map((option, index) => {
                    const votes = Number(option.votes || 0);
                    const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                    const isUserVote = poll.userVoted && Number(poll.userVote) === index;
                    return (
                      <div key={index} className="relative">
                        {poll.userVoted ? (
                          <>
                            <div className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                              isUserVote ? 'border-[#C96442] bg-[#C96442]/5' : 'border-gray-200'
                            }`}>
                              <span className={`font-medium ${isUserVote ? 'text-[#C96442]' : 'text-gray-700'}`}>{option.text}</span>
                              <span className="text-sm text-gray-500">{votes} votes ({percent}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                              <div className={`h-2 rounded-full ${isUserVote ? 'bg-[#C96442]' : 'bg-gray-400'}`} style={{ width: `${percent}%` }}></div>
                            </div>
                          </>
                        ) : (
                          <button
                            type="button"
                            disabled={voting}
                            onClick={() => handleVote(index)}
                            className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-[#C96442] hover:bg-[#C96442]/5 transition-colors cursor-pointer disabled:opacity-60"
                          >
                            {option.text}
                          </button>
                        )}
                      </div>
                    );
                  })}
                  <p className="text-sm text-gray-500">Total votes: {totalVotes}</p>
                </div>
              </article>
            )}
          </div>
        </main>
      </div>

      <LoginModal isOpen={false} onClose={() => {}} />
    </div>
  );
}


