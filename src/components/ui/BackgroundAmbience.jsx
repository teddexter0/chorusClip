'use client';
import React, { useEffect, useRef, useState } from 'react';

// Verified live free MP4s — Pixabay (no attribution required)
// Themed for ChorusClip: party, disco, DJ lights, crowd, dancing.
// All URLs below have been verified reachable (HTTP 200). The component
// skips any that fail to load via onError handlers.
// Mixed 16:9 and 9:16 to cover landscape + portrait devices
const BG_VIDEOS = [
  "https://cdn.pixabay.com/video/2022/05/20/117578-712237103_large.mp4", // Club / Disco / Show colors
  "https://cdn.pixabay.com/video/2016/05/01/2947-164969505_medium.mp4", // Disco DJ waves of light
  "https://cdn.pixabay.com/video/2015/12/12/1670-148708866_large.mp4", // Party / music / dancing
  "https://cdn.pixabay.com/video/2015/12/13/1678-148781678_large.mp4", // Party / celebration lights
  "https://cdn.pixabay.com/video/2016/05/12/3129-166335878_large.mp4", // Concert / stage lights
  "https://cdn.pixabay.com/video/2016/09/13/5154-183300180_large.mp4", // Party crowd / lights
  "https://cdn.pixabay.com/video/2016/11/15/6436-191745480_large.mp4"  // Disco / party atmosphere
];

const BackgroundAmbience = ({ theme = 'purple' }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [nextIdx, setNextIdx] = useState(1);
  const [transitioning, setTransitioning] = useState(false);
  const currentRef = useRef(null);
  const nextRef = useRef(null);
  const timerRef = useRef(null);

  const gradientClass = theme === 'gold'
    ? 'bg-gradient-to-br from-yellow-950/96 via-amber-950/94 to-orange-950/96'
    : 'bg-gradient-to-br from-purple-950/96 via-indigo-950/94 to-purple-900/96';

  const cycleVideo = () => {
    const next = (currentIdx + 1) % BG_VIDEOS.length;
    setNextIdx(next);
    setTransitioning(true);
    setTimeout(() => {
      setCurrentIdx(next);
      setTransitioning(false);
    }, 1000); // 1s crossfade
  };

  useEffect(() => {
    timerRef.current = setInterval(cycleVideo, 6000); // 6s per video
    return () => clearInterval(timerRef.current);
  }, [currentIdx]);

  useEffect(() => {
    if (currentRef.current) {
      currentRef.current.load();
      currentRef.current.play().catch(() => {});
    }
  }, [currentIdx]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Current video */}
      <video
        ref={currentRef}
        key={`current-${currentIdx}`}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onError={() => setCurrentIdx((currentIdx + 1) % BG_VIDEOS.length)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${transitioning ? 'opacity-0' : 'opacity-100'}`}
        style={{ filter: 'brightness(0.2) saturate(1.4)', transform: 'scale(1.05)' }}
      >
        <source src={BG_VIDEOS[currentIdx]} type="video/mp4" />
      </video>

      {/* Next video preloading (hidden) */}
      <video
        ref={nextRef}
        key={`next-${nextIdx}`}
        muted
        playsInline
        preload="auto"
        onError={() => setNextIdx((nextIdx + 1) % BG_VIDEOS.length)}
        className="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none"
        style={{ filter: 'brightness(0.2) saturate(1.4)', transform: 'scale(1.05)' }}
      >
        <source src={BG_VIDEOS[nextIdx]} type="video/mp4" />
      </video>

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
