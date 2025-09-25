'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import LoginModal from '../components/auth/LoginModal';
import { useApp } from '../context/AppContext';

export default function AskQuestion() {
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { addQuestion, sidebarOpen } = useApp();
  const [formData, setFormData] = useState({
    title: '',
    question: '',
    tags: '',
    category: ''
  });

  const categories = [
    'Technical SEO',
    'Content Marketing',
    'Link Building',
    'Local SEO',
    'E-commerce SEO',
    'Mobile SEO',
    'Analytics & Reporting',
    'General SEO'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const questionData = {
      title: formData.title,
      description: formData.question,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      category: formData.category,
      author: {
        name: "Current User",
        handle: "@currentuser",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
      }
    };
    
    addQuestion(questionData);
    alert('Question posted successfully!');
    router.push('/');
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
                {/* Question Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Question Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="What's your SEO question? Be specific and clear."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent text-lg"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    A good title helps others understand your question and find it in search results.
                  </p>
                </div>

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
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>


                {/* Question Details */}
                <div>
                  <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
                    Question Details *
                  </label>
                  <textarea
                    id="question"
                    name="question"
                    value={formData.question}
                    onChange={handleInputChange}
                    placeholder="Provide detailed information about your question. Include:
• What you're trying to achieve
• What you've already tried
• Any specific tools or platforms you're using
• Screenshots or examples if relevant"
                    rows={12}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent"
                    required
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
                    <li>• Include what you{"'"}ve already tried</li>
                    <li>• Use clear, descriptive titles</li>
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
                    className="px-6 py-2 bg-[#C96442] text-white rounded-lg hover:bg-[#C96442]/90 transition-colors cursor-pointer"
                  >
                    Post Question
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
