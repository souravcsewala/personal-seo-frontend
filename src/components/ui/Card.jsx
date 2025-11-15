'use client';

import React from 'react';

/**
 * Modern Card Component
 * Elevation: none, sm, md, lg
 * Hover effects and smooth transitions
 */
export default function Card({
 children,
 className = '',
 elevation = 'sm',
 hover = false,
 padding = 'md',
 ...props
}) {
 const elevations = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
 };
 
 const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
 };
 
 const hoverClass = hover ? 'hover-lift cursor-pointer' : '';
 
 return (
  <div
   className={`
    bg-white border border-gray-200
    ${elevations[elevation]}
    ${paddings[padding]}
    ${hoverClass}
    transition-all duration-200
    ${className}
   `}
   {...props}
  >
   {children}
  </div>
 );
}

