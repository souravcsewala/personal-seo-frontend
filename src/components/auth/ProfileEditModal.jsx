'use client';

import { useState } from 'react';

export default function ProfileEditModal({ userData, onSave, onClose }) {
 const [formData, setFormData] = useState({
  name: userData.name,
  handle: userData.handle,
  email: userData.email,
  bio: userData.bio,
  location: userData.location,
  website: userData.website,
  avatar: userData.avatar
 });

 const handleSubmit = (e) => {
  e.preventDefault();
  onSave(formData);
 };

 const handleChange = (e) => {
  setFormData({
   ...formData,
   [e.target.name]: e.target.value
  });
 };

 return (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
   <div className="bg-white shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
    <div className="flex items-center justify-between p-6 border-b border-gray-200">
     <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
     <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
     </button>
    </div>

    <form onSubmit={handleSubmit} className="p-6 space-y-6">
     <div className="flex items-center space-x-6">
      <img src={formData.avatar} alt="Profile" className="w-20 h-20 " />
      <div className="flex-1">
       <label className="block text-sm font-medium text-gray-700 mb-2">Avatar URL</label>
       <input type="url" name="avatar" value={formData.avatar} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#C96442] focus:border-transparent" placeholder="https://example.com/avatar.jpg" />
      </div>
     </div>

     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
       <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#C96442] focus:border-transparent" required />
      </div>
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-2">Handle</label>
       <input type="text" name="handle" value={formData.handle} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#C96442] focus:border-transparent" required />
      </div>
     </div>

     <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
      <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#C96442] focus:border-transparent" required />
     </div>

     <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
      <textarea name="bio" value={formData.bio} onChange={handleChange} rows={4} className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#C96442] focus:border-transparent" placeholder="Tell us about yourself..." />
     </div>

     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
       <input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#C96442] focus:border-transparent" placeholder="City, Country" />
      </div>
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
       <input type="url" name="website" value={formData.website} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#C96442] focus:border-transparent" placeholder="https://example.com" />
      </div>
     </div>

     <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
      <button type="button" onClick={onClose} className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer">Cancel</button>
      <button type="submit" className="px-6 py-2 bg-[#C96442] text-white hover:bg-[#C96442]/90 transition-colors cursor-pointer">Save Changes</button>
     </div>
    </form>
   </div>
  </div>
 );
}


