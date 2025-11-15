'use client';

import React from 'react';

/**
 * Skeleton Loader Component
 * Modern shimmer effect for loading states
 */
export default function Skeleton({
 className = '',
 variant = 'text',
 width,
 height,
 = 'md',
 ...props
}) {
 const baseStyles = 'skeleton';
 
 const variants = {
  text: 'h-4',
  title: 'h-6',
  avatar: '',
  card: 'h-32',
  image: 'h-48',
 };
 
 const roundedStyles = {
  none: '',
  sm: '',
  md: '',
  lg: '',
  full: '',
 };
 
 const style = {};
 if (width) style.width = width;
 if (height) style.height = height;
 
 return (
  <div
   className={`
    ${baseStyles}
    ${variants[variant]}
    ${roundedStyles[rounded]}
    ${className}
   `}
   style={style}
   {...props}
  />
 );
}

/**
 * Skeleton Card - Pre-built card skeleton
 */
export function SkeletonCard() {
 return (
  <div className="bg-white border border-gray-200 p-6 space-y-4">
   <div className="flex items-center space-x-3">
    <Skeleton variant="avatar" width="40px" height="40px" rounded="full" />
    <div className="flex-1 space-y-2">
     <Skeleton variant="text" width="30%" />
     <Skeleton variant="text" width="50%" />
    </div>
   </div>
   <Skeleton variant="title" width="80%" />
   <Skeleton variant="text" width="100%" />
   <Skeleton variant="text" width="90%" />
   <Skeleton variant="image" rounded="lg" />
   <div className="flex items-center space-x-4">
    <Skeleton variant="text" width="60px" />
    <Skeleton variant="text" width="60px" />
    <Skeleton variant="text" width="60px" />
   </div>
  </div>
 );
}

