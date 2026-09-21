'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';

// The three requested performance moments. Keep this list intentionally fixed:
// this ambience is not a generic music-video rotation.
// Only the visible player is mounted: browsers commonly throttle or reject two
// simultaneous background autoplay requests, which left the old crossfade stuck
// on poster images on both mobile and desktop.
const BG_VIDEOS = [
  { id: 'c9cUytejf1k', start: 476, end: 488, title: 'Coldplay, Beyoncé & Bruno Mars — Super Bowl 50' },
  { id: 'gdsUKphmB3Y', start: 195, end: 207, title: 'Dr. Dre, Snoop Dogg & 50 Cent — Super Bowl LVI' },
  { id: 'HJH-uSiOekk', start: 35, end: 47, title: 'The Rock — WrestleMania 32 flamethrower entrance' }
];

const getEmbedUrl = ({ id, start, end }, origin) => (
  `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&controls=0&disablekb=1&enablejsapi=1&fs=0&loop=1&playlist=${id}&playsinline=1&rel=0&start=${start}&end=${end}&origin=${encodeURIComponent(origin)}`
);

const BackgroundAmbience = ({ theme = 'purple' }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [origin, setOrigin] = useState('');
  const iframeRef = useRef(null);

  const sendPlayerCommand = useCallback((func) => {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify({
      event: 'command',
      func,
      args: []
    }), 'https://www.youtube-nocookie.com');
  }, []);

  const playBackgroundVideo = useCallback(() => {
    sendPlayerCommand('mute');
    sendPlayerCommand('playVideo');
  }, [sendPlayerCommand]);

  const gradientClass = theme === 'gold'
    ? 'bg-gradient-to-br from-yellow-950/82 via-amber-950/76 to-orange-950/84'
    : 'bg-gradient-to-br from-purple-950/82 via-indigo-950/76 to-purple-900/84';

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx(index => (index + 1) % BG_VIDEOS.length);
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  // Browser autoplay policies often ignore a URL-only autoplay request. Explicit
  // muted player commands, retried as the embed becomes ready, are more reliable.
  useEffect(() => {
    const attempts = [150, 500, 1200, 2400].map(delay => setTimeout(playBackgroundVideo, delay));
    return () => attempts.forEach(clearTimeout);
  }, [currentIdx, playBackgroundVideo]);

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
      {origin && (() => {
        const video = BG_VIDEOS[currentIdx];
        return (
        <iframe
          ref={iframeRef}
          key={`${video.id}-${currentIdx}`}
          src={getEmbedUrl(video, origin)}
          title={video.title}
          allow="autoplay; encrypted-media; picture-in-picture"
          tabIndex="-1"
          aria-hidden="true"
          onLoad={playBackgroundVideo}
          className="absolute left-1/2 top-1/2 h-full min-h-[100svh] w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2 border-0 opacity-100 md:h-[56.25vw] md:min-h-full md:w-full md:min-w-[177.78vh]"
          style={{ filter: 'brightness(0.62) saturate(1.2)', transform: 'translate(-50%, -50%) scale(1.04)' }}
        />
        );
      })()}

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
