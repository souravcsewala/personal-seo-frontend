'use client';

import { useState } from 'react';

export default function PreferencesModal({ isOpen, onClose, onComplete }) {
 const [selectedCategories, setSelectedCategories] = useState([]);

 const categories = [
  {
   name: "Sports",
   image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop&crop=center",
   color: "bg-red-100 border-red-200"
  },
  {
   name: "Music",
   image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop&crop=center",
   color: "bg-purple-100 border-purple-200"
  },
  {
   name: "Politics",
   image: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=100&h=100&fit=crop&crop=center",
   color: "bg-blue-100 border-blue-200"
  },
  {
   name: "Topics",
   image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=100&h=100&fit=crop&crop=center",
   color: "bg-green-100 border-green-200"
  },
  {
   name: "Technology",
   image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=100&h=100&fit=crop&crop=center",
   color: "bg-indigo-100 border-indigo-200"
  },
  {
   name: "Business",
   image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=center",
   color: "bg-gray-100 border-gray-200"
  },
  {
   name: "Health",
   image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=100&h=100&fit=crop&crop=center",
   color: "bg-emerald-100 border-emerald-200"
  },
  {
   name: "Education",
   image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=100&h=100&fit=crop&crop=center",
   color: "bg-yellow-100 border-yellow-200"
  },
  {
   name: "Entertainment",
   image: "https://images.unsplash.com/photo-1489599808421-2b3b3b3b3b3b?w=100&h=100&fit=crop&crop=center",
   color: "bg-pink-100 border-pink-200"
  },
  {
   name: "Travel",
   image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=100&h=100&fit=crop&crop=center",
   color: "bg-cyan-100 border-cyan-200"
  },
  {
   name: "Food",
   image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=100&h=100&fit=crop&crop=center",
   color: "bg-orange-100 border-orange-200"
  },
  {
   name: "Fashion",
   image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&h=100&fit=crop&crop=center",
   color: "bg-rose-100 border-rose-200"
  },
  {
   name: "Voice Search",
   image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=100&h=100&fit=crop&crop=center",
   color: "bg-violet-100 border-violet-200"
  },
  {
   name: "Featured Snippets",
   image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&h=100&fit=crop&crop=center",
   color: "bg-amber-100 border-amber-200"
  },
  {
   name: "Page Speed",
   image: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=100&h=100&fit=crop&crop=center",
   color: "bg-teal-100 border-teal-200"
  },
  {
   name: "Community",
   image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&h=100&fit=crop&crop=center",
   color: "bg-lime-100 border-lime-200"
  },
  {
   name: "SEO Tools",
   image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=100&h=100&fit=crop&crop=center",
   color: "bg-slate-100 border-slate-200"
  }
 ];

 const toggleCategory = (categoryName) => {
  setSelectedCategories(prev => 
   prev.includes(categoryName)
    ? prev.filter(cat => cat !== categoryName)
    : [...prev, categoryName]
  );
 };

 const handleComplete = () => {
  // Save preferences (in a real app, this would be sent to backend)
  console.log('Selected categories:', selectedCategories);
  onComplete(selectedCategories);
  onClose();
 };

 const handleSkip = () => {
  onComplete([]);
  onClose();
 };

 if (!isOpen) return null;

 return (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
   <div className="bg-white p-8 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
    <div className="flex justify-between items-center mb-6">
     <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">
       Choose Your Preferences
      </h2>
      <p className="text-gray-600">
       Select the categories you're interested in to personalize your experience
      </p>
     </div>
     <button
      onClick={onClose}
      className="text-gray-400 hover:text-gray-600 cursor-pointer"
     >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
     </button>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
     {categories.map((category) => {
      const isSelected = selectedCategories.includes(category.name);
      return (
       <div
        key={category.name}
        onClick={() => toggleCategory(category.name)}
        className={`
         relative cursor-pointer transition-all duration-200 transform hover:scale-105
         ${isSelected ? 'ring-2 ring-[#C96442] ring-offset-2' : ''}
        `}
       >
        <div className={`
         w-20 h-20 border-2 overflow-hidden mx-auto mb-2
         ${category.color}
         ${isSelected ? 'border-[#C96442]' : 'border-gray-200'}
        `}>
         <img
          src={category.image}
          alt={category.name}
          className="w-full h-full object-cover"
         />
        </div>
        <p className="text-center text-sm font-medium text-gray-700">
         {category.name}
        </p>
        {isSelected && (
         <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#C96442] flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
         </div>
        )}
       </div>
      );
     })}
    </div>

    <div className="flex justify-between items-center pt-6 border-t border-gray-200">
     <button
      onClick={handleSkip}
      className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors cursor-pointer"
     >
      Skip for now
     </button>
     
     <div className="flex space-x-3">
      <button
       onClick={onClose}
       className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium cursor-pointer"
      >
       Cancel
      </button>
      <button
       onClick={handleComplete}
       className="px-6 py-2 bg-[#C96442] text-white hover:bg-[#C96442]/90 transition-colors font-medium cursor-pointer"
      >
       Complete Setup ({selectedCategories.length} selected)
      </button>
     </div>
    </div>

    {selectedCategories.length > 0 && (
     <div className="mt-4 p-4 bg-[#C96442]/5 ">
      <p className="text-sm text-[#C96442] font-medium mb-2">
       Selected categories: {selectedCategories.join(', ')}
      </p>
     </div>
    )}
   </div>
  </div>
 );
}
