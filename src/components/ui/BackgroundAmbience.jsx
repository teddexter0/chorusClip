'use client';
import React, { useEffect, useRef, useState } from 'react';

// Free-to-use performance/karaoke/music videos from Pixabay (no attribution required)
// Looped in 5s cycles, muted, not romantic, faces + energy visible
const BG_VIDEOS = [
  'https://cdn.pixabay.com/video/2016/01/12/1892-151989763_large.mp4',   // concert crowd
  'https://cdn.pixabay.com/video/2022/10/28/136416-763927380_large.mp4', // DJ + lights
  'https://cdn.pixabay.com/video/2019/09/05/26763-358609115_large.mp4',  // party/dance
  'https://cdn.pixabay.com/video/2021/03/15/68247-523835756_large.mp4',  // music festival
];

const BackgroundAmbience = ({ theme = 'purple' }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const videoRef = useRef(null);

  // Cycle videos every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIdx(i => (i + 1) % BG_VIDEOS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [currentIdx]);

  const gradientClass = theme === 'gold'
    ? 'bg-gradient-to-br from-yellow-900/90 via-amber-900/85 to-orange-900/90'
    : 'bg-gradient-to-br from-purple-900/90 via-indigo-900/85 to-purple-800/90';

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <video
        ref={videoRef}
        key={currentIdx}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: 'brightness(0.35) saturate(1.2)', transform: 'scale(1.05)' }}
      >
        <source src={BG_VIDEOS[currentIdx]} type="video/mp4" />
      </video>

      {/* Theme gradient overlay */}
      <div className={`absolute inset-0 ${gradientClass}`} />

      {/* Subtle animated blobs on top */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
        <div className="absolute top-40 right-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
      </div>
    </div>
  );
};

export default BackgroundAmbience;