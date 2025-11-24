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
    const width = canvas.width = canvas.offsetWidth * 2;
    const height = canvas.height = canvas.offsetHeight * 2;
    
    ctx.scale(2, 2);

    const bars = 64;
    const barWidth = (width / 2) / bars;
    let phase = 0;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, width / 2, height / 2);

      if (isPlaying) {
        phase += 0.05;

        for (let i = 0; i < bars; i++) {
          const heightMultiplier = Math.sin(i * 0.1 + phase) * 0.5 + 0.5;
          const progress = (currentTime % loopDuration) / loopDuration;
          const barHeight = (height / 4) * heightMultiplier * (0.3 + progress * 0.7);
          
          // CRITICAL FIX - Skip invalid bars
          if (!barHeight || isNaN(barHeight) || barHeight < 0) continue;

          // GREEN/SUCCESS colors when playing
          const gradient = ctx.createLinearGradient(0, height / 2 - barHeight, 0, height / 2);
          gradient.addColorStop(0, '#10b981');
          gradient.addColorStop(0.5, '#34d399');
          gradient.addColorStop(1, '#6ee7b7');

          ctx.fillStyle = gradient;
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#10b981';
          
          ctx.fillRect(
            i * barWidth,
            height / 2 - barHeight,
            barWidth - 2,
            barHeight
          );
        }
      } else {
        // Purple when paused - STATIC bars
        ctx.shadowBlur = 0;
        for (let i = 0; i < bars; i++) {
          const barHeight = 20;
          const gradient = ctx.createLinearGradient(0, height / 2 - barHeight, 0, height / 2);
          gradient.addColorStop(0, '#a855f7');
          gradient.addColorStop(1, '#ec4899');
          
          ctx.fillStyle = gradient;
          ctx.fillRect(
            i * barWidth,
            height / 2 - barHeight / 2,
            barWidth - 2,
            barHeight
          );
        }
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
        <Music size={48} className="text-green-300 mb-4 animate-pulse" />
        <p className="text-xl font-bold text-white px-4 text-center drop-shadow-lg">
          {title || 'Audio Only Mode'}
        </p>
        <p className="text-green-200 text-sm mt-2">
          {isPlaying ? '▶️ Playing' : '⏸️ Paused'}
        </p>
      </div>
    </div>
  );
};

export default AudioVisualizer;