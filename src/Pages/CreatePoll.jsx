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

export default function CreatePoll() {
 const router = useRouter();
 const [showLoginModal, setShowLoginModal] = useState(false);
 const { sidebarOpen } = useApp();
 const [formData, setFormData] = useState({
  title: '',
  description: '',
  options: ['', ''],
  category: '',
  duration: '7',
  allowMultipleVotes: false,
  tags: ''
 });
 const [categories, setCategories] = useState([]);
 const [loadingCats, setLoadingCats] = useState(false);
 const [submitting, setSubmitting] = useState(false);
 const auth = useSelector((s) => s.auth, { isAuthenticated: false, accessToken: null });
 const isLoggedIn = !!auth?.isAuthenticated && !!auth?.accessToken;

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
  const { name, value, type, checked } = e.target;
  setFormData(prev => ({
   ...prev,
   [name]: type === 'checkbox' ? checked : value
  }));
 };

 const handleOptionChange = (index, value) => {
  const newOptions = [...formData.options];
  newOptions[index] = value;
  setFormData(prev => ({
   ...prev,
   options: newOptions
  }));
 };

 const addOption = () => {
  if (formData.options.length < 10) {
   setFormData(prev => ({
    ...prev,
    options: [...prev.options, '']
   }));
  }
 };

 const removeOption = (index) => {
  if (formData.options.length > 2) {
   const newOptions = formData.options.filter((_, i) => i !== index);
   setFormData(prev => ({
    ...prev,
    options: newOptions
   }));
  }
 };

 const handleSubmit = async (e) => {
  e.preventDefault();
  if (!isLoggedIn) { router.push('/login'); return; }

  const filledOptions = formData.options.filter(option => option.trim() !== '');
  if (filledOptions.length < 2) {
   alert('Please provide at least 2 poll options.');
   return;
  }

  const payload = {
   title: formData.title,
   description: formData.description,
   options: filledOptions,
   category: formData.category,
   duration: formData.duration,
   allowMultipleVotes: formData.allowMultipleVotes,
   tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
  };

  try {
   setSubmitting(true);
   await axios.post(`${prodServerUrl}/polls`, payload, { headers: { 'x-auth-token': auth.accessToken } });
   alert('Poll created successfully!');
   router.push('/');
  } catch (err) {
   alert(err?.response?.data?.message || 'Failed to create poll');
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
       <h1 className="text-3xl font-bold text-gray-900 mb-2">Create a Poll</h1>
       <p className="text-gray-600">Engage the community with a poll and gather insights on SEO topics.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-sm border border-gray-200 p-8">
       <div className="space-y-6">
        {/* Poll Title */}
        <div>
         <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Poll Title *
         </label>
         <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="What would you like to poll the community about?"
          className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent text-lg"
          required
         />
        </div>

        {/* Description */}
        <div>
         <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
         </label>
         <QuillEditor
          value={formData.description}
          onChange={(html) => setFormData((prev) => ({ ...prev, description: html }))}
          height={250}
         />
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
          className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent"
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

        {/* Poll Options */}
        <div>
         <label className="block text-sm font-medium text-gray-700 mb-2">
          Poll Options * (Minimum 2, Maximum 10)
         </label>
         <div className="space-y-3">
          {formData.options.map((option, index) => (
           <div key={index} className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-500 w-8">
             {index + 1}.
            </span>
            <input
             type="text"
             value={option}
             onChange={(e) => handleOptionChange(index, e.target.value)}
             placeholder={`Option ${index + 1}`}
             className="flex-1 px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent"
             required={index < 2}
            />
            {formData.options.length > 2 && (
             <button
              type="button"
              onClick={() => removeOption(index)}
              className="text-red-600 hover:text-red-800 p-1"
             >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
             </button>
            )}
           </div>
          ))}
         </div>
         
         {formData.options.length < 10 && (
          <button
           type="button"
           onClick={addOption}
           className="mt-3 text-[#C96442] hover:text-[#C96442]/80 font-medium text-sm flex items-center space-x-1"
          >
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
           </svg>
           <span>Add Option</span>
          </button>
         )}
        </div>

        {/* Poll Settings */}
        <div className="border-t border-gray-200 pt-6">
         <h3 className="text-lg font-medium text-gray-900 mb-4">Poll Settings</h3>
         
         <div className="space-y-4">
          {/* Duration */}
          <div>
           <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
            Poll Duration (days)
           </label>
           <select
            id="duration"
            name="duration"
            value={formData.duration}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent"
           >
            <option value="1">1 day</option>
            <option value="3">3 days</option>
            <option value="7">1 week</option>
            <option value="14">2 weeks</option>
            <option value="30">1 month</option>
           </select>
          </div>

          {/* Multiple Votes */}
          <div className="flex items-center">
           <input
            type="checkbox"
            id="allowMultipleVotes"
            name="allowMultipleVotes"
            checked={formData.allowMultipleVotes}
            onChange={handleInputChange}
            className="border-gray-300 text-[#C96442] focus:ring-[#C96442]"
           />
           <label htmlFor="allowMultipleVotes" className="ml-2 text-sm text-gray-700">
            Allow multiple votes per user
           </label>
          </div>
         </div>
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
          placeholder="Enter relevant tags separated by commas"
          className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent"
         />
        </div>

        {/* Guidelines */}
        <div className="bg-blue-50 border border-blue-200 p-4">
         <h4 className="font-medium text-blue-900 mb-2">Poll Guidelines</h4>
         <ul className="text-sm text-blue-800 space-y-1">
          <li>• Keep questions clear and unbiased</li>
          <li>• Provide meaningful options</li>
          <li>• Choose appropriate duration</li>
          <li>• Use relevant tags for visibility</li>
          <li>• Be respectful and professional</li>
         </ul>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
         <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
         >
          Cancel
         </button>
         <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 bg-[#C96442] text-white hover:bg-[#C96442]/90 transition-colors cursor-pointer disabled:opacity-60"
         >
          {submitting ? 'Creating...' : 'Create Poll'}
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
