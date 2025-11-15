'use client';

import React from 'react';

/**
 * Modern Button Component
 * Variants: primary, secondary, ghost, danger
 * Sizes: sm, md, lg
 */
export default function Button({
 children,
 variant = 'primary',
 size = 'md',
 className = '',
 disabled = false,
 loading = false,
 icon,
 iconPosition = 'left',
 onClick,
 type = 'button',
 ...props
}) {
 const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
 
 const variants = {
  primary: 'bg-[#C96442] text-white hover:bg-[#B85538] focus:ring-[#C96442] shadow-sm hover:shadow-md',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500 border border-gray-300',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow-md',
  outline: 'bg-transparent text-[#C96442] border-2 border-[#C96442] hover:bg-[#C96442] hover:text-white focus:ring-[#C96442]',
 };
 
 const sizes = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-base gap-2',
  lg: 'px-6 py-3 text-lg gap-2.5',
 };
 
 const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
 };
 
 const iconElement = icon && (
  <span className={iconSizes[size]}>{icon}</span>
 );
 
 return (
  <button
   type={type}
   className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
   disabled={disabled || loading}
   onClick={onClick}
   {...props}
  >
   {loading ? (
    <>
     <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
     </svg>
     <span>Loading...</span>
    </>
   ) : (
    <>
     {iconPosition === 'left' && iconElement}
     {children}
     {iconPosition === 'right' && iconElement}
    </>
   )}
  </button>
 );
}

