'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import LoginModal from '../components/auth/LoginModal';
import { useApp } from '../context/AppContext';

export default function QuestionDetail() {
  const router = useRouter();
  const params = useParams();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [newAnswer, setNewAnswer] = useState('');
  const { posts, sidebarOpen, likePost } = useApp();

  // Get the question by ID
  const questionId = parseInt(params?.id || '1');
  const question = posts.find(post => post.id === questionId && post.type === 'question');

  // Dummy answers data
  const [answers, setAnswers] = useState([
    {
      id: 1,
      author: {
        name: "Alex Johnson",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
      },
      content: "Based on my experience with similar issues, I'd recommend checking your Core Web Vitals first. The most common cause of slow loading is unoptimized images. Try compressing your images and using WebP format. Also, consider implementing lazy loading for images below the fold.",
      timestamp: "2 hours ago",
      likes: 12,
      isAccepted: false
    },
    {
      id: 2,
      author: {
        name: "Sarah Wilson",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face"
      },
      content: "I've had great success with implementing a CDN. It reduced my page load time by 40%. Also, make sure you're using browser caching effectively. You can check your current performance using Google PageSpeed Insights.",
      timestamp: "4 hours ago",
      likes: 8,
      isAccepted: true
    },
    {
      id: 3,
      author: {
        name: "Mike Chen",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face"
      },
      content: "Don't forget about server-side optimizations. If you're using WordPress, consider using a caching plugin like WP Rocket. Also, minimize your CSS and JavaScript files, and remove any unused plugins or themes.",
      timestamp: "6 hours ago",
      likes: 15,
      isAccepted: false
    }
  ]);

  // Related questions (dummy data)
  const relatedQuestions = posts.filter(post => post.type === 'question' && post.id !== questionId).slice(0, 3);

  const handleAddAnswer = (e) => {
    e.preventDefault();
    if (newAnswer.trim()) {
      const answer = {
        id: answers.length + 1,
        author: {
          name: "Current User",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
        },
        content: newAnswer,
        timestamp: "Just now",
        likes: 0,
        isAccepted: false
      };
      setAnswers([answer, ...answers]);
      setNewAnswer('');
    }
  };

  const handleAcceptAnswer = (answerId) => {
    setAnswers(answers.map(answer => ({
      ...answer,
      isAccepted: answer.id === answerId
    })));
  };

  if (!question) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onLoginClick={() => setShowLoginModal(true)} />
        <div className="flex">
          <Sidebar />
          <main className={`flex-1 p-6 transition-all duration-300 ease-in-out ${
            sidebarOpen ? 'lg:ml-64 ml-0' : 'ml-0'
          }`}>
            <div className="max-w-4xl mx-auto">
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Question not found</h1>
                <button
                  onClick={() => router.push('/')}
                  className="bg-[#C96442] text-white px-6 py-2 rounded-lg hover:bg-[#C96442]/90 transition-colors"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
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
            {/* Question Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <img
                  src={question.author.avatar}
                  alt={question.author.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{question.author.name}</h2>
                  <p className="text-gray-500 text-sm">{question.publishDate}</p>
                </div>
                <div className="ml-auto">
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Question
                  </span>
                </div>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{question.title}</h1>
              
              <div className="flex items-center space-x-6 text-gray-500 mb-6">
                <button 
                  onClick={() => likePost(question.id)}
                  className={`flex items-center space-x-2 transition-colors ${
                    question.isLiked 
                      ? 'text-[#C96442]' 
                      : 'text-gray-500 hover:text-[#C96442]'
                  }`}
                >
                  <svg 
                    className="w-5 h-5" 
                    fill={question.isLiked ? "#C96442" : "none"} 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{question.likes || 0}</span>
                </button>
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>{answers.length} answers</span>
                </div>
              </div>
            </div>

            {/* Question Content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
              <div className="prose max-w-none">
                <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
                  {question.description}
                </p>
              </div>
              
              {/* Tags */}
              {question.tags && question.tags.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {question.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Add Answer Form */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Your Answer</h3>
              <form onSubmit={handleAddAnswer}>
                <textarea
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="Share your knowledge and help the community by providing a detailed answer..."
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent mb-4"
                  required
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-[#C96442] text-white px-6 py-2 rounded-lg hover:bg-[#C96442]/90 transition-colors"
                  >
                    Post Answer
                  </button>
                </div>
              </form>
            </div>

            {/* Answers Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Answers ({answers.length})</h2>
              
              <div className="space-y-6">
                {answers.map((answer) => (
                  <div key={answer.id} className={`bg-white rounded-lg shadow-sm border p-6 ${
                    answer.isAccepted ? 'border-green-200 bg-green-50' : 'border-gray-200'
                  }`}>
                    <div className="flex items-start space-x-4">
                      <img
                        src={answer.author.avatar}
                        alt={answer.author.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{answer.author.name}</h3>
                          <span className="text-gray-500 text-sm">{answer.timestamp}</span>
                          {answer.isAccepted && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                              Accepted Answer
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-4">
                          {answer.content}
                        </p>
                        <div className="flex items-center space-x-4">
                          <button className="flex items-center space-x-2 text-gray-500 hover:text-[#C96442] transition-colors cursor-pointer">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span>{answer.likes}</span>
                          </button>
                          {!answer.isAccepted && (
                            <button 
                              onClick={() => handleAcceptAnswer(answer.id)}
                              className="text-green-600 hover:text-green-800 text-sm font-medium transition-colors"
                            >
                              Accept Answer
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Related Questions */}
            {relatedQuestions.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Related Questions</h3>
                <div className="space-y-4">
                  {relatedQuestions.map((relatedQuestion) => (
                    <div key={relatedQuestion.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <h4 
                        className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-[#C96442] transition-colors mb-2"
                        onClick={() => router.push(`/question/${relatedQuestion.id}`)}
                      >
                        {relatedQuestion.title}
                      </h4>
                      <p className="text-gray-600 text-sm mb-2">{relatedQuestion.description.substring(0, 150)}...</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{relatedQuestion.author.name}</span>
                        <span>•</span>
                        <span>{relatedQuestion.publishDate}</span>
                        <span>•</span>
                        <span>{relatedQuestion.answers || 0} answers</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </div>
  );
}
