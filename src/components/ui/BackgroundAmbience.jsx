'use client';
import React, { useEffect, useState } from 'react';

// Iconic official NFL performances, used muted as low-contrast ambience.
const BG_VIDEOS = [
  { id: 'c9cUytejf1k', start: 35, title: 'Coldplay, Beyoncé and Bruno Mars — Super Bowl 50' },
  { id: 'gdsUKphmB3Y', start: 25, title: 'Dr. Dre, Snoop Dogg, Eminem, Mary J. Blige, Kendrick Lamar and 50 Cent — Super Bowl LVI' }
];

const getEmbedUrl = ({ id, start }) => (
  `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&controls=0&disablekb=1&fs=0&loop=1&playlist=${id}&playsinline=1&rel=0&start=${start}`
);

const BackgroundAmbience = ({ theme = 'purple' }) => {
  const [currentIdx, setCurrentIdx] = useState(0);

  const gradientClass = theme === 'gold'
    ? 'bg-gradient-to-br from-yellow-950/94 via-amber-950/93 to-orange-950/95'
    : 'bg-gradient-to-br from-purple-950/94 via-indigo-950/93 to-purple-900/95';

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx(index => (index + 1) % BG_VIDEOS.length);
    }, 24000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-black">
      {BG_VIDEOS.map((video, index) => (
        <div
          key={`poster-${video.id}`}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${index === currentIdx ? 'opacity-100' : 'opacity-0'}`}
          style={{ backgroundImage: `url(https://i.ytimg.com/vi/${video.id}/maxresdefault.jpg)` }}
          aria-hidden="true"
        />
      ))}
      <iframe
        key={BG_VIDEOS[currentIdx].id}
        src={getEmbedUrl(BG_VIDEOS[currentIdx])}
        title={BG_VIDEOS[currentIdx].title}
        allow="autoplay; encrypted-media; picture-in-picture"
        tabIndex="-1"
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2 border-0"
        style={{ filter: 'brightness(0.42) saturate(1.25)', transform: 'translate(-50%, -50%) scale(1.03)' }}
      />

      {/* Gradient overlay — theme-aware */}
      <div className={`absolute inset-0 ${gradientClass}`} />

      {/* Animated blobs */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
      </div>
    </div>
  );
};

export default BackgroundAmbience;
