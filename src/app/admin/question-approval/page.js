'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useApp } from '../../../context/AppContext';
import Header from '../../../components/layout/Header';
import Sidebar from '../../../components/layout/Sidebar';
import Link from 'next/link';
import Image from 'next/image';

const statusOptions = ['all', 'pending', 'approved', 'declined'];

export default function QuestionApprovalPage() {
  const { sidebarOpen } = useApp();
  const auth = useSelector((s) => s.auth);
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

  // Demo data for question approval
  const questions = useMemo(() => [
    {
      id: 7,
      type: 'question',
      title: 'What are the best practices for React state management?',
      description: 'I\'m working on a large React application and struggling with state management. What are the current best practices for managing complex state in React applications?',
      author: {
        name: 'John Smith',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
      },
      publishDate: '2024-01-15',
      status: 'pending'
    },
    {
      id: 8,
      type: 'question',
      title: 'How to optimize database queries for better performance?',
      description: 'My application is getting slower as the database grows. What are the most effective ways to optimize database queries and improve overall performance?',
      author: {
        name: 'Maria Garcia',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
      },
      publishDate: '2024-01-14',
      status: 'approved'
    },
    {
      id: 9,
      type: 'question',
      title: 'Best way to implement authentication in Next.js?',
      description: 'I need to implement user authentication in my Next.js application. What\'s the most secure and user-friendly approach?',
      author: {
        name: 'Tom Wilson',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
      },
      publishDate: '2024-01-13',
      status: 'declined'
    },
    {
      id: 10,
      type: 'question',
      title: 'CSS Grid vs Flexbox - when to use which?',
      description: 'I\'m confused about when to use CSS Grid versus Flexbox. Can someone explain the key differences and use cases for each?',
      author: {
        name: 'Anna Lee',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
      },
      publishDate: '2024-01-12',
      status: 'pending'
    },
    {
      id: 11,
      type: 'question',
      title: 'How to handle errors in async JavaScript functions?',
      description: 'I\'m having trouble with error handling in my async/await functions. What are the best practices for catching and handling errors properly?',
      author: {
        name: 'Chris Brown',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
      },
      publishDate: '2024-01-11',
      status: 'approved'
    },
    {
      id: 12,
      type: 'question',
      title: 'What\'s the difference between REST and GraphQL APIs?',
      description: 'I need to choose between REST and GraphQL for my API. What are the main differences and which one should I use for my project?',
      author: {
        name: 'Rachel Green',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'
      },
      publishDate: '2024-01-10',
      status: 'declined'
    }
  ], []);

  const filtered = useMemo(() => {
    return questions.filter(p => {
      const matchesStatus = status === 'all' ? true : (p.status || 'pending') === status;
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || p.title.toLowerCase().includes(q) || (p.author?.name || '').toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [questions, status, search]);

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
              <h1 className="text-2xl font-bold text-gray-900">Available Questions</h1>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search questions..."
                  className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C96442] focus:border-transparent"
                />
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C96442] focus:border-transparent"
                >
                  {statusOptions.map(opt => (
                    <option key={opt} value={opt}>{opt[0].toUpperCase()+opt.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(item => (
                <article key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex flex-col h-full">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        (item.status || 'pending') === 'approved' ? 'bg-green-100 text-green-700' :
                        (item.status || 'pending') === 'declined' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {(item.status || 'pending').toUpperCase()}
                      </span>
                      <Image src={item.author.avatar} alt={item.author.name} width={32} height={32} className="w-8 h-8 rounded-full" />
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-gray-900">{item.author.name}</span>
                      <span className="text-gray-400">•</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.type === 'blog' ? 'bg-blue-100 text-blue-800' :
                        item.type === 'question' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {item.type === 'blog' ? 'Blog' : item.type === 'question' ? 'Question' : 'Poll'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-4 line-clamp-2">{item.title}</h3>
                  </div>

                  {/* Actions */}
                  <div className="mt-auto">
                    {(item.status || 'pending') === 'pending' && (
                      <div className="space-y-2">
                        <Link href={`/admin/post/${item.id}`} className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg transition-colors">View Post</Link>
                        <div className="flex gap-2">
                          <button className="flex-1 border-2 border-green-400 text-green-600 hover:bg-green-50 px-4 py-2 rounded-lg transition-colors cursor-pointer">Approve</button>
                          <button className="flex-1 border-2 border-red-400 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors cursor-pointer">Decline</button>
                        </div>
                      </div>
                    )}

                    {(item.status || 'pending') === 'approved' && (
                      <div className="space-y-2">
                        <Link href={`/admin/post/${item.id}`} className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg transition-colors">View Post</Link>
                        <button className="w-full border-2 border-red-400 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors cursor-pointer">Decline</button>
                      </div>
                    )}

                    {(item.status || 'pending') === 'declined' && (
                      <div className="space-y-2">
                        <Link href={`/admin/post/${item.id}`} className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg transition-colors">View Post</Link>
                        <button className="w-full border-2 border-green-400 text-green-600 hover:bg-green-50 px-4 py-2 rounded-lg transition-colors cursor-pointer">Approve</button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}



