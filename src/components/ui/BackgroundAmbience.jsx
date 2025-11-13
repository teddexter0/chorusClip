// src/components/ui/BackgroundAmbience.jsx
'use client';

import React, { useState, useEffect } from 'react';

const BackgroundAmbience = () => {
  const [currentVideo, setCurrentVideo] = useState(0);

  // Curated collection of diverse, fun music party vibes from Pexels Videos (free stock)
const videos = [
  'https://www.pexels.com/video/time-lapse-of-traffic-in-the-city-26690703/', // Party lights
  'https://www.pexels.com/video/man-performing-in-a-concert-7722221/', // Concert vibes
  'https://www.pexels.com/video/people-lights-dark-jumping-3792293/', // Dancing
  'https://pixabay.com/videos/console-feast-night-fun-dj-music-4318/', // Energy
  'https://pixabay.com/videos/party-crowd-dancers-dance-lights-236098/', // Lights
];

  useEffect(() => {
    // Rotate videos every 30 seconds
    const interval = setInterval(() => {
      setCurrentVideo((prev) => (prev + 1) % videos.length);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Video background */}
      <video
        key={currentVideo}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-10 blur-sm"
        style={{
          filter: 'blur(8px) brightness(0.6)',
        }}
      >
        <source src={videos[currentVideo]} type="video/mp4" />
      </video>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/90 via-indigo-900/85 to-purple-800/90" />

      {/* Animated blobs (existing ones remain) */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-40 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>
    </div>
  );
};

export default BackgroundAmbience;