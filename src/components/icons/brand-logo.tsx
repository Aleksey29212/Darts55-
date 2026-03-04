'use client';

import { cn } from "@/lib/utils";

/**
 * Unique Brand Logo for DartBrig Pro
 * Stylized shield with a precision dart and professional gradients.
 */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={cn("w-8 h-8 drop-shadow-xl", className)}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="brand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--accent))" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Background Shield Shape */}
      <path 
        d="M50 5 L85 20 V65 C85 80 50 95 50 95 C50 95 15 80 15 65 V20 L50 5Z" 
        fill="#0a0a0a" 
        stroke="url(#brand-grad)" 
        strokeWidth="3"
      />
      
      {/* Stylized 'D' / Board Segment */}
      <path 
        d="M40 30 C40 30 65 30 65 50 C65 70 40 70 40 70" 
        stroke="url(#brand-grad)" 
        strokeWidth="6" 
        strokeLinecap="round"
        filter="url(#glow)"
      />
      
      {/* Dart crossing through */}
      <g transform="translate(50,50) rotate(-45)">
        {/* Shaft */}
        <rect x="-1.5" y="-25" width="3" height="50" fill="#fff" rx="1" />
        {/* Tip */}
        <path d="M0 35 L-5 20 L5 20 Z" fill="#fff" />
        {/* Flights */}
        <path d="M-7 -25 L0 -10 L7 -25 L0 -20 Z" fill="hsl(var(--primary))" />
      </g>
      
      {/* Target Center Point */}
      <circle cx="50" cy="50" r="3" fill="#fff" className="animate-pulse" />
    </svg>
  );
}
