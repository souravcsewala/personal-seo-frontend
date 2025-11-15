'use client';

import React from 'react';

/**
 * Modern Input Component
 * Supports icons, labels, errors, and validation states
 */
export default function Input({
 label,
 error,
 helperText,
 icon,
 iconPosition = 'left',
 className = '',
 ...props
}) {
 const hasError = !!error;
 const baseStyles = `
  w-full px-4 py-2.5
  border 
  bg-white
  text-gray-900
  placeholder-gray-400
  focus:outline-none focus:ring-2 focus:ring-offset-0
  transition-all duration-200
  ${hasError 
   ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
   : 'border-gray-300 focus:border-[#C96442] focus:ring-[#C96442]'
  }
  ${icon && iconPosition === 'left' ? 'pl-10' : ''}
  ${icon && iconPosition === 'right' ? 'pr-10' : ''}
  ${className}
 `;
 
 return (
  <div className="w-full">
   {label && (
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
     {label}
    </label>
   )}
   <div className="relative">
    {icon && iconPosition === 'left' && (
     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <span className="text-gray-400">{icon}</span>
     </div>
    )}
    <input
     className={baseStyles}
     {...props}
    />
    {icon && iconPosition === 'right' && (
     <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
      <span className="text-gray-400">{icon}</span>
     </div>
    )}
   </div>
   {error && (
    <p className="mt-1.5 text-sm text-red-600">{error}</p>
   )}
   {helperText && !error && (
    <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
   )}
  </div>
 );
}

