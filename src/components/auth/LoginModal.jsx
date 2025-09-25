'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function LoginModal({ isOpen, onClose }) {
  const { login } = useApp();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const userData = {
      name: 'Demo User',
      handle: '@demouser',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
      email: formData.email
    };
    login(userData);
    onClose();
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Login
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent" required />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} id="password" name="password" value={formData.password} onChange={handleInputChange} className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent" required />
              <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute inset-y-0 right-0 px-3 text-sm text-gray-600 hover:text-gray-800" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button type="submit" className="w-full bg-[#C96442] text-white py-2 px-4 rounded-lg hover:bg-[#C96442]/90 transition-colors font-medium">
            Login
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/register" onClick={onClose} className="text-[#C96442] hover:text-[#C96442]/80 font-medium">
            Don't have an account? Create one
          </Link>
        </div>

        <div className="mt-4 text-center">
          <button className="text-gray-500 hover:text-gray-700 text-sm cursor-pointer">Forgot your password?</button>
        </div>
      </div>

    </div>
  );
}


