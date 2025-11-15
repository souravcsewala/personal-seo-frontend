'use client';

import React from 'react';
import Image from 'next/image';

/**
 * Modern Avatar Component
 * Sizes: sm, md, lg, xl
 * Supports image, fallback initials, or icon
 */
export default function Avatar({
 src,
 alt = '',
 name = '',
 size = 'md',
 className = '',
 onClick,
 ...props
}) {
 const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
 };
 
 const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
 };
 
 const baseStyles = `
  ${sizes[size]}
  
  flex items-center justify-center
  font-semibold
  bg-gradient-to-br from-[#C96442] to-[#A54F35]
  text-white
  flex-shrink-0
  ${onClick ? 'cursor-pointer hover:ring-2 hover:ring-[#C96442] transition-all' : ''}
  ${className}
 `;
 
 if (src) {
  return (
   <div
    className={baseStyles}
    onClick={onClick}
    {...props}
   >
    <img
     src={src}
     alt={alt || name}
     className="w-full h-full object-cover"
     onError={(e) => {
      e.target.style.display = 'none';
      e.target.nextSibling.style.display = 'flex';
     }}
    />
    <div className="w-full h-full bg-gradient-to-br from-[#C96442] to-[#A54F35] flex items-center justify-center hidden">
     {getInitials(name)}
    </div>
   </div>
  );
 }
 
 return (
  <div
   className={baseStyles}
   onClick={onClick}
   {...props}
  >
   {getInitials(name)}
  </div>
 );
}

