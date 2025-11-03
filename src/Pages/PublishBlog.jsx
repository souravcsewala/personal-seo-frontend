'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import LoginModal from '../components/auth/LoginModal';
import dynamic from 'next/dynamic';
const QuillEditor = dynamic(() => import('../components/common/QuillEditor'), { ssr: false });
import { useApp } from '../context/AppContext';
import { prodServerUrl } from '../global/server';

export default function PublishBlog() {
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { sidebarOpen } = useApp();
  const auth = useSelector((s) => s.auth);
  const isLoggedIn = !!auth?.isAuthenticated && !!auth?.accessToken;
  const [authReady, setAuthReady] = useState(false);

  // Dynamic categories from backend
  const [categories, setCategories] = useState([]);
  const [catsLoading, setCatsLoading] = useState(false);
  const [catsError, setCatsError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    featuredImage: '',
    metaDescription: '',
    category: '',
    tags: '',
    imageAlt: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [policy, setPolicy] = useState(null);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [contentWordCount, setContentWordCount] = useState(0);

  const countWordsFromHtml = (html) => {
    try {
      const el = document.createElement('div');
      el.innerHTML = html || '';
      const text = (el.textContent || el.innerText || '').trim();
      if (!text) return 0;
      return text.split(/\s+/).filter(Boolean).length;
    } catch (_) { return 0; }
  };

  // Redirect to login if not authenticated, but wait for hydration/localStorage
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('authState') : null;
      const stored = raw ? JSON.parse(raw) : null;
      const hasToken = !!stored?.accessToken;
      if (!isLoggedIn && !hasToken) {
        router.push('/login');
      } else {
        setAuthReady(true);
      }
    } catch (_) {
      if (!isLoggedIn) router.push('/login');
      else setAuthReady(true);
    }
  }, [isLoggedIn, router]);

  // Load categories
  useEffect(() => {
    let mounted = true;
    (async () => {
      setCatsLoading(true);
      setCatsError('');
      try {
        const { data } = await axios.get(`${prodServerUrl}/get-all-category`);
        if (!mounted) return;
        const items = Array.isArray(data?.data) ? data.data : [];
        setCategories(items);
      } catch (e) {
        if (!mounted) return;
        setCatsError('Failed to load categories');
        setCategories([]);
      } finally {
        if (mounted) setCatsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Load backlink policy (public)
  useEffect(() => {
    let mounted = true;
    (async () => {
      setPolicyLoading(true);
      try {
        const { data } = await axios.get(`${prodServerUrl}/admin/blog-link-policy-public`);
        if (!mounted) return;
        setPolicy(data?.data || null);
      } catch (_) {
        if (!mounted) return;
        setPolicy(null);
      } finally {
        if (mounted) setPolicyLoading(false);
      }
    })();
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
    setSubmitError('');
    setSubmitting(true);
    try {
      const wc = countWordsFromHtml(formData.content);
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('content', formData.content);
      if (formData.metaDescription) fd.append('metaDescription', formData.metaDescription);
      fd.append('category', formData.category);
      fd.append('tags', formData.tags);
      if (imageFile) {
        fd.append('image', imageFile);
      }
      if (formData.imageAlt) {
        fd.append('imageAlt', formData.imageAlt);
      }
      const headers = { 'x-auth-token': auth.accessToken };
      const { data } = await axios.post(`${prodServerUrl}/blogs/create-blog`, fd, { headers });
      const created = data?.data;
      const slug = created?.slug || created?._id;
      if (slug) router.push(`/blog/${encodeURIComponent(slug)}`);
      else router.push('/');
    } catch (err) {
      setSubmitError(err?.response?.data?.message || err.message || 'Failed to publish');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // In a real app, you'd upload this to a cloud service
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          featuredImage: e.target.result
        }));
      };
      reader.readAsDataURL(file);
      setImageFile(file);
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600">Loading...</div>
    );
  }

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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Publish Blog Post</h1>
              <p className="text-gray-600">Share your SEO knowledge and insights with the community.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Blog Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter an engaging title for your blog post"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent text-lg"
                    required
                  />
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
                    placeholder="Enter relevant tags separated by commas (e.g., seo, content-marketing, analytics)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Add specific tags to help readers find your content and improve SEO.
                  </p>
                </div>

                {/* Meta Description removed: auto-generated from content on backend if absent */}

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
                    <option value="" disabled>{catsLoading ? 'Loading...' : 'Select a category'}</option>
                    {categories.map((cat) => (
                      <option key={cat?._id || cat?.id || cat?.name} value={cat?._id || cat?.id || cat?.name}>
                        {cat?.name || 'Unnamed'}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mt-2">
                    Choose the most appropriate category for your blog post.
                  </p>
                  {catsError && (
                    <p className="text-sm text-red-600 mt-1">{catsError}</p>
                  )}
                </div>

                {/* Featured Image */}
                <div>
                  <label htmlFor="featuredImage" className="block text-sm font-medium text-gray-700 mb-2">
                    Featured Image
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {formData.featuredImage ? (
                      <div className="space-y-4">
                        <img
                          src={formData.featuredImage}
                          alt={formData.imageAlt || 'Featured image'}
                          className="max-h-48 mx-auto rounded-lg"
                        />
                        <div className="flex items-center justify-center gap-3">
                          <input
                            type="text"
                            name="imageAlt"
                            value={formData.imageAlt}
                            onChange={handleInputChange}
                            placeholder="Alt text for the image (for accessibility/SEO)"
                            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, featuredImage: '', imageAlt: '' }))}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove Image
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-600 mb-2">Upload a featured image</p>
                        <input
                          type="file"
                          id="featuredImage"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <label
                          htmlFor="featuredImage"
                          className="bg-[#C96442] text-white px-4 py-2 rounded-lg hover:bg-[#C96442]/90 transition-colors cursor-pointer"
                        >
                          Choose Image
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                    Content *
                  </label>
                  <QuillEditor
                    value={formData.content}
                    onChange={(content) => {
                      setFormData(prev => ({ ...prev, content }));
                      setContentWordCount(countWordsFromHtml(content));
                    }}
                    height={450}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Use the formatting toolbar to style your content. You can add headings, lists, tables, images, links, and more.
                  </p>
                  <p className="text-sm mt-1 text-gray-600">Words: {contentWordCount}</p>
                </div>

                {/* Blog Guidelines */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-medium text-orange-900 mb-2">Publishing Guidelines</h4>
                  <ul className="text-sm text-orange-800 space-y-1">
                    <li>• Aim for thorough, high-quality content for better SEO and readability</li>
                    <li>• Add a relevant featured image (optimized size)</li>
                    <li>• Use headings (H2/H3), bullet points, and short paragraphs</li>
                    <li>• Include internal and external links where appropriate</li>
                    <li>• Add 3-6 descriptive tags for discoverability</li>
                    <li>• Proofread for grammar, clarity, and factual accuracy</li>
                  </ul>
                  <div className="mt-4 text-sm text-orange-900">
                    <h5 className="font-semibold mb-1">Backlink Policy</h5>
                    {policyLoading && <p className="text-orange-800">Loading policy…</p>}
                    {!policyLoading && policy && (
                      <ul className="list-disc ml-5 space-y-1">
                        <li>Default rel policy: <span className="font-medium">{policy.blogs?.policy}</span></li>
                        <li>External-only enforcement: <span className="font-medium">{policy.blogs?.externalOnly ? 'Yes' : 'No'}</span></li>
                        {typeof policy.blogs?.maxExternalLinks === 'number' && (
                          <li>Max external links: <span className="font-medium">{policy.blogs.maxExternalLinks}</span></li>
                        )}
                        {typeof policy.blogs?.maxDofollowLinks === 'number' && (
                          <li>Max dofollow links: <span className="font-medium">{policy.blogs.maxDofollowLinks}</span></li>
                        )}
                        <li>If limits exceeded: <span className="font-medium">{policy.blogs?.exceedMode}</span></li>
                        <li>Open links in new tab: <span className="font-medium">{policy.blogs?.openInNewTab ? 'Yes' : 'No'}</span></li>
                        {policy.blogs?.relWhenNofollow && (
                          <li>rel when nofollow: <span className="font-medium">{policy.blogs.relWhenNofollow}</span></li>
                        )}
                        {Array.isArray(policy.blogs?.whitelist) && policy.blogs.whitelist.length > 0 && (
                          <li>Whitelist: <span className="font-medium">{policy.blogs.whitelist.join(', ')}</span></li>
                        )}
                        {Array.isArray(policy.blogs?.blacklist) && policy.blogs.blacklist.length > 0 && (
                          <li>Blacklist: <span className="font-medium">{policy.blogs.blacklist.join(', ')}</span></li>
                        )}
                        {Array.isArray(policy.internalDomains) && policy.internalDomains.length > 0 && (
                          <li>Internal domains: <span className="font-medium">{policy.internalDomains.join(', ')}</span></li>
                        )}
                      </ul>
                    )}
                    {!policyLoading && !policy && (
                      <p className="text-orange-800">Backlink policy is not configured.</p>
                    )}
                  </div>
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
                    className={`px-6 py-2 text-white rounded-lg transition-colors cursor-pointer ${submitting ? 'bg-[#C96442]/60' : 'bg-[#C96442] hover:bg-[#C96442]/90'}`}
                  >
                    {submitting ? 'Publishing...' : 'Publish Blog Post'}
                  </button>
                </div>
                {submitError && (
                  <div className="mt-2 text-sm text-red-600">{submitError}</div>
                )}
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
