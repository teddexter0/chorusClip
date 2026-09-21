'use client';

import React, { useMemo, useState } from 'react';
import { Edit3, Minus, Play, Plus } from 'lucide-react';

const COLORS = ['#a78bfa', '#67e8f9', '#f9a8d4', '#fde047', '#86efac', '#fdba74', '#93c5fd'];
const MAP_WIDTH = 1080;

const compact = (value, limit = 28) => {
  const text = String(value || '').trim();
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
};

const groupClips = (clips) => {
  const groups = new Map();
  clips.slice(0, 36).forEach(clip => {
    const label = clip.artist?.trim() || 'Unknown artist';
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(clip);
  });
  return [...groups.entries()]
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .slice(0, 8)
    .map(([artist, artistClips], index) => ({
      artist,
      clips: artistClips.slice(0, 5),
      color: COLORS[index % COLORS.length]
    }));
};

export default function ClipNetworkView({ clips, onPlay, onEdit }) {
  const groups = useMemo(() => groupClips(clips), [clips]);
  const [selectedClip, setSelectedClip] = useState(null);
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [zoom, setZoom] = useState(1);

  const rows = groups.reduce((total, group) => total + (collapsed.has(group.artist) ? 1 : Math.max(1, group.clips.length)), 0);
  const mapHeight = Math.max(430, rows * 76 + 90);
  let rowCursor = 0;
  const positioned = groups.map(group => {
    const isCollapsed = collapsed.has(group.artist);
    const span = isCollapsed ? 1 : Math.max(1, group.clips.length);
    const firstY = 66 + rowCursor * 76;
    const lastY = 66 + (rowCursor + span - 1) * 76;
    const groupY = (firstY + lastY) / 2;
    const children = isCollapsed ? [] : group.clips.map((clip, index) => ({ clip, y: firstY + index * 76 }));
    rowCursor += span;
    return { ...group, groupY, children, isCollapsed };
  });

  const rootY = positioned.length
    ? (positioned[0].groupY + positioned[positioned.length - 1].groupY) / 2
    : mapHeight / 2;

  const toggleGroup = artist => {
    setCollapsed(previous => {
      const next = new Set(previous);
      if (next.has(artist)) next.delete(artist);
      else next.add(artist);
      return next;
    });
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-purple-500/40 bg-[#11151b]/95 shadow-[inset_0_0_80px_rgba(76,29,149,0.22)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-sm font-black text-white">Clip mind map</p>
          <p className="text-[11px] text-purple-300">Artists branch into clips · tap a branch to fold it</p>
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-black/45 p-1">
          <button type="button" onClick={() => setZoom(value => Math.max(0.75, value - 0.125))} className="flex h-9 w-9 items-center justify-center rounded-lg text-purple-200 hover:bg-white/10" aria-label="Zoom out"><Minus size={15} /></button>
          <span className="w-12 text-center text-[11px] font-bold text-purple-300">{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => setZoom(value => Math.min(1.35, value + 0.125))} className="flex h-9 w-9 items-center justify-center rounded-lg text-purple-200 hover:bg-white/10" aria-label="Zoom in"><Plus size={15} /></button>
        </div>
      </div>

      <div className="overflow-auto overscroll-contain [scrollbar-color:#7e22ce_transparent]" style={{ maxHeight: 'min(68vh, 680px)' }}>
        <svg
          viewBox={`0 0 ${MAP_WIDTH} ${mapHeight}`}
          width={MAP_WIDTH * zoom}
          height={mapHeight * zoom}
          className="block min-w-[810px] select-none"
          role="img"
          aria-label="Mind map of public clips grouped by artist. Swipe horizontally on a phone to explore."
        >
          <defs>
            <filter id="node-shadow" x="-20%" y="-30%" width="140%" height="160%">
              <feDropShadow dx="0" dy="5" stdDeviation="7" floodColor="#000" floodOpacity="0.35" />
            </filter>
          </defs>
          <rect width={MAP_WIDTH} height={mapHeight} fill="#11151b" />
          <circle cx="235" cy={rootY} r="190" fill="rgba(109,40,217,0.08)" />

          {positioned.map(group => (
            <g key={`lines-${group.artist}`}>
              <path d={`M 275 ${rootY} C 335 ${rootY}, 330 ${group.groupY}, 408 ${group.groupY}`} fill="none" stroke={group.color} strokeWidth="4" strokeLinecap="round" opacity="0.82" />
              {group.children.map(child => (
                <path key={child.clip.id} d={`M 610 ${group.groupY} C 670 ${group.groupY}, 660 ${child.y}, 728 ${child.y}`} fill="none" stroke={group.color} strokeWidth="2.25" strokeLinecap="round" opacity="0.72" />
              ))}
            </g>
          ))}

          <g filter="url(#node-shadow)">
            <rect x="62" y={rootY - 44} width="218" height="88" rx="14" fill="#5b5f78" stroke="#8b5cf6" strokeWidth="1.5" />
            <text x="171" y={rootY - 7} textAnchor="middle" fill="white" fontSize="18" fontWeight="800">CHORUSCLIP</text>
            <text x="171" y={rootY + 19} textAnchor="middle" fill="#ddd6fe" fontSize="13">{clips.length} connected clips</text>
          </g>

          {positioned.map(group => (
            <g key={group.artist}>
              <g role="button" tabIndex="0" aria-label={`${group.artist}, ${group.clips.length} clips. ${group.isCollapsed ? 'Expand' : 'Collapse'} branch.`} onClick={() => toggleGroup(group.artist)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') toggleGroup(group.artist); }} className="cursor-pointer">
                <rect x="406" y={group.groupY - 28} width="210" height="56" rx="10" fill="#374151" stroke={group.color} strokeWidth="1.5" filter="url(#node-shadow)" />
                <text x="424" y={group.groupY - 3} fill="white" fontSize="14" fontWeight="700">{compact(group.artist, 23)}</text>
                <text x="424" y={group.groupY + 17} fill={group.color} fontSize="11">{group.clips.length} clip{group.clips.length === 1 ? '' : 's'}</text>
                <circle cx="598" cy={group.groupY} r="11" fill={group.color} opacity="0.92" />
                <text x="598" y={group.groupY + 4} textAnchor="middle" fill="#11151b" fontSize="15" fontWeight="900">{group.isCollapsed ? '+' : '−'}</text>
              </g>

              {group.children.map(child => {
                const isSelected = selectedClip?.id === child.clip.id;
                return (
                  <g key={child.clip.id} role="button" tabIndex="0" aria-label={`Select ${child.clip.title}`} onClick={() => setSelectedClip(child.clip)} onDoubleClick={() => onEdit(child.clip)} onKeyDown={event => { if (event.key === 'Enter') setSelectedClip(child.clip); }} className="cursor-pointer">
                    <rect x="726" y={child.y - 27} width="300" height="54" rx="10" fill={isSelected ? '#4c1d95' : '#343b45'} stroke={isSelected ? '#fef08a' : group.color} strokeWidth={isSelected ? 2.5 : 1} filter="url(#node-shadow)" />
                    <text x="744" y={child.y - 3} fill="white" fontSize="13" fontWeight="700">{compact(child.clip.title || 'Untitled clip', 34)}</text>
                    <text x="744" y={child.y + 17} fill="#c4b5fd" fontSize="10.5">@{compact(child.clip.createdBy || 'community', 20)} · {child.clip.plays || child.clip.playCount || 0} plays</text>
                    <text x="1008" y={child.y + 5} textAnchor="middle" fill={group.color} fontSize="17">›</text>
                  </g>
                );
              })}
            </g>
          ))}
        </svg>
      </div>

      <p className="border-t border-white/10 px-4 py-2 text-center text-[11px] text-purple-400 md:hidden">Swipe sideways to explore the map</p>
      {selectedClip && (
        <div className="flex flex-col gap-3 border-t border-purple-400/25 bg-black/70 p-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-white">{selectedClip.title}</p>
            <p className="truncate text-xs text-purple-300">{selectedClip.artist || 'Unknown artist'} · @{selectedClip.createdBy || 'community'}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => onPlay(selectedClip)} className="min-h-10 flex-1 rounded-xl bg-white px-4 text-xs font-black text-black sm:flex-none"><Play size={14} className="mr-1 inline" fill="currentColor" /> Play</button>
            <button type="button" onClick={() => onEdit(selectedClip)} className="min-h-10 flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 text-xs font-black text-white sm:flex-none"><Edit3 size={14} className="mr-1 inline" /> Edit</button>
          </div>
        </div>
      )}
    </div>
  );
}
