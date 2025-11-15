'use client';

// Force dynamic rendering to prevent prerender errors with client hooks
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { useSelector } from '../../../redux/useSelectorSafe';
import { useRouter } from 'next/navigation';
import { useApp } from '../../../context/AppContext';
import Header from '../../../components/layout/Header';
import Sidebar from '../../../components/layout/Sidebar';
import Link from 'next/link';
import Image from 'next/image';

const statusOptions = ['all', 'pending', 'approved', 'declined'];

export default function PollApprovalPage() {
 const { sidebarOpen } = useApp();
 const auth = useSelector((s) => s.auth, { isAuthenticated: false, accessToken: null });
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

 // Demo data for poll approval
 const polls = useMemo(() => [
  {
   id: 13,
   type: 'poll',
   title: 'What is your preferred JavaScript framework?',
   description: 'Help us understand the community preferences for JavaScript frameworks in 2024.',
   author: {
    name: 'Kevin Park',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
   },
   publishDate: '2024-01-15',
   status: 'pending',
   options: [
    { text: 'React', votes: 0 },
    { text: 'Vue.js', votes: 0 },
    { text: 'Angular', votes: 0 },
    { text: 'Svelte', votes: 0 }
   ]
  },
  {
   id: 14,
   type: 'poll',
   title: 'Which database do you use most frequently?',
   description: 'Share your experience with different database systems.',
   author: {
    name: 'Sophie Turner',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
   },
   publishDate: '2024-01-14',
   status: 'approved',
   options: [
    { text: 'PostgreSQL', votes: 0 },
    { text: 'MySQL', votes: 0 },
    { text: 'MongoDB', votes: 0 },
    { text: 'SQLite', votes: 0 }
   ]
  },
  {
   id: 15,
   type: 'poll',
   title: 'What is your primary development environment?',
   description: 'Let\'s see what development tools the community prefers.',
   author: {
    name: 'James Miller',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
   },
   publishDate: '2024-01-13',
   status: 'declined',
   options: [
    { text: 'VS Code', votes: 0 },
    { text: 'WebStorm', votes: 0 },
    { text: 'Sublime Text', votes: 0 },
    { text: 'Vim/Neovim', votes: 0 }
   ]
  },
  {
   id: 16,
   type: 'poll',
   title: 'How do you prefer to deploy your applications?',
   description: 'Share your deployment strategies and preferences.',
   author: {
    name: 'Emma Watson',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
   },
   publishDate: '2024-01-12',
   status: 'pending',
   options: [
    { text: 'Docker', votes: 0 },
    { text: 'Kubernetes', votes: 0 },
    { text: 'Serverless', votes: 0 },
    { text: 'Traditional VPS', votes: 0 }
   ]
  },
  {
   id: 17,
   type: 'poll',
   title: 'What is your experience level with TypeScript?',
   description: 'Help us understand the TypeScript adoption in the community.',
   author: {
    name: 'Daniel Kim',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
   },
   publishDate: '2024-01-11',
   status: 'approved',
   options: [
    { text: 'Beginner', votes: 0 },
    { text: 'Intermediate', votes: 0 },
    { text: 'Advanced', votes: 0 },
    { text: 'Expert', votes: 0 }
   ]
  },
  {
   id: 18,
   type: 'poll',
   title: 'Which CSS framework do you use most?',
   description: 'Share your CSS framework preferences for modern web development.',
   author: {
    name: 'Olivia Brown',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'
   },
   publishDate: '2024-01-10',
   status: 'declined',
   options: [
    { text: 'Tailwind CSS', votes: 0 },
    { text: 'Bootstrap', votes: 0 },
    { text: 'Material-UI', votes: 0 },
    { text: 'Styled Components', votes: 0 }
   ]
  }
 ], []);

 const filtered = useMemo(() => {
  return polls.filter(p => {
   const matchesStatus = status === 'all' ? true : (p.status || 'pending') === status;
   const q = search.trim().toLowerCase();
   const matchesSearch = !q || p.title.toLowerCase().includes(q) || (p.author?.name || '').toLowerCase().includes(q);
   return matchesStatus && matchesSearch;
  });
 }, [polls, status, search]);

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
       <h1 className="text-2xl font-bold text-gray-900">Available Polls</h1>
       <div className="flex items-center gap-3 w-full sm:w-auto">
        <input
         value={search}
         onChange={e => setSearch(e.target.value)}
         placeholder="Search polls..."
         className="w-full sm:w-64 px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#C96442] focus:border-transparent"
        />
        <select
         value={status}
         onChange={e => setStatus(e.target.value)}
         className="px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#C96442] focus:border-transparent"
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
        <article key={item.id} className="bg-white shadow-sm border border-gray-200 p-5 flex flex-col h-full">
         <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
           <span className={`text-xs px-2 py-1 font-medium ${
            (item.status || 'pending') === 'approved' ? 'bg-green-100 text-green-700' :
            (item.status || 'pending') === 'declined' ? 'bg-red-100 text-red-700' :
            'bg-yellow-100 text-yellow-700'
           }`}>
            {(item.status || 'pending').toUpperCase()}
           </span>
           <Image src={item.author.avatar} alt={item.author.name} width={32} height={32} className="w-8 h-8 " />
          </div>
          <div className="flex items-center space-x-2 mb-2">
           <span className="font-medium text-gray-900">{item.author.name}</span>
           <span className="text-gray-400">•</span>
           <span className={`px-2 py-0.5 text-xs font-medium ${
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
            <Link href={`/admin/post/${item.id}`} className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 transition-colors">View Post</Link>
            <div className="flex gap-2">
             <button className="flex-1 border-2 border-green-400 text-green-600 hover:bg-green-50 px-4 py-2 transition-colors cursor-pointer">Approve</button>
             <button className="flex-1 border-2 border-red-400 text-red-600 hover:bg-red-50 px-4 py-2 transition-colors cursor-pointer">Decline</button>
            </div>
           </div>
          )}

          {(item.status || 'pending') === 'approved' && (
           <div className="space-y-2">
            <Link href={`/admin/post/${item.id}`} className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 transition-colors">View Post</Link>
            <button className="w-full border-2 border-red-400 text-red-600 hover:bg-red-50 px-4 py-2 transition-colors cursor-pointer">Decline</button>
           </div>
          )}

          {(item.status || 'pending') === 'declined' && (
           <div className="space-y-2">
            <Link href={`/admin/post/${item.id}`} className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 transition-colors">View Post</Link>
            <button className="w-full border-2 border-green-400 text-green-600 hover:bg-green-50 px-4 py-2 transition-colors cursor-pointer">Approve</button>
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



