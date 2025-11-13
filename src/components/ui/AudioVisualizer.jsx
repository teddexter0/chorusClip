// src/components/ui/AudioVisualizer.jsx
'use client';

import React, { useEffect, useRef } from 'react';
import { Music } from 'lucide-react';

const AudioVisualizer = ({ isPlaying, currentTime, loopDuration, title }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth * 2; // Retina display
    const height = canvas.height = canvas.offsetHeight * 2;
    
    ctx.scale(2, 2);

    const bars = 64;
    const barWidth = (width / 2) / bars;
    let phase = 0;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, width / 2, height / 2);

      // Change the gradient colors in the animate function:

if (isPlaying) {
  // GREEN/SUCCESS colors when playing
  const gradient = ctx.createLinearGradient(0, height / 2 - barHeight, 0, height / 2);
  gradient.addColorStop(0, '#10b981'); // Green
  gradient.addColorStop(0.5, '#34d399'); // Light green
  gradient.addColorStop(1, '#6ee7b7'); // Mint
  
  // Add pulsing effect
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#10b981';
} else {
  // Purple when paused
  const gradient = ctx.createLinearGradient(0, height / 2 - barHeight, 0, height / 2);
  gradient.addColorStop(0, '#a855f7');
  gradient.addColorStop(1, '#ec4899');
  
  ctx.shadowBlur = 0;
}

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, currentTime, loopDuration]);

  return (
    <div className="w-full aspect-video bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900 rounded-2xl overflow-hidden border border-purple-700 relative">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
      
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-30 pointer-events-none">
        <Music size={48} className="text-purple-300 mb-4 animate-pulse" />
        <p className="text-xl font-bold text-white px-4 text-center drop-shadow-lg">
          {title || 'Audio Only Mode'}
        </p>
        <p className="text-purple-200 text-sm mt-2">
          {isPlaying ? '▶️ Playing' : '⏸️ Paused'}
        </p>
      </div>
    </div>
  );
};

export default AudioVisualizer;