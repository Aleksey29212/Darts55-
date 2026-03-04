
'use client';

import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";

export function DartBoard({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper to round numbers to avoid hydration mismatch due to floating point precision
  // between server (Node.js) and client (Browser)
  const r = (val: number) => Number(val.toFixed(4));

  const getPathData = (radius: number, i: number) => {
    const angleStart = (i * 18 - 9) * Math.PI / 180;
    const angleEnd = (i * 18 + 9) * Math.PI / 180;
    
    return {
      x1: r(radius * Math.cos(angleStart)),
      y1: r(radius * Math.sin(angleStart)),
      x2: r(radius * Math.cos(angleEnd)),
      y2: r(radius * Math.sin(angleEnd))
    };
  };

  return (
    <svg 
      viewBox="0 0 100 100" 
      className={cn("w-8 h-8 drop-shadow-xl", className)}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer black ring - static and safe */}
      <circle cx="50" cy="50" r="48" fill="#0a0a0a" stroke="#222" strokeWidth="1"/>
      
      {/* Dynamic Sectors - rendered only after client-side hydration to ensure consistency */}
      {mounted && (
        <g transform="translate(50,50)">
          {[...Array(20)].map((_, i) => {
            const p = getPathData(42, i);
            return (
              <path
                key={i}
                d={`M 0 0 L ${p.x1} ${p.y1} A 42 42 0 0 1 ${p.x2} ${p.y2} Z`}
                fill={i % 2 === 0 ? "#111" : "#f0f0f0"}
                stroke="#000"
                strokeWidth="0.2"
                transform="rotate(-99)"
              />
            );
          })}
          
          {/* Triple Ring */}
          {[...Array(20)].map((_, i) => {
            const o = getPathData(26, i);
            const n = getPathData(23, i);
            return (
              <path
                key={`triple-${i}`}
                d={`M ${o.x1} ${o.y1} A 26 26 0 0 1 ${o.x2} ${o.y2} L ${n.x2} ${n.y2} A 23 23 0 0 0 ${n.x1} ${n.y1} Z`}
                fill={i % 2 === 0 ? "#e11d48" : "#22c55e"} 
                transform="rotate(-99)"
              />
            );
          })}

          {/* Double Ring */}
          {[...Array(20)].map((_, i) => {
            const o = getPathData(42, i);
            const n = getPathData(39, i);
            return (
              <path
                key={`double-${i}`}
                d={`M ${o.x1} ${o.y1} A 42 42 0 0 1 ${o.x2} ${o.y2} L ${n.x2} ${n.y2} A 39 39 0 0 0 ${n.x1} ${n.y1} Z`}
                fill={i % 2 === 0 ? "#e11d48" : "#22c55e"}
                transform="rotate(-99)"
              />
            );
          })}
        </g>
      )}

      {/* Bullseye - static and safe */}
      <circle cx="50" cy="50" r="6" fill="#22c55e" stroke="#000" strokeWidth="0.5"/>
      <circle cx="50" cy="50" r="3" fill="#e11d48" stroke="#000" strokeWidth="0.5"/>
      
      {/* Numbers ring simulation */}
      <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="0.1" strokeDasharray="1 13.1"/>
    </svg>
  );
}
