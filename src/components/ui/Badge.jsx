'use client';

import React from 'react';

/**
 * Modern Badge Component
 * Variants: default, primary, success, warning, error, info
 * Sizes: sm, md
 */
export default function Badge({
 children,
 variant = 'default',
 size = 'md',
 className = '',
 ...props
}) {
 const variants = {
  default: 'bg-gray-100 text-gray-800',
  primary: 'bg-[#C96442]/10 text-[#C96442]',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  blog: 'bg-blue-100 text-blue-800',
  question: 'bg-green-100 text-green-800',
  poll: 'bg-purple-100 text-purple-800',
 };
 
 const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
 };
 
 return (
  <span
   className={`
    inline-flex items-center font-medium 
    ${variants[variant]}
    ${sizes[size]}
    ${className}
   `}
   {...props}
  >
   {children}
  </span>
 );
}

