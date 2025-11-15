'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from '../redux/useSelectorSafe';
import axios from 'axios';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import LoginModal from '../components/auth/LoginModal';
import { useApp } from '../context/AppContext';
import { prodServerUrl } from '../global/server';
import dynamic from 'next/dynamic';
const QuillEditor = dynamic(() => import('../components/common/QuillEditor'), { ssr: false });

export default function AskQuestion() {
 const router = useRouter();
 const [showLoginModal, setShowLoginModal] = useState(false);
 const { sidebarOpen } = useApp();
 const [formData, setFormData] = useState({
  question: '',
  tags: '',
  category: ''
 });
 const [categories, setCategories] = useState([]);
 const [submitting, setSubmitting] = useState(false);
 const [loadingCats, setLoadingCats] = useState(false);
 const auth = useSelector((s) => s.auth, { isAuthenticated: false, accessToken: null });
 const isLoggedIn = !!auth?.isAuthenticated && !!auth?.accessToken;

 // guard: redirect to login if unauthenticated (direct URL access)
 useEffect(() => {
  try {
   if (!isLoggedIn) {
    router.push('/login');
   }
  } catch (_) {}
 }, [isLoggedIn, router]);

 // load categories from backend
 useEffect(() => {
  let mounted = true;
  async function loadCats() {
   try {
    setLoadingCats(true);
    const { data } = await axios.get(`${prodServerUrl}/get-all-category`);
    const items = Array.isArray(data?.data) ? data.data : [];
    if (!mounted) return;
    setCategories(items);
   } catch (_) {
    if (!mounted) return;
    setCategories([]);
   } finally {
    if (mounted) setLoadingCats(false);
   }
  }
  loadCats();
  return () => { mounted = false; };
 }, []);

 const handleInputChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({
   ...prev,
   [name]: value
  }));
 };

 const handleSubmit = async (e) => {
  e.preventDefault();
  if (!isLoggedIn) { router.push('/login'); return; }

  const payload = {
   description: formData.question,
   tags: formData.tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean),
   category: formData.category,
  };

  try {
   setSubmitting(true);
   const { data } = await axios.post(
    `${prodServerUrl}/questions`,
    payload,
    { headers: { 'x-auth-token': auth.accessToken } }
   );
   const created = data?.data;
   if (created && (created.slug || created._id)) {
    const pretty = created.slug || created._id;
    router.push(`/question/${encodeURIComponent(pretty)}`);
   } else {
    router.push('/');
   }
  } catch (err) {
   alert(err?.response?.data?.message || 'Failed to post question');
  } finally {
   setSubmitting(false);
  }
 };

 return (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
   <Header onLoginClick={() => setShowLoginModal(true)} />
   
   <div className="flex">
    <Sidebar />
    
    <main className={`flex-1 p-6 transition-all duration-300 ease-in-out ${
     sidebarOpen ? 'lg:ml-64 ml-0' : 'ml-0'
    }`}>
     <div className="max-w-4xl mx-auto">
      <div className="mb-8 fade-in">
       <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
        Ask a Question
       </h1>
       <p className="text-lg text-gray-600">Get help from the SEO community. Be specific and provide context for better answers.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 md:p-10 fade-in">
       <div className="space-y-6">
        {/* Category */}
        <div>
         <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">
          Category *
         </label>
         <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleInputChange}
          className="w-full px-4 py-3 border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
          required
         >
          <option value="">{loadingCats ? 'Loading categories...' : 'Select a category'}</option>
          {categories.map((cat) => (
           <option key={cat._id} value={cat._id}>
            {cat.name}
           </option>
          ))}
         </select>
        </div>

        {/* Question Details */}
        <div>
         <label htmlFor="question" className="block text-sm font-semibold text-gray-700 mb-2">
          Question Details *
         </label>
         <QuillEditor
          value={formData.question}
          onChange={(html) => setFormData((prev) => ({ ...prev, question: html }))}
          height={350}
         />
         <p className="text-sm text-gray-500 mt-2">
          The more details you provide, the better answers you'll receive.
         </p>
        </div>

        {/* Tags */}
        <div>
         <label htmlFor="tags" className="block text-sm font-semibold text-gray-700 mb-2">
          Tags
         </label>
         <input
          type="text"
          id="tags"
          name="tags"
          value={formData.tags}
          onChange={handleInputChange}
          placeholder="Enter relevant tags separated by commas (e.g., core-web-vitals, mobile-seo, wordpress)"
          className="w-full px-4 py-3 border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
         />
         <p className="text-sm text-gray-500 mt-2">
          Add specific tags to help others find and answer your question.
         </p>
        </div>

        {/* Guidelines */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 p-6">
         <h4 className="font-bold text-blue-900 mb-3 text-lg">Question Guidelines</h4>
         <ul className="text-sm text-blue-800 space-y-1">
          <li>• Be specific and provide context</li>
          <li>• Include what you{'"'}ve already tried</li>
          <li>• Add relevant tags for better visibility</li>
          <li>• Be respectful and professional</li>
         </ul>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t-2 border-gray-100">
         <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer font-semibold"
         >
          Cancel
         </button>
         <button
          type="submit"
          disabled={submitting}
          className="px-8 py-3 bg-gradient-to-r from-[#C96442] to-[#B85538] text-white hover:from-[#B85538] hover:to-[#A54F35] transition-all duration-200 cursor-pointer disabled:opacity-60 font-semibold shadow-md hover:shadow-lg"
         >
          {submitting ? 'Posting...' : 'Post Question'}
         </button>
        </div>
       </div>
      </form>
     </div>
    </main>
   </div>

   {/* <Footer /> */}
   
   <LoginModal 
    isOpen={showLoginModal} 
    onClose={() => setShowLoginModal(false)} 
   />
  </div>
 );
}
