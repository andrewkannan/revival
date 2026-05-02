'use client';

import React from 'react';

export default function CrossBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden flex flex-col justify-end">
      {/* Subtle Glow Behind Crosses */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-poster-accent/10 blur-[100px] rounded-full mix-blend-screen"></div>
      
      {/* SVG Silhouette */}
      <svg 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-auto min-w-[1200px] opacity-[0.15] mix-blend-plus-lighter" 
        viewBox="0 0 1440 600" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMax slice"
      >
        {/* Distant Hills */}
        <path d="M0,600 L0,500 Q360,450 720,480 T1440,400 L1440,600 Z" fill="#8caeb0" opacity="0.3" />
        <path d="M0,600 L0,550 Q400,480 800,520 T1440,450 L1440,600 Z" fill="#8caeb0" opacity="0.5" />
        
        {/* Main Hill / Ground */}
        <path d="M0,600 L0,580 Q360,500 720,530 T1440,480 L1440,600 Z" fill="#8caeb0" opacity="0.8" />
        
        {/* Main Cross (Center) */}
        <rect x="714" y="320" width="12" height="210" rx="2" fill="#8caeb0" />
        <rect x="680" y="370" width="80" height="12" rx="2" fill="#8caeb0" />

        {/* Small Cross (Left) */}
        <rect x="626" y="420" width="8" height="110" rx="1" fill="#8caeb0" opacity="0.8" />
        <rect x="605" y="450" width="50" height="8" rx="1" fill="#8caeb0" opacity="0.8" />

        {/* Small Cross (Right) */}
        <rect x="806" y="400" width="8" height="130" rx="1" fill="#8caeb0" opacity="0.8" />
        <rect x="785" y="430" width="50" height="8" rx="1" fill="#8caeb0" opacity="0.8" />
      </svg>
      
      {/* Bottom Gradient Fade to perfectly blend into the black/dark bg */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#0a0f10] via-black/50 to-transparent"></div>
    </div>
  );
}
