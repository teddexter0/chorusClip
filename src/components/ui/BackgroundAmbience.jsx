// src/components/ui/BackgroundAmbience.jsx
'use client';

import React, { useEffect, useRef } from 'react';

const BackgroundAmbience = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    // Force play on mount
    if (videoRef.current) {
      videoRef.current.play().catch(e => console.log('Autoplay blocked'));
    }
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Video background */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          filter: 'blur(10px) brightness(0.25)',
          transform: 'scale(1.2)',
          opacity: 0.08
        }}
      >
        <source src="https://cdn.coverr.co/videos/coverr-concert-crowd-dancing-4803/1080p.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/95 via-indigo-900/92 to-purple-800/95" />

      {/* Animated blobs */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-40 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>
    </div>
  );
};

export default BackgroundAmbience;