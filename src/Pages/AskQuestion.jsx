'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
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
  const auth = useSelector((s) => s.auth);
  const isLoggedIn = !!auth?.isAuthenticated && !!auth?.accessToken;

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
    <div className="min-h-screen bg-gray-50">
      <Header onLoginClick={() => setShowLoginModal(true)} />
      
      <div className="flex">
        <Sidebar />
        
        <main className={`flex-1 p-6 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'lg:ml-64 ml-0' : 'ml-0'
        }`}>
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Ask a Question</h1>
              <p className="text-gray-600">Get help from the SEO community. Be specific and provide context for better answers.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="space-y-6">
                {/* Category */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent"
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
                  <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="Enter relevant tags separated by commas (e.g., core-web-vitals, mobile-seo, wordpress)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Add specific tags to help others find and answer your question.
                  </p>
                </div>

                {/* Guidelines */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Question Guidelines</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Be specific and provide context</li>
                    <li>• Include what you{'"'}ve already tried</li>
                    <li>• Add relevant tags for better visibility</li>
                    <li>• Be respectful and professional</li>
                  </ul>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-[#C96442] text-white rounded-lg hover:bg-[#C96442]/90 transition-colors cursor-pointer disabled:opacity-60"
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
