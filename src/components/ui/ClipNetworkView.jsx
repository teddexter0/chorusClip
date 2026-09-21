'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Edit3, Pause, Play, Sparkles } from 'lucide-react';

const normalize = (value) => String(value || '').trim().toLocaleLowerCase();

const relationship = (a, b) => {
  if (a.youtubeVideoId && a.youtubeVideoId === b.youtubeVideoId) return 'song';
  if (normalize(a.artist) && normalize(a.artist) === normalize(b.artist)) return 'artist';
  if (normalize(a.createdBy) && normalize(a.createdBy) === normalize(b.createdBy)) return 'creator';
  return null;
};

const palette = {
  song: 'rgba(52, 211, 153, 0.42)',
  artist: 'rgba(244, 114, 182, 0.34)',
  creator: 'rgba(250, 204, 21, 0.28)'
};

export default function ClipNetworkView({ clips, onPlay, onEdit }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const graphRef = useRef({ nodes: [], edges: [], width: 1, height: 1, dpr: 1 });
  const selectedIdRef = useRef(null);
  const hoveredIdRef = useRef(null);
  const [selectedId, setSelectedId] = useState(null);
  const [isDrifting, setIsDrifting] = useState(true);

  const graphClips = useMemo(() => clips.slice(0, 36), [clips]);
  const selectedClip = graphClips.find(clip => clip.id === selectedId) || null;

  useEffect(() => {
    if (selectedId && !graphClips.some(clip => clip.id === selectedId)) {
      setSelectedId(null);
      selectedIdRef.current = null;
    }
  }, [graphClips, selectedId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || graphClips.length === 0) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let animationFrame;
    let frame = 0;
    let disposed = false;

    const nodes = graphClips.map((clip, index) => {
      const angle = index * 2.399963;
      const radius = 32 + Math.sqrt(index + 1) * 26;
      return {
        clip,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        radius: Math.min(18, 8 + Math.sqrt((clip.plays || clip.playCount || 0) + 1) * 1.25)
      };
    });
    const edges = [];
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const kind = relationship(nodes[i].clip, nodes[j].clip);
        if (kind) edges.push({ source: nodes[i], target: nodes[j], kind });
        if (edges.length >= 120) break;
      }
      if (edges.length >= 120) break;
    }

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(280, rect.width);
      const height = Math.max(420, Math.min(620, width * 0.72));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.height = `${height}px`;
      graphRef.current = { nodes, edges, width, height, dpr };
    };

    const draw = () => {
      if (disposed) return;
      const { width, height, dpr } = graphRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;
      const activeId = hoveredIdRef.current || selectedIdRef.current;

      const haze = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(width, height) * 0.62);
      haze.addColorStop(0, 'rgba(126, 34, 206, 0.24)');
      haze.addColorStop(0.48, 'rgba(88, 28, 135, 0.10)');
      haze.addColorStop(1, 'rgba(2, 6, 23, 0)');
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < 42; i += 1) {
        const sx = (i * 83.71 + frame * 0.025 * ((i % 3) + 1)) % width;
        const sy = (i * 47.19) % height;
        ctx.fillStyle = `rgba(216, 180, 254, ${0.08 + (i % 4) * 0.035})`;
        ctx.fillRect(sx, sy, i % 7 === 0 ? 1.8 : 1, i % 7 === 0 ? 1.8 : 1);
      }

      edges.forEach((edge, edgeIndex) => {
        const relatedToActive = !activeId || edge.source.clip.id === activeId || edge.target.clip.id === activeId;
        ctx.beginPath();
        ctx.moveTo(cx + edge.source.x, cy + edge.source.y);
        ctx.lineTo(cx + edge.target.x, cy + edge.target.y);
        ctx.strokeStyle = relatedToActive ? palette[edge.kind] : 'rgba(148, 163, 184, 0.055)';
        ctx.lineWidth = relatedToActive ? 1.1 : 0.65;
        ctx.stroke();

        if (!reducedMotion && relatedToActive && edgeIndex % 3 === 0) {
          const t = ((frame * 0.006) + edgeIndex * 0.17) % 1;
          const px = cx + edge.source.x + (edge.target.x - edge.source.x) * t;
          const py = cy + edge.source.y + (edge.target.y - edge.source.y) * t;
          ctx.beginPath();
          ctx.arc(px, py, 1.8, 0, Math.PI * 2);
          ctx.fillStyle = palette[edge.kind];
          ctx.fill();
        }
      });

      nodes.forEach((node, index) => {
        const x = cx + node.x;
        const y = cy + node.y;
        const isActive = node.clip.id === activeId;
        const pulse = reducedMotion ? 0 : Math.sin(frame * 0.035 + index) * 1.4;
        const r = node.radius + (isActive ? 3 : 0) + pulse * 0.25;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2.8);
        glow.addColorStop(0, isActive ? 'rgba(250, 204, 21, 0.74)' : 'rgba(217, 70, 239, 0.58)');
        glow.addColorStop(0.35, isActive ? 'rgba(244, 114, 182, 0.36)' : 'rgba(147, 51, 234, 0.23)');
        glow.addColorStop(1, 'rgba(15, 23, 42, 0)');
        ctx.beginPath();
        ctx.arc(x, y, r * 2.8, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        const fill = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
        fill.addColorStop(0, isActive ? '#fde047' : '#c084fc');
        fill.addColorStop(1, isActive ? '#f472b6' : '#7c3aed');
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.lineWidth = isActive ? 2.4 : 1;
        ctx.strokeStyle = isActive ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.30)';
        ctx.stroke();

        if (isActive || node.radius >= 13) {
          const label = node.clip.title || 'Untitled clip';
          ctx.font = `${isActive ? 600 : 500} ${isActive ? 12 : 11}px system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillStyle = 'rgba(255,255,255,0.94)';
          ctx.shadowColor = 'rgba(0,0,0,0.95)';
          ctx.shadowBlur = 5;
          ctx.fillText(label.length > 22 ? `${label.slice(0, 21)}…` : label, x, y + r + 7);
          ctx.shadowBlur = 0;
        }
      });
    };

    const simulate = () => {
      const { width, height } = graphRef.current;
      const maxX = width * 0.43;
      const maxY = height * 0.39;
      nodes.forEach(node => {
        node.vx += -node.x * 0.00075;
        node.vy += -node.y * 0.00075;
      });
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = b.x - a.x || 0.01;
          const dy = b.y - a.y || 0.01;
          const distanceSq = Math.max(64, dx * dx + dy * dy);
          const force = 70 / distanceSq;
          a.vx -= dx * force;
          a.vy -= dy * force;
          b.vx += dx * force;
          b.vy += dy * force;
        }
      }
      edges.forEach(edge => {
        const dx = edge.target.x - edge.source.x;
        const dy = edge.target.y - edge.source.y;
        const distance = Math.max(1, Math.hypot(dx, dy));
        const desired = edge.kind === 'song' ? 64 : edge.kind === 'artist' ? 92 : 116;
        const force = (distance - desired) * 0.0007;
        edge.source.vx += dx * force;
        edge.source.vy += dy * force;
        edge.target.vx -= dx * force;
        edge.target.vy -= dy * force;
      });
      nodes.forEach(node => {
        node.vx *= 0.91;
        node.vy *= 0.91;
        node.x = Math.max(-maxX, Math.min(maxX, node.x + node.vx));
        node.y = Math.max(-maxY, Math.min(maxY, node.y + node.vy));
      });
    };

    const animate = () => {
      frame += 1;
      if (isDrifting && (!reducedMotion || frame < 180)) simulate();
      draw();
      animationFrame = window.requestAnimationFrame(animate);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(wrap);
    resize();
    animate();
    return () => {
      disposed = true;
      resizeObserver.disconnect();
      window.cancelAnimationFrame(animationFrame);
    };
  }, [graphClips, isDrifting]);

  const findNode = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const { nodes, width, height } = graphRef.current;
    const x = (event.clientX - rect.left) * (width / rect.width) - width / 2;
    const y = (event.clientY - rect.top) * (height / rect.height) - height / 2;
    return [...nodes].reverse().find(node => Math.hypot(node.x - x, node.y - y) <= node.radius + 12) || null;
  };

  const select = (id) => {
    selectedIdRef.current = id;
    setSelectedId(id);
  };

  const cycleSelection = (direction) => {
    if (graphClips.length === 0) return;
    const currentIndex = Math.max(0, graphClips.findIndex(clip => clip.id === selectedIdRef.current));
    const next = graphClips[(currentIndex + direction + graphClips.length) % graphClips.length];
    select(next.id);
  };

  return (
    <div ref={wrapRef} className="relative overflow-hidden rounded-3xl border border-purple-500/40 bg-slate-950/75 shadow-[inset_0_0_70px_rgba(126,34,206,0.24)]">
      <div className="absolute left-3 right-3 top-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
        <div className="rounded-full border border-purple-400/30 bg-black/55 px-3 py-1.5 text-[11px] font-bold text-purple-200 backdrop-blur-md">
          {graphClips.length} clips · links = song, artist or creator
        </div>
        <button
          type="button"
          onClick={() => setIsDrifting(value => !value)}
          className="pointer-events-auto min-h-9 rounded-full border border-purple-400/30 bg-black/55 px-3 text-xs font-bold text-purple-200 backdrop-blur-md hover:bg-purple-900/70"
          aria-pressed={isDrifting}
        >
          {isDrifting ? <><Pause size={12} className="inline mr-1" /> Settle</> : <><Sparkles size={12} className="inline mr-1" /> Drift</>}
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className="block w-full touch-manipulation"
        role="img"
        tabIndex={0}
        aria-label="Interactive clip relationship map. Use left and right arrow keys to select clips."
        onPointerMove={(event) => { hoveredIdRef.current = findNode(event)?.clip.id || null; }}
        onPointerLeave={() => { hoveredIdRef.current = null; }}
        onPointerUp={(event) => {
          const node = findNode(event);
          if (node) select(node.clip.id);
        }}
        onDoubleClick={(event) => {
          const node = findNode(event);
          if (node) onEdit(node.clip);
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); cycleSelection(1); }
          if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); cycleSelection(-1); }
          if (event.key === 'Enter' && selectedClip) onPlay(selectedClip);
        }}
      />
      {selectedClip ? (
        <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-col gap-3 rounded-2xl border border-purple-400/35 bg-black/80 p-3 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-white">{selectedClip.title}</p>
            <p className="truncate text-xs text-purple-300">{selectedClip.artist || 'Unknown artist'} · @{selectedClip.createdBy || 'community'}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => onPlay(selectedClip)} className="min-h-10 flex-1 rounded-xl bg-white px-4 text-xs font-black text-black sm:flex-none">
              <Play size={14} className="inline mr-1" fill="currentColor" /> Play
            </button>
            <button type="button" onClick={() => onEdit(selectedClip)} className="min-h-10 flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 text-xs font-black text-white sm:flex-none">
              <Edit3 size={14} className="inline mr-1" /> Edit in Studio
            </button>
          </div>
        </div>
      ) : (
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-purple-200 backdrop-blur-md whitespace-nowrap">
          Tap a node · double-tap to edit
        </p>
      )}
    </div>
  );
}
