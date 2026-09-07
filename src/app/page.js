'use client';

import Image from 'next/image';
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Share2, Heart, Plus, X, AlertCircle, Video, Sparkles, LogOut, Users, Music, ChevronDown, ChevronUp, UserPlus, Bell, Search, Loader2, Edit3 } from 'lucide-react';

// Use relative imports instead of @/
import Notification from '../components/ui/Notifications';
import AuthModal from '../components/ui/AuthModal';
import TutorialModal from '../components/ui/TutorialModal';
import { useAuth } from '../hooks/useAuth';
import BackgroundAmbience from '../components/ui/BackgroundAmbience';

import AudioVisualizer from '../components/ui/AudioVisualizer';
import FriendsPanel from '../components/ui/FriendsPanel';
import { PlaylistPlayer, getUserPlaylists, createPlaylist, getAllPublicPlaylists, ENDLESS_CAP_IN_PLAYLIST } from '../utils/playlistUtils';
import { getArtistImageWithCache } from '../utils/spotifyUtils';
import { SkipForward, SkipBack, Shuffle, Repeat } from 'lucide-react';


export default function ChorusClipModern() { 
  // Use auth hook instead of local state
  const { user, setUser, checkAuthState } = useAuth();

  // Playlist states 
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(0); 
const [playlists, setPlaylists] = useState([]);
const [selectedClipsForPlaylist, setSelectedClipsForPlaylist] = useState([]);
const [showPlaylistModal, setShowPlaylistModal] = useState(false);
const [currentPlaylistPlayer, setCurrentPlaylistPlayer] = useState(null);
const [isPlayingPlaylist, setIsPlayingPlaylist] = useState(false);
const [currentPlaylistInfo, setCurrentPlaylistInfo] = useState(null);
const [playlistMode, setPlaylistMode] = useState('default'); // 'default' | 'once'
const [managingPlaylist, setManagingPlaylist] = useState(null); // playlist open in mgmt modal
const [artistImages, setArtistImages] = useState({});
const [publicPlaylists, setPublicPlaylists] = useState([]);
const [queueBannerCollapsed, setQueueBannerCollapsed] = useState(false);
const [expandedPlaylistId, setExpandedPlaylistId] = useState(null);
const [themeMode, setThemeMode] = useState('electric');
const [pendingAction, setPendingAction] = useState(null);
const [clipSearchQuery, setClipSearchQuery] = useState('');
const [playlistSearchQuery, setPlaylistSearchQuery] = useState('');
const [queueEditMode, setQueueEditMode] = useState(false);
const [globalLoading, setGlobalLoading] = useState(false);
const [stagedClipsEditMode, setStagedClipsEditMode] = useState(false);
const [myClips, setMyClips] = useState([]);
const [privateClipsLimit, setPrivateClipsLimit] = useState(10);
const [queueDrawerOpen, setQueueDrawerOpen] = useState(false);
const [draggedQueueIdx, setDraggedQueueIdx] = useState(null);
const [clipsViewMode, setClipsViewMode] = useState('grid'); // 'grid' | 'list'

  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoId, setVideoId] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDuration, setVideoDuration] = useState(600); // actual duration from YT player (seconds)
  const [artist, setArtist] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  // initial loop state — each loop has its own loopCount (0 = infinite)
  const [loops, setLoops] = useState([{ start: 0, end: 30, loopCount: 1 }]);
  const [currentLoopIndex, setCurrentLoopIndex] = useState(0);
  const [currentLoopIteration, setCurrentLoopIteration] = useState(0);
  // isReadOnlyMode: true when playing a clip from the feed (no editing allowed)
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(false);
  const [playerCurrentTime, setPlayerCurrentTime] = useState(0);
  
  const [showTutorial, setShowTutorial] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMostReplayedSuggestion, setShowMostReplayedSuggestion] = useState(false);
  const [suggestedStart, setSuggestedStart] = useState(0);
  const [suggestedEnd, setSuggestedEnd] = useState(30);

  const [notification, setNotification] = useState(null);
const [leaderboard, setLeaderboard] = useState([]);
const [leaderboardSort, setLeaderboardSort] = useState('clips');
const [clips, setClips] = useState([]);
const [feedCursor, setFeedCursor] = useState(null);
const [feedHasMore, setFeedHasMore] = useState(true);
const [feedLoading, setFeedLoading] = useState(false);
const [discoveryLoading, setDiscoveryLoading] = useState(true);
const [trendingByPlays, setTrendingByPlays] = useState([]);
const [topArtists, setTopArtists] = useState([]);

// Accordion open states for discovery sections
const [feedExpanded, setFeedExpanded] = useState(false);
const [feedPage, setFeedPage] = useState(1);
const FEED_PAGE_SIZE = 15;
const [feedSort, setFeedSort] = useState('latest');
const [leaderboardExpanded, setLeaderboardExpanded] = useState(false);
const [artistsExpanded, setArtistsExpanded] = useState(false);

// Friends panel
const [showFriendsPanel, setShowFriendsPanel] = useState(false);

// Playlist queue (up to 5 playlists queued to play consecutively)
const [playlistQueue, setPlaylistQueue] = useState([]);
const [playlistQueueIndex, setPlaylistQueueIndex] = useState(0);
const [isPlayingQueue, setIsPlayingQueue] = useState(false);
const [standaloneLoop, setStandaloneLoop] = useState(false);
const [mobileTab, setMobileTab] = useState('create'); // 'create' | 'feed' | 'library' | 'more'
const [expandedSections, setExpandedSections] = useState([0]); // section 0 always open
const playlistQueueRef = useRef([]);
const playlistQueueIndexRef = useRef(0);

const formatSeconds = (seconds) => {
  const safe = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getCreatedAtValue = (value) => {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  return 0;
};

const formatCreatedDate = (value) => {
  const timestamp = getCreatedAtValue(value);
  if (!timestamp) return 'date unknown';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(timestamp));
};

const getClipPlayCount = (clip) => clip?.plays ?? clip?.playCount ?? 0;

const getLoopVideoId = (loop, fallbackVideoId) => loop?.youtubeVideoId || fallbackVideoId;

const getLoopTitle = (loop, fallbackTitle) => loop?.title || fallbackTitle;

const getLoopArtist = (loop, fallbackArtist) => loop?.artist || fallbackArtist;

const getClipRuntime = (clip) => {
  const clipLoops = clip?.loops || [{ start: clip?.startTime || 0, end: clip?.endTime || 30, loopCount: 1 }];
  return clipLoops.reduce((total, loop) => {
    const loopLength = Math.max(0, (loop.end ?? 0) - (loop.start ?? 0));
    const repeats = loop.loopCount === 0 ? ENDLESS_CAP_IN_PLAYLIST : (loop.loopCount ?? 1);
    return total + (loopLength * repeats);
  }, 0);
};

// Real-time search: matches artist, title, or creator in any word order
// Handles typos via character-overlap scoring
const fuzzyMatch = (query, clip) => {
  if (!query || !query.trim()) return true;
  const terms = query.trim().toLowerCase().split(/\s+/);
  const haystack = [
    clip.title || '',
    clip.artist || '',
    clip.createdBy || ''
  ].join(' ').toLowerCase();

  return terms.every(term => {
    // Exact substring match first (fastest)
    if (haystack.includes(term)) return true;
    // Word-boundary partial match (e.g. "drak" matches "drake")
    const words = haystack.split(/\s+/);
    return words.some(word => {
      if (word.startsWith(term)) return true;
      // Character overlap: at least 75% of term chars appear in word in order
      if (term.length < 3) return false;
      let ti = 0;
      for (let i = 0; i < word.length && ti < term.length; i++) {
        if (word[i] === term[ti]) ti++;
      }
      return ti / term.length >= 0.75;
    });
  });
};

const getPlaylistRuntime = (playlist) =>
  (playlist?.clips || []).reduce((playlistTotal, clip) => {
    const clipLoops = clip.loops || [{ start: clip.startTime || 0, end: clip.endTime || 30, loopCount: 1 }];
    const clipRuntime = clipLoops.reduce((loopTotal, loop) => {
      const loopLength = Math.max(0, (loop.end ?? 0) - (loop.start ?? 0));
      const repeats = loop.loopCount === 0 ? ENDLESS_CAP_IN_PLAYLIST : (loop.loopCount ?? 1);
      return loopTotal + (loopLength * repeats);
    }, 0);
    return playlistTotal + clipRuntime;
  }, 0);

const buildPublicPlaylistShowcase = (publicLists) => {
  const playlistsWithMetrics = publicLists
    .filter(playlist => (playlist.clips?.length || 0) > 0)
    .map(playlist => ({
      ...playlist,
      runtimeSeconds: getPlaylistRuntime(playlist)
    }));

  const slots = [
    { key: 'most-clips', title: 'Most Clips', subtitle: 'Deepest crate', pick: (items) => [...items].sort((a, b) => (b.clips?.length || 0) - (a.clips?.length || 0))[0] },
    { key: 'least-clips', title: 'Quickest Pick', subtitle: 'Shortest queueable set', pick: (items) => [...items].sort((a, b) => (a.clips?.length || 0) - (b.clips?.length || 0))[0] },
    { key: 'longest-runtime', title: 'Longest Runtime', subtitle: 'Most total play time', pick: (items) => [...items].sort((a, b) => (b.runtimeSeconds || 0) - (a.runtimeSeconds || 0))[0] },
    { key: 'featured-pick', title: 'Featured Pick', subtitle: 'Pinned by a curator', pick: (items) => [...items].sort((a, b) => Number(b.isFeatured === true) - Number(a.isFeatured === true) || getCreatedAtValue(b.createdAt) - getCreatedAtValue(a.createdAt)).find(item => item.isFeatured === true) || null },
  ];

  const seen = new Set();
  return slots
    .map(slot => {
      const chosen = slot.pick(playlistsWithMetrics.filter(item => !seen.has(item.id)));
      if (!chosen) return null;
      seen.add(chosen.id);
      return { ...slot, playlist: chosen };
    })
    .filter(Boolean);
};

const loadTrendingData = async () => {
  setDiscoveryLoading(true);
  try {
    const { getTrendingClipsByPlays, getTopArtists } = await import('../lib/firebase');
    const trending = await getTrendingClipsByPlays(5);
    const artists = await getTopArtists(5);
    setTrendingByPlays(trending);
    setTopArtists(artists);
  } finally {
    setDiscoveryLoading(false);
  }
};

  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const seekTimeoutRef = useRef(null);
  // Refs mirror the loop-tracking state so setInterval callbacks always read fresh values
  // (React state inside setInterval suffers stale closures — refs don't)
  const loopsRef = useRef([{ start: 0, end: 30, loopCount: 1 }]);
  const currentLoopIndexRef = useRef(0);
  const currentLoopIterationRef = useRef(0);
  // After every programmatic seekTo we block tracking ticks for 600 ms.
  // Without this, getCurrentTime() still returns the OLD position for 1-2 ticks,
  // which falsely triggers loop advancement (e.g. Loop 3 starting at 0:00 is
  // immediately skipped because oldTime ≥ loop3.end - buffer).
  const skipTrackingUntilRef = useRef(0);
  // When a playlist is active, startTimeTracking calls advanceToNextClip() here
  // instead of calling pauseVideo() so the next track starts automatically.
  // Using a ref (not state) so the setInterval closure always sees the live value.
  const currentPlaylistPlayerRef = useRef(null);
  const standaloneLoopRef = useRef(false);
  const playCreditRef = useRef(null);
  const creditedClipIdsRef = useRef(new Set());
  const lastTrackingTimeRef = useRef(null);

  // Keep refs in sync with state so setInterval callbacks always see current values
  useEffect(() => { loopsRef.current = loops; }, [loops]);
  // currentLoopIndexRef and currentLoopIterationRef are updated directly inside startTimeTracking

  const maxLoopsPerSong = 3; // open to all signed-in users
  const USERNAME_CHANGE_QUOTA = 3;

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
  };

  const updateClipStatInLists = (clipId, field, delta) => {
    const applyDelta = (clip) => (
      clip.id === clipId
        ? { ...clip, [field]: Math.max(0, (clip[field] || 0) + delta) }
        : clip
    );
    setClips(prev => prev.map(applyDelta));
    setTrendingByPlays(prev => {
      const updated = prev.map(applyDelta);
      return field === 'plays'
        ? updated.sort((a, b) => getClipPlayCount(b) - getClipPlayCount(a))
        : updated;
    });
  };

  const awardClipPlay = (clipId) => {
    if (!clipId || creditedClipIdsRef.current.has(clipId)) return;
    creditedClipIdsRef.current.add(clipId);
    updateClipStatInLists(clipId, 'plays', 1);
    import('../lib/firebase').then(async ({ db }) => {
      const { doc, updateDoc, increment } = await import('firebase/firestore');
      updateDoc(doc(db, 'clips', clipId), { plays: increment(1) }).catch(() => {});
    });
  };

  const startPlayCredit = (clip) => {
    if (!clip?.id) {
      playCreditRef.current = null;
      return;
    }

    playCreditRef.current = {
      clipId: clip.id,
      listenedSeconds: 0,
      thresholdSeconds: Math.max(3, Math.min(15, getClipRuntime(clip) * 0.5))
    };
    lastTrackingTimeRef.current = null;
  };

  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isFirstVisit = !localStorage.getItem('tutorialSeen');
      if (isFirstVisit) {
        setTimeout(() => setShowTutorial(true), 500);
        localStorage.setItem('tutorialSeen', 'true');
      }

      loadTrendingClips();
      loadLeaderboard();
      loadTrendingData();
      loadPublicPlaylists();

      // Expose one-time migrations on window so they can be run from the browser console once
      window.__migrateClipsToPrivate = handleMigrateClipsToPrivate;
      window.__migrateAllPlaylistsToPrivate = handleMigratePlaylistsToPrivate;

      if (user?.uid) {
        loadUserPlaylists();
        loadSavedQueue();

        let unsubUserClips;
        let retryTimer;

        const setupUserClipsSubscription = () => {
          import('../lib/firebase').then(({ subscribeToUserClips }) => {
            unsubUserClips = subscribeToUserClips(user.uid, (userClips) => {
              setMyClips(userClips);
              // If we got clips, clear any pending retry
              if (userClips.length > 0 && retryTimer) {
                clearTimeout(retryTimer);
                retryTimer = null;
              }
            });
          });
        };

        setupUserClipsSubscription();

        // Retry once after 2s in case of auth timing issue on PC/desktop
        retryTimer = setTimeout(() => {
          if (unsubUserClips) unsubUserClips();
          setupUserClipsSubscription();
        }, 2000);

        return () => {
          if (unsubUserClips) unsubUserClips();
          if (retryTimer) clearTimeout(retryTimer);
        };
      }
    }
    // These loaders intentionally re-run when auth identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  useEffect(() => {
    if (topArtists.length === 0) return;

    const loadImages = async () => {
      const uniqueArtists = [...new Set(topArtists.map(a => a.artist))];

      for (const artist of uniqueArtists) {
        if (!artistImages[artist]) {
          const imageUrl = await getArtistImageWithCache(artist);
          setArtistImages(prev => ({ ...prev, [artist]: imageUrl }));
        }
      }
    };

    loadImages();
  }, [topArtists, artistImages]);

useEffect(() => { standaloneLoopRef.current = standaloneLoop; }, [standaloneLoop]);

useEffect(() => {
  if (user?.appTheme === 'classic' || user?.appTheme === 'electric') {
    setThemeMode(user.appTheme);
    return;
  }

  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('chorusclip-theme');
    if (savedTheme === 'classic' || savedTheme === 'electric') {
      setThemeMode(savedTheme);
    }
  }
}, [user?.appTheme]);

const handleThemeToggle = async () => {
  const nextTheme = themeMode === 'electric' ? 'classic' : 'electric';
  setThemeMode(nextTheme);
  if (typeof window !== 'undefined') {
    localStorage.setItem('chorusclip-theme', nextTheme);
  }

  if (!user?.uid) return;
  try {
    const { db } = await import('../lib/firebase');
    const { doc, setDoc } = await import('firebase/firestore');
    await setDoc(doc(db, 'users', user.uid), { appTheme: nextTheme }, { merge: true });
    setUser(prev => ({ ...prev, appTheme: nextTheme }));
  } catch (error) {
    console.error('Theme save failed:', error);
    showNotification('Theme changed here, but could not save to your account', 'error');
  }
};

  useEffect(() => {
    if (user?.uid) return;

    setPlaylists([]);
    setSelectedClipsForPlaylist([]);
    setPlaylistQueue([]);
    playlistQueueRef.current = [];
    setPlaylistQueueIndex(0);
    playlistQueueIndexRef.current = 0;
    setIsPlayingQueue(false);
    setCurrentPlaylistInfo(null);

    if (currentPlaylistPlayerRef.current) {
      currentPlaylistPlayerRef.current.stop();
      currentPlaylistPlayerRef.current = null;
    }
    setCurrentPlaylistPlayer(null);
    setIsPlayingPlaylist(false);
  }, [user?.uid]);

  const loadTrendingClips = async () => {
    setFeedLoading(true);
    try {
      const { getClipsPage } = await import('../lib/firebase');
      const firstPage = await getClipsPage(FEED_PAGE_SIZE);
      setClips(firstPage.clips);
      setFeedCursor(firstPage.lastVisibleDoc);
      setFeedHasMore(firstPage.hasMore);
      setFeedPage(1);
    } catch (error) {
      console.log('Using demo clips');
      setClips([]);
      setFeedCursor(null);
      setFeedHasMore(false);
      setFeedPage(1);
    } finally {
      setFeedLoading(false);
    }
  };

  const loadMoreClips = async () => {
    if (feedLoading || !feedHasMore) return;

    setFeedLoading(true);
    try {
      const { getClipsPage } = await import('../lib/firebase');
      const nextPage = await getClipsPage(FEED_PAGE_SIZE, feedCursor);
      setClips(prev => [...prev, ...nextPage.clips]);
      setFeedCursor(nextPage.lastVisibleDoc);
      setFeedHasMore(nextPage.hasMore);
      setFeedPage(prev => prev + 1);
    } catch (error) {
      console.error('Failed to load older clips:', error);
      showNotification('Could not load older clips right now', 'error');
    } finally {
      setFeedLoading(false);
    }
  };

  const loadLeaderboard = async () => {
  try {
    const { getLeaderboard } = await import('../lib/firebase');
    const leaders = await getLeaderboard(3);
    if (leaders && leaders.length > 0) {
      setLeaderboard(leaders);
    }
  } catch (error) {
    console.log('Leaderboard unavailable for unsigned users');
    // Set empty leaderboard instead of crashing
    setLeaderboard([]);
  }
};

  const extractVideoId = (url) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const extractArtist = (title) => {
    const parts = title.split(' - ');
    return parts.length > 1 ? parts[0].trim() : 'Unknown Artist';
  };

  const fetchMostReplayed = async () => {
    // Use actual video duration (if player is ready) to make a smarter suggestion.
    // Chorus/hook is typically 25–40% into a song.
    // If the player isn't ready yet, fall back to 60s.
    let duration = 0;
    try {
      if (playerRef.current?.getDuration) {
        duration = playerRef.current.getDuration();
      }
    } catch (e) {}

    if (!duration || duration <= 0) {
      // Player not ready — wait a bit and try once more
      await new Promise(resolve => setTimeout(resolve, 1200));
      try {
        if (playerRef.current?.getDuration) {
          duration = playerRef.current.getDuration();
        }
      } catch (e) {}
    }

    if (duration > 0) {
      // Heuristic: chorus tends to start around 25% in and last ~30 s
      const start = Math.floor(duration * 0.25);
      const end = Math.min(start + 30, duration - 5);
      setSuggestedStart(Math.max(0, start));
      setSuggestedEnd(Math.max(start + 10, end));
    } else {
      // Ultimate fallback
      setSuggestedStart(60);
      setSuggestedEnd(90);
    }
    setShowMostReplayedSuggestion(true);
  };
  
  const handleUrlSubmit = async () => {
  setGlobalLoading(true);
  try {
  if (!window.YT || !window.YT.Player) {
    showNotification('⏳ YouTube player loading... Try again in 2 seconds', 'info');
    return;
  }
  
  const id = extractVideoId(youtubeUrl);
  if (!id) {
    showNotification('❌ Invalid YouTube URL', 'error');
    return;
  }

  // DETECT NON-MUSIC VIDEOS
  const url = youtubeUrl.toLowerCase();
  const nonMusicKeywords = ['podcast', 'interview', 'tutorial', 'vlog', 'gaming', 'gameplay', 'lecture', 'documentary'];
  const isSuspicious = nonMusicKeywords.some(keyword => url.includes(keyword));
  
  if (isSuspicious) {
    const confirm = window.confirm('⚠️ This doesn\'t look like a music video. ChorusClip works best with music! Continue anyway?');
    if (!confirm) return;
  }
  
  // Destroy old player
  if (playerRef.current?.destroy) {
    try {
      playerRef.current.destroy();
      playerRef.current = null;
    } catch (e) {
      console.log('Player destroy error (ignored)');
    }
  }
  
  setVideoId(id);
  setCurrentLoopIndex(0);
  setCurrentLoopIteration(0);
  setIsReadOnlyMode(false); // New URL loaded — allow editing
  setLoops([{ start: 0, end: 30, loopCount: 1, youtubeVideoId: id }]); // Reset loops for new song
  setExpandedSections([0]);
  setVideoDuration(600); // Reset; will be updated once player reports actual duration

  setTimeout(() => {
    loadYouTubePlayer(id);
    fetchMostReplayed();
  }, 300);
  } finally {
    setGlobalLoading(false);
  }
};
  
const applySuggestedLoop = () => {
  const newLoops = [{
    ...(loops[0] || {}),
    start: suggestedStart,
    end: suggestedEnd,
    loopCount: loops[0]?.loopCount ?? 1,
    youtubeVideoId: loops[0]?.youtubeVideoId || videoId,
    title: loops[0]?.title || videoTitle,
    artist: loops[0]?.artist || artist
  }];
  setLoops(newLoops);
  setShowMostReplayedSuggestion(false);
  
  // Wait for state to update, THEN seek
  setTimeout(() => {
    if (playerRef.current?.seekTo) {
      try {
        playerRef.current.seekTo(suggestedStart, true);
        playerRef.current.playVideo(); // Auto-play after seeking
        console.log(`✅ Seeked to ${suggestedStart}s and playing`);
        showNotification(`✅ Loop set: ${Math.floor(suggestedStart/60)}:${(suggestedStart%60).toString().padStart(2,'0')} - ${Math.floor(suggestedEnd/60)}:${(suggestedEnd%60).toString().padStart(2,'0')}`, 'success');
      } catch (e) {
        console.log('Seek error:', e);
      }
    }
  }, 300);
};

const dismissSuggestion = () => {
  // Keep default 20-50s but DON'T seek - let user control
  setShowMostReplayedSuggestion(false);
  console.log('✅ Manual mode: User will adjust sliders');
};

const loadYouTubePlayer = (id) => {
  if (!window.YT?.Player) return;
  
  playerRef.current = new window.YT.Player('youtube-player', {
    videoId: id,
    playerVars: { 
      autoplay: 0,
      controls: 1,
      enablejsapi: 1,
      origin: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
      widget_referrer: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    },
    events: {
      onReady: (event) => {
        const title = event.target.getVideoData().title;
        setVideoTitle(title);
        setArtist(extractArtist(title));
        setLoops(prev => prev.map((loop, index) => index === 0
          ? { ...loop, youtubeVideoId: id, title, artist: extractArtist(title) }
          : loop
        ));
        // Capture actual video duration so sliders don't exceed the real video length
        const dur = event.target.getDuration();
        if (dur > 0) setVideoDuration(Math.ceil(dur));
        // Now that the player is ready we have duration — generate a real suggestion
        fetchMostReplayed();
      },
      onStateChange: onPlayerStateChange
    }
  });
};

const loadUserPlaylists = async () => {
  if (!user?.uid) return;
  try {
    const userPlaylists = await getUserPlaylists(user.uid);
    setPlaylists(userPlaylists);
  } catch (error) {
    console.error('Failed to load playlists:', error);
  }
};

const loadSavedQueue = async () => {
  if (!user?.uid) return;
  try {
    const { loadQueueFromFirestore } = await import('../lib/firebase');
    const savedIds = await loadQueueFromFirestore(user.uid);
    if (!savedIds || savedIds.length === 0) return;

    const { getUserPlaylists } = await import('../utils/playlistUtils');
    const userPlaylists = await getUserPlaylists(user.uid);

    const hydrated = savedIds
      .map(id => userPlaylists.find(p => p.id === id))
      .filter(Boolean)
      .slice(0, 10);

    if (hydrated.length > 0) {
      setPlaylistQueue(hydrated);
      playlistQueueRef.current = hydrated;
      showNotification(`🎵 Queue restored (${hydrated.length} playlist${hydrated.length > 1 ? 's' : ''})`, 'info');
    }
  } catch (e) {
    console.error('Queue restore failed:', e);
  }
};

const loadPublicPlaylists = async () => {
  try {
    const publicLists = await getAllPublicPlaylists();
    setPublicPlaylists(publicLists);
  } catch (error) {
    console.error('Failed to load public playlists:', error);
  }
};

const handleDeletePlaylist = async (playlistId) => {
  if (!window.confirm('Delete this playlist? This cannot be undone.')) return;
  try {
    const { deletePlaylist } = await import('../lib/firebase');
    await deletePlaylist(playlistId);
    showNotification('Playlist deleted!', 'success');
    setManagingPlaylist(null);
    loadUserPlaylists();
  } catch (e) {
    showNotification('Failed to delete playlist', 'error');
  }
};

const handleRenamePlaylist = async (playlist) => {
  const newName = window.prompt('New playlist name:', playlist.name);
  if (!newName?.trim() || newName.trim() === playlist.name) return;
  try {
    const { updatePlaylist } = await import('../lib/firebase');
    await updatePlaylist(playlist.id, { name: newName.trim() });
    showNotification('Playlist renamed!', 'success');
    setManagingPlaylist(prev => prev ? { ...prev, name: newName.trim() } : null);
    loadUserPlaylists();
  } catch (e) {
    showNotification('Failed to rename', 'error');
  }
};

const handleRemoveClipFromPlaylist = async (playlist, clipIndex) => {
  const clipTitle = playlist.clips[clipIndex]?.title || 'this song';
  const confirmed = window.confirm(`Remove "${clipTitle}" from "${playlist.name}"?\nThis cannot be undone.`);
  if (!confirmed) return;
  const newClips = playlist.clips.filter((_, i) => i !== clipIndex);
  try {
    const { updatePlaylist } = await import('../lib/firebase');
    await updatePlaylist(playlist.id, { clips: newClips });
    const updated = { ...playlist, clips: newClips };
    setManagingPlaylist(updated);
    loadUserPlaylists();
    showNotification('Clip removed!', 'success');
  } catch (e) {
    showNotification('Failed to remove clip', 'error');
  }
};

/** Returns true if clip is already in existingClips (same id or same video+start time). */
const isClipDuplicate = (clip, existingClips) =>
  existingClips.some(c =>
    c.id === clip.id ||
    (c.youtubeVideoId === clip.youtubeVideoId &&
      c.loops?.[0]?.start === clip.loops?.[0]?.start &&
      c.loops?.[0]?.end === clip.loops?.[0]?.end)
  );

const handleAddToExistingPlaylist = async (targetPlaylist) => {
  if (selectedClipsForPlaylist.length === 0) return;
  // Filter out duplicates
  const newClips = selectedClipsForPlaylist.filter(c => !isClipDuplicate(c, targetPlaylist.clips));
  const skipped = selectedClipsForPlaylist.length - newClips.length;
  if (newClips.length === 0) {
    showNotification('All selected clips are already in this playlist!', 'info');
    return;
  }
  const combined = [...targetPlaylist.clips, ...newClips].slice(0, 10);
  try {
    const { updatePlaylist } = await import('../lib/firebase');
    await updatePlaylist(targetPlaylist.id, { clips: combined });
    const skipMsg = skipped > 0 ? ` (${skipped} duplicate${skipped > 1 ? 's' : ''} skipped)` : '';
    showNotification(`Added to "${targetPlaylist.name}"!${skipMsg}`, 'success');
    setSelectedClipsForPlaylist([]);
    setShowPlaylistModal(false);
    loadUserPlaylists();
  } catch (e) {
    showNotification('Failed to add clips', 'error');
  }
};

const handleSortPlaylist = async (playlist, sortBy) => {
  const sorted = [...(playlist.clips || [])];
  if (sortBy === 'artist-asc') {
    sorted.sort((a, b) => (a.artist || '').localeCompare(b.artist || ''));
  } else if (sortBy === 'artist-desc') {
    sorted.sort((a, b) => (b.artist || '').localeCompare(a.artist || ''));
  } else if (sortBy === 'title-asc') {
    sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  } else if (sortBy === 'date-desc') {
    sorted.reverse(); // newest-added last in array → show newest first
  }
  // 'date-asc' = keep original insertion order (no sort needed)
  try {
    const { updatePlaylist } = await import('../lib/firebase');
    await updatePlaylist(playlist.id, { clips: sorted });
    setManagingPlaylist(prev => prev ? { ...prev, clips: sorted } : null);
    loadUserPlaylists();
    showNotification('Playlist sorted!', 'success');
  } catch (e) {
    showNotification('Failed to sort', 'error');
  }
};

const handleCreatePlaylist = async () => {
  const nameInput = document.getElementById('playlist-name-input');
  const name = nameInput?.value?.trim();
  
  if (!name) {
    showNotification('Enter a playlist name!', 'error');
    return;
  }
  
  if (selectedClipsForPlaylist.length === 0) {
    showNotification('Add at least one clip!', 'error');
    return;
  }
  
  if (!user?.uid) {
    showNotification('Sign in to create playlists!', 'error');
    setShowAuthModal(true);
    return;
  }
  
  try {
    await createPlaylist(user.uid, name, selectedClipsForPlaylist, user.displayName);
    showNotification('🎉 Playlist created!', 'success');
    setShowPlaylistModal(false);
    setSelectedClipsForPlaylist([]);
    if (nameInput) nameInput.value = '';
    loadUserPlaylists();
  } catch (error) {
    console.error('Playlist creation error:', error);
    showNotification('Failed to create playlist', 'error');
  }
};

const handlePlayPlaylist = (playlist) => {
  if (!playlist.clips || playlist.clips.length === 0) {
    showNotification('This playlist is empty!', 'error');
    return;
  }

  setGlobalLoading(true);

  if (currentPlaylistPlayer) {
    currentPlaylistPlayer.stop();
  }

  const player = new PlaylistPlayer(playlist, playerRef, {
    // clip.loops are already normalized by PlaylistPlayer.normalizeClip()
    onClipChange: (clip, index, total) => {
      setGlobalLoading(false); // clear once first clip loads
      setCurrentPlaylistInfo({ name: playlist.name, currentIndex: index, total, currentClip: clip });
      setLoops(clip.loops);
      setVideoTitle(clip.title);
      setArtist(clip.artist);
      setVideoId(clip.youtubeVideoId);
      // Sync refs immediately — startTimeTracking reads these, not state
      loopsRef.current = clip.loops;
      currentLoopIndexRef.current = 0;
      currentLoopIterationRef.current = 0;
      skipTrackingUntilRef.current = Date.now() + 800; // dead zone while new video loads
      startPlayCredit(clip);
    },
    onPlaylistComplete: () => {
      currentPlaylistPlayerRef.current = null;
      setIsPlayingPlaylist(false);
      setCurrentPlaylistInfo(null);
      setCurrentPlaylistPlayer(null);
    },
    showNotification
  }, playlistMode);

  // Keep ref AND state in sync so startTimeTracking (setInterval closure) sees it
  currentPlaylistPlayerRef.current = player;
  setCurrentPlaylistPlayer(player);
  setIsPlayingPlaylist(true);
  showNotification(`▶️ Playing: ${playlist.name}`, 'success');

  if (playerRef.current?.loadVideoById) {
    player.playNext();
  } else {
    initAndPlay(playlist, player, () => player.playNext());
  }
};

const initAndPlay = (targetPlaylist, player, onReady) => {
  if (playerRef.current?.loadVideoById) {
    // Existing player — hand off immediately
    player.playNext();
  } else if (window.YT?.Player) {
    playerRef.current = new window.YT.Player('youtube-player', {
      videoId: targetPlaylist.clips[0].youtubeVideoId,
      playerVars: { autoplay: 1, controls: 1, enablejsapi: 1, origin: window.location.origin },
      events: {
        onReady: () => {
          // Give player 300ms to stabilise before advancing
          setTimeout(() => onReady(), 300);
        },
        onStateChange: onPlayerStateChange
      }
    });
  } else {
    // YT API not loaded yet — wait and retry
    let retries = 0;
    const wait = setInterval(() => {
      retries++;
      if (window.YT?.Player || retries > 20) {
        clearInterval(wait);
        if (window.YT?.Player) initAndPlay(targetPlaylist, player, onReady);
        else showNotification('YouTube not ready — try again in a moment', 'error');
      }
    }, 300);
  }
};

// Playlist Queue helpers
const handleAddToQueue = (playlist) => {
  if (playlistQueue.some(p => p.id === playlist.id)) {
    showNotification('Already in queue!', 'info');
    return;
  }
  if (playlistQueue.length >= 10) {
    showNotification('Queue holds max 10 playlists', 'error');
    return;
  }
  const newQueue = [...playlistQueue, playlist];
  setPlaylistQueue(newQueue);
  playlistQueueRef.current = newQueue;
  showNotification(`Added "${playlist.name}" to queue (${newQueue.length}/10)`, 'success');
  if (user?.uid) {
    import('../lib/firebase').then(({ saveQueueToFirestore }) => {
      saveQueueToFirestore(user.uid, newQueue.map(p => p.id));
    });
  }
};

const handleRemoveFromQueue = (playlistId) => {
  const newQueue = playlistQueue.filter(p => p.id !== playlistId);
  setPlaylistQueue(newQueue);
  playlistQueueRef.current = newQueue;
  if (user?.uid) {
    import('../lib/firebase').then(({ saveQueueToFirestore }) => {
      saveQueueToFirestore(user.uid, newQueue.map(p => p.id));
    });
  }
};

const handleMoveStagedClip = (index, dir) => {
  const newClips = [...selectedClipsForPlaylist];
  const target = dir === 'up' ? index - 1 : index + 1;
  if (target < 0 || target >= newClips.length) return;
  [newClips[index], newClips[target]] = [newClips[target], newClips[index]];
  setSelectedClipsForPlaylist(newClips);
};

const handleMoveQueueItem = (index, dir) => {
  const newQueue = [...playlistQueue];
  const target = dir === 'up' ? index - 1 : index + 1;
  if (target < 0 || target >= newQueue.length) return;
  [newQueue[index], newQueue[target]] = [newQueue[target], newQueue[index]];
  setPlaylistQueue(newQueue);
  playlistQueueRef.current = newQueue;
  if (user?.uid) {
    import('../lib/firebase').then(({ saveQueueToFirestore }) => {
      saveQueueToFirestore(user.uid, newQueue.map(p => p.id));
    });
  }
};

const handlePlayQueue = (startIdx = 0) => {
  const queue = playlistQueueRef.current;
  if (!queue || queue.length === 0) {
    showNotification('Add playlists to the queue first!', 'error');
    return;
  }
  if (startIdx >= queue.length) {
    setIsPlayingQueue(false);
    setPlaylistQueueIndex(0);
    showNotification('Queue finished!', 'success');
    return;
  }

  setIsPlayingQueue(true);
  setPlaylistQueueIndex(startIdx);
  playlistQueueIndexRef.current = startIdx;

  const targetPlaylist = queue[startIdx];
  showNotification(`Queue ${startIdx + 1}/${queue.length}: "${targetPlaylist.name}"`, 'info');

  // Override the playlist's onPlaylistComplete to advance the queue
  if (currentPlaylistPlayer) {
    currentPlaylistPlayer.stop();
  }

  const player = new PlaylistPlayer(targetPlaylist, playerRef, {
    onClipChange: (clip, index, total) => {
      setCurrentPlaylistInfo({ name: targetPlaylist.name, currentIndex: index, total, currentClip: clip, queuePos: startIdx, queueTotal: queue.length });
      setLoops(clip.loops);
      setVideoTitle(clip.title);
      setArtist(clip.artist);
      setVideoId(clip.youtubeVideoId);
      loopsRef.current = clip.loops;
      currentLoopIndexRef.current = 0;
      currentLoopIterationRef.current = 0;
      skipTrackingUntilRef.current = Date.now() + 800;
      startPlayCredit(clip);
    },
    onPlaylistComplete: () => {
      // Advance to next playlist in queue
      const nextIdx = playlistQueueIndexRef.current + 1;
      if (nextIdx < playlistQueueRef.current.length) {
        setTimeout(() => handlePlayQueue(nextIdx), 600);
      } else {
        currentPlaylistPlayerRef.current = null;
        setIsPlayingPlaylist(false);
        setIsPlayingQueue(false);
        setCurrentPlaylistInfo(null);
        setCurrentPlaylistPlayer(null);
        setPlaylistQueueIndex(0);
        showNotification('All queued playlists finished!', 'success');
      }
    },
    showNotification
  }, playlistMode);

  currentPlaylistPlayerRef.current = player;
  setCurrentPlaylistPlayer(player);
  setIsPlayingPlaylist(true);

  if (playerRef.current?.loadVideoById) {
    player.playNext();
  } else {
    initAndPlay(targetPlaylist, player, () => player.playNext());
  }
};

const handlePlayStagedClips = () => {
  if (selectedClipsForPlaylist.length === 0) {
    showNotification('Add clips to the queue first!', 'error');
    return;
  }

  if (currentPlaylistPlayer) {
    currentPlaylistPlayer.stop();
  }

  const clipQueue = {
    id: 'staged-clip-queue',
    name: 'Clip Queue',
    clips: selectedClipsForPlaylist.slice(0, 10)
  };

  const player = new PlaylistPlayer(clipQueue, playerRef, {
    onClipChange: (clip, index, total) => {
      setCurrentPlaylistInfo({ name: clipQueue.name, currentIndex: index, total, currentClip: clip });
      setLoops(clip.loops);
      setVideoTitle(clip.title);
      setArtist(clip.artist);
      setVideoId(clip.youtubeVideoId);
      setIsReadOnlyMode(true);
      loopsRef.current = clip.loops;
      currentLoopIndexRef.current = 0;
      currentLoopIterationRef.current = 0;
      skipTrackingUntilRef.current = Date.now() + 800;
      startPlayCredit(clip);
    },
    onPlaylistComplete: () => {
      currentPlaylistPlayerRef.current = null;
      setIsPlayingPlaylist(false);
      setCurrentPlaylistInfo(null);
      setCurrentPlaylistPlayer(null);
      showNotification('Clip queue finished!', 'success');
    },
    showNotification
  }, playlistMode);

  currentPlaylistPlayerRef.current = player;
  setCurrentPlaylistPlayer(player);
  setIsPlayingPlaylist(true);
  showNotification(`Playing clip queue (${clipQueue.clips.length}/10)`, 'success');

  if (playerRef.current?.loadVideoById) {
    player.playNext();
  } else if (window.YT?.Player) {
    playerRef.current = new window.YT.Player('youtube-player', {
      videoId: clipQueue.clips[0].youtubeVideoId,
      playerVars: { autoplay: 0, controls: 1, enablejsapi: 1, origin: window.location.origin },
      events: {
        onReady: () => player.playNext(),
        onStateChange: onPlayerStateChange
      }
    });
  } else {
    showNotification('YouTube not ready - paste a URL first or wait a moment.', 'error');
  }
};

const loadLoopSection = (loop, fallbackVideoId = videoId) => {
  if (!loop || !playerRef.current) return;
  const nextVideoId = getLoopVideoId(loop, fallbackVideoId);
  const currentVideoId = playerRef.current.getVideoData?.()?.video_id || fallbackVideoId;

  setVideoId(nextVideoId);
  setYoutubeUrl(`https://youtube.com/watch?v=${nextVideoId}`);
  setVideoTitle(getLoopTitle(loop, videoTitle));
  setArtist(getLoopArtist(loop, artist));
  skipTrackingUntilRef.current = Date.now() + 900;

  if (nextVideoId && nextVideoId !== currentVideoId && playerRef.current.loadVideoById) {
    playerRef.current.loadVideoById({
      videoId: nextVideoId,
      startSeconds: loop.start
    });
    setTimeout(() => {
      try { playerRef.current?.playVideo(); } catch (e) {}
    }, 500);
    return;
  }

  if (playerRef.current.seekTo) {
    playerRef.current.seekTo(loop.start, true);
  }
};

const completeCurrentClipPlayback = () => {
  currentLoopIterationRef.current = 0;
  setCurrentLoopIteration(0);
  currentLoopIndexRef.current = 0;
  setCurrentLoopIndex(0);

  // ALWAYS stop tracking first — prevents interval from re-firing during async handoff
  stopTimeTracking();

  if (currentPlaylistPlayerRef.current) {
    try { playerRef.current?.pauseVideo(); } catch(e) {}
    currentPlaylistPlayerRef.current.advanceToNextClip();
  } else if (standaloneLoopRef.current && loopsRef.current[0]) {
    skipTrackingUntilRef.current = Date.now() + 800;
    playerRef.current.seekTo(loopsRef.current[0].start, true);
    startTimeTracking();
  } else {
    try { playerRef.current?.pauseVideo(); } catch(e) {}
    setIsPlaying(false);
  }
};

  const handleMigrateClipsToPrivate = async () => {
    if (!user?.uid) return;
    setGlobalLoading(true);
    try {
      const { migrateAllClipsToPrivate } = await import('../lib/firebase');
      const count = await migrateAllClipsToPrivate();
      showNotification(`✅ ${count} clips set to private`, 'success');
    } catch (e) {
      showNotification('Migration failed: ' + e.message, 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleMigratePlaylistsToPrivate = async () => {
    if (!user?.uid) return;
    setGlobalLoading(true);
    try {
      const { migrateAllPlaylistsToPrivate } = await import('../lib/firebase');
      const count = await migrateAllPlaylistsToPrivate();
      showNotification(`✅ ${count} playlists set to private`, 'success');
    } catch (e) {
      showNotification('Migration failed: ' + e.message, 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const onPlayerReady = (event) => {
  const title = event.target.getVideoData().title;
  setVideoTitle(title);
  setArtist(extractArtist(title));
  // REMOVED: No longer auto-seeking to loop start
  // User will manually seek or let it play from beginning
};

  const onPlayerStateChange = (event) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      startTimeTracking();
    } else if (event.data === window.YT.PlayerState.PAUSED) {
      setIsPlaying(false);
      stopTimeTracking();
    } else if (event.data === window.YT.PlayerState.ENDED) {
      setIsPlaying(false);
      stopTimeTracking();

      if (currentPlaylistPlayerRef.current) {
        // Don't restart — let playlist advance
        currentPlaylistPlayerRef.current.advanceToNextClip();
      }
      // If NOT in playlist, do nothing — let user press play again
    }
  };
  
const handlePlayClip = async (clipId, videoIdToPlay, clipData) => {
  setGlobalLoading(true);
  try {
    // Stop any active loop tracking
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Normalize loops: ensure each has its own loopCount (backward compat with old clips)
    const rawLoops = clipData.loops || [{ start: clipData.startTime || 0, end: clipData.endTime || 30 }];
    const loopsToLoad = rawLoops.map(loop => ({
      ...loop,
      youtubeVideoId: getLoopVideoId(loop, videoIdToPlay),
      title: getLoopTitle(loop, clipData.title),
      artist: getLoopArtist(loop, clipData.artist),
      loopCount: loop.loopCount ?? (clipData.loopCount ?? 1)
    }));
    startPlayCredit({ ...clipData, id: clipId, loops: loopsToLoad });

    const firstVideoId = getLoopVideoId(loopsToLoad[0], videoIdToPlay);

    // Update state AND refs immediately so startTimeTracking interval uses fresh values right away
    setYoutubeUrl(`https://youtube.com/watch?v=${firstVideoId}`);
    setVideoId(firstVideoId);
    setVideoTitle(getLoopTitle(loopsToLoad[0], clipData.title));
    setArtist(getLoopArtist(loopsToLoad[0], clipData.artist));
    setLoops(loopsToLoad);
    setCurrentLoopIndex(0);
    setCurrentLoopIteration(0);
    setExpandedSections([0]);
    setIsPlaying(false);
    setIsReadOnlyMode(true); // Playing from feed — lock the edit sliders

    loopsRef.current = loopsToLoad;
    currentLoopIndexRef.current = 0;
    currentLoopIterationRef.current = 0;

    showNotification('⏳ Loading...', 'info');

    if (playerRef.current?.loadVideoById) {
      // Reuse existing player — avoids the "loads forever on first attempt" bug
      // that occurred when destroying/recreating the player DOM element.
      playerRef.current.loadVideoById({
        videoId: firstVideoId,
        startSeconds: loopsToLoad[0].start
      });

      // Poll for the new video title + duration (loadVideoById does not re-fire onReady)
      let titlePolls = 0;
      const titleInterval = setInterval(() => {
        titlePolls++;
        if (playerRef.current?.getVideoData) {
          const data = playerRef.current.getVideoData();
          if (data?.title) {
            setVideoTitle(data.title);
            setArtist(extractArtist(data.title));
            // Also grab the actual duration so sliders don't overshoot
            const dur = playerRef.current.getDuration?.();
            if (dur > 0) setVideoDuration(Math.ceil(dur));
            clearInterval(titleInterval);
          }
        }
        if (titlePolls > 20) clearInterval(titleInterval);
      }, 400);

      setTimeout(() => {
        try {
          playerRef.current?.playVideo();
          showNotification('▶️ Playing!', 'success');
        } catch (e) {}
      }, 700);

    } else {
      // No player exists yet — create a fresh one (feed clip tapped before URL submit)
      await new Promise(resolve => setTimeout(resolve, 400));

      if (window.YT?.Player) {
        playerRef.current = new window.YT.Player('youtube-player', {
          videoId: firstVideoId,
          playerVars: { autoplay: 0, controls: 1, enablejsapi: 1, origin: window.location.origin },
          events: {
            onReady: (event) => {
              const title = event.target.getVideoData().title;
              setVideoTitle(title);
              setArtist(extractArtist(title));
              setTimeout(() => {
                try {
                  event.target.seekTo(loopsToLoad[0].start, true);
                  event.target.playVideo();
                  showNotification('▶️ Playing!', 'success');
                } catch (e) {}
              }, 400);
            },
            onStateChange: onPlayerStateChange
          }
        });
      }
    }
  } catch (error) {
    console.error('Play clip error:', error);
    showNotification('❌ Failed to play', 'error');
  } finally {
    setTimeout(() => setGlobalLoading(false), 800);
  }
};

const startTimeTracking = () => {
  if (intervalRef.current) clearInterval(intervalRef.current);
  skipTrackingUntilRef.current = 0; // Clear any leftover dead zone on fresh start

  intervalRef.current = setInterval(() => {
    if (!playerRef.current?.getCurrentTime || !playerRef.current?.getPlayerState) return;

    // Dead zone: skip ticks for 800 ms after any programmatic seekTo.
    // Without this, getCurrentTime() still returns the OLD position for 1–2 ticks,
    // which falsely fires the end-of-loop check and skips sections.
    if (Date.now() < skipTrackingUntilRef.current) return;

    try {
      const time = playerRef.current.getCurrentTime();
      const state = playerRef.current.getPlayerState();

      setPlayerCurrentTime(time);

      if (state !== window.YT.PlayerState.PLAYING) return;

      if (playCreditRef.current) {
        const lastTime = lastTrackingTimeRef.current;
        if (lastTime !== null) {
          const delta = time - lastTime;
          if (delta > 0 && delta < 1.5) {
            playCreditRef.current.listenedSeconds += delta;
          }
        }
        lastTrackingTimeRef.current = time;

        if (playCreditRef.current.listenedSeconds >= playCreditRef.current.thresholdSeconds) {
          awardClipPlay(playCreditRef.current.clipId);
          playCreditRef.current = null;
        }
      }

      // READ FROM REFS – not from state (avoids stale closure bug)
      const currentLoops = loopsRef.current;
      const loopIdx = currentLoopIndexRef.current;
      const iteration = currentLoopIterationRef.current;

      if (!currentLoops || currentLoops.length === 0 || !currentLoops[loopIdx]) return;

      const currentLoop = currentLoops[loopIdx];
      const duration = currentLoop.end - currentLoop.start;
      // Generous buffer to catch end-of-section reliably regardless of connection speed
      const buffer = Math.min(1.0, duration * 0.06);
      // Per-section repeat count: 0 = infinite, otherwise specific repeat count for this section
      const loopPlayCount = currentLoop.loopCount ?? 1;

      // DEFENSIVE: if playback drifted BEFORE start (e.g. YouTube resumed from beginning),
      // snap back to section start immediately.
      if (time < currentLoop.start - 0.3) {
        skipTrackingUntilRef.current = Date.now() + 800;
        playerRef.current.seekTo(currentLoop.start, true);
        return;
      }

      if (time >= currentLoop.end - buffer) {
        const newIter = iteration + 1;

        if (loopPlayCount === 0 || newIter < loopPlayCount) {
          // This section has more repetitions — restart it
          currentLoopIterationRef.current = newIter;
          setCurrentLoopIteration(newIter);
          skipTrackingUntilRef.current = Date.now() + 800;
          playerRef.current.seekTo(currentLoop.start, true);
        } else {
          // This section's repetitions done — advance to next section
          if (loopIdx < currentLoops.length - 1) {
            const nextIdx = loopIdx + 1;
            currentLoopIndexRef.current = nextIdx;
            setCurrentLoopIndex(nextIdx);
            currentLoopIterationRef.current = 0;
            setCurrentLoopIteration(0);
            lastTrackingTimeRef.current = null;
            loadLoopSection(currentLoops[nextIdx], getLoopVideoId(currentLoop, videoId));
          } else {
            // All sections for this clip are done
            completeCurrentClipPlayback();
          }
        }
      }
    } catch (e) {
      console.error('Tracking error:', e);
    }
  }, 100); // 100ms polling for tighter boundary adherence
};
  const stopTimeTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const togglePlayPause = () => {
    if (playerRef.current) {
      try {
        if (isPlaying) {
          playerRef.current.pauseVideo();
        } else {
          playerRef.current.playVideo();
        }
      } catch (e) {
        console.log('Play/pause error (ignored):', e);
      }
    }
  };

  const handleLoopRestart = () => {
    if (playerRef.current) {
      try {
        setCurrentLoopIndex(0);
        setCurrentLoopIteration(0);
        playerRef.current.seekTo(loops[0].start, true);
        playerRef.current.playVideo();
      } catch (e) {
        console.log('Restart error (ignored):', e);
      }
    }
  };

  const addLoop = () => {
    if (loops.length >= maxLoopsPerSong) {
      showNotification('Maximum 3 sections per clip.', 'error');
      return;
    }
    // New section starts where the last one ends (capped by video duration)
    const lastLoop = loops[loops.length - 1];
    const newStart = Math.min(lastLoop.end, videoDuration - 1);
    const newEnd = Math.min(newStart + 30, videoDuration);
    setLoops([...loops, {
      start: newStart,
      end: newEnd,
      loopCount: 1,
      youtubeVideoId: videoId,
      title: videoTitle,
      artist
    }]);
  };

  const updateLoopCount = (index, value) => {
    const newLoops = [...loops];
    newLoops[index] = { ...newLoops[index], loopCount: Number(value) };
    setLoops(newLoops);
  };

  const updateLoopMeta = (index, updates) => {
    const newLoops = [...loops];
    newLoops[index] = { ...newLoops[index], ...updates };
    setLoops(newLoops);
  };

  const handleUseLoadedSongForLoop = (index) => {
    if (!videoId) return;
    updateLoopMeta(index, { youtubeVideoId: videoId, title: videoTitle, artist });
    showNotification(`Section ${index + 1} set to loaded song`, 'success');
  };

  const moveLoop = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === loops.length - 1) return;
    const newLoops = [...loops];
    const target = direction === 'up' ? index - 1 : index + 1;
    [newLoops[index], newLoops[target]] = [newLoops[target], newLoops[index]];
    setLoops(newLoops);
    // Reset tracking to start of first loop
    currentLoopIndexRef.current = 0;
    setCurrentLoopIndex(0);
    currentLoopIterationRef.current = 0;
    setCurrentLoopIteration(0);
  };

  const updateLoop = (index, field, value) => {
  const newLoops = [...loops];
  const numValue = Number(value);
  
  if (field === 'start') {
    // Clamp start to actual video duration so sliders never exceed the real video
    newLoops[index].start = Math.max(0, Math.min(numValue, videoDuration - 1));
    if (newLoops[index].end <= newLoops[index].start) {
      newLoops[index].end = Math.min(newLoops[index].start + 30, videoDuration);
    }
    if (newLoops[index].end - newLoops[index].start > 45) {
      newLoops[index].end = newLoops[index].start + 45;
    }
  } else if (field === 'end') {
    newLoops[index].end = Math.max(newLoops[index].start + 1, Math.min(numValue, videoDuration));
    if (newLoops[index].end - newLoops[index].start > 45) {
      newLoops[index].end = newLoops[index].start + 45;
    }
  }
  
  setLoops(newLoops);
  
  // CRITICAL FIX: Seek IMMEDIATELY on every slider change
  if (playerRef.current && playerRef.current.seekTo) {
    const seekTime = numValue;
    try {
      playerRef.current.seekTo(seekTime, true);
      console.log(`✅ INSTANT SEEK to ${seekTime}s (${field})`);
    } catch (error) {
      console.log('Seek error (normal):', error.message);
    }
  }
};

  const removeLoop = (index) => {
    if (loops.length === 1) return;
    setLoops(loops.filter((_, i) => i !== index));
    if (currentLoopIndex >= loops.length - 1) setCurrentLoopIndex(0);
  };

  // Download removed — yt-dlp/ffmpeg not available in serverless deployment (Vercel).

  // Update handlePostToFeed function (around line 740):
  
  const handlePostToFeed = async () => {
  setGlobalLoading(true);
  try {
  if (!videoId) {
    showNotification('Load a song first!', 'error');
    return;
  }
  if (!user?.uid) {
    showNotification('Sign in to post!', 'error');
    setShowAuthModal(true);
    return;
  }

  // Validate loops
  if (!loops || loops.length === 0) {
    showNotification('No loops to post!', 'error');
    return;
  }

  const clipData = {
    title: videoTitle,
    artist,
    youtubeVideoId: videoId,
    // Save ALL loops with their individual loopCount
    loops: loops.map(loop => {
      const { _showMixPanel, ...data } = loop;
      return {
        ...data,
        start: Number(loop.start),
        end: Number(loop.end),
        loopCount: loop.loopCount ?? 1
      };
    }),
    userId: user?.uid,
    createdBy: user.displayName,
    likes: 0,
    plays: 0,
    shares: 0,
    isPublic: false,  // PRIVATE BY DEFAULT
    createdAt: new Date()
  };

  console.log('Posting clip with data:', clipData);

  let attempts = 0;
  let lastError;
  while (attempts < 2) {
    try {
      const { createClip } = await import('../lib/firebase');
      await createClip(clipData);
      showNotification(`✅ Clip posted! Toggle it 🌍 Public to share in the feed.`, 'success');
      setPendingAction(null);
      // Force myClips to refresh (subscribeToUserClips should catch it, but trigger manually as backup)
      if (user?.uid) {
        import('../lib/firebase').then(({ subscribeToUserClips }) => {
          subscribeToUserClips(user.uid, (clips) => setMyClips(clips));
        });
      }
      return;
    } catch (error) {
      lastError = error;
      attempts++;
      if (attempts < 2) await new Promise(r => setTimeout(r, 1500));
    }
  }
  console.error('Post error after retry:', lastError);
  showNotification('Failed to post — check your connection or disable ad blocker', 'error');
  } finally {
    setGlobalLoading(false);
  }
};

  const handleLikeClip = async (clipId) => {
    if (!user?.uid) {
      showNotification('Sign in to like clips!', 'error');
      setShowAuthModal(true);
      return;
    }

    if (user.likedClips?.includes(clipId)) {
      showNotification('You already liked this clip!', 'info');
      return;
    }
    
    try {
      const { db } = await import('../lib/firebase');
      const { doc, updateDoc, increment, setDoc, arrayUnion } = await import('firebase/firestore');
      
      await updateDoc(doc(db, 'clips', clipId), {
        likes: increment(1)
      });

      await setDoc(doc(db, 'userLikes', user?.uid), {
        likedClips: arrayUnion(clipId)
      }, { merge: true });

      setUser(prev => ({
        ...prev,
        likedClips: [...(prev.likedClips || []), clipId]
      }));
      updateClipStatInLists(clipId, 'likes', 1);

      showNotification('❤️ Clip liked!', 'success');
    } catch (error) {
      showNotification('Failed to like. Check your permissions.', 'error');
      console.error('Like error:', error);
    }
  };


  const handleShareClip = async (clip) => {
    const shareUrl = `${window.location.origin}?clip=${clip.id}`;
    const shareText = `Check out this ${clip.title} loop on ChorusClip!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: clip.title,
          text: shareText,
          url: shareUrl
        });
        
        const { db } = await import('../lib/firebase');
        const { doc, updateDoc, increment } = await import('firebase/firestore');
        await updateDoc(doc(db, 'clips', clip.id), {
          shares: increment(1)
        });
        
        showNotification('📤 Shared!', 'success');
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Share error:', error);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        showNotification('🔗 Link copied to clipboard!', 'success');
      } catch (error) {
        showNotification('Failed to copy link', 'error');
      }
    }
  };

  const handleDeleteClip = async (clipId) => {
  if (!user?.uid) {
    showNotification('Sign in to delete clips!', 'error');
    return;
  }

  const confirmDelete = window.confirm('Delete this clip? This cannot be undone.');
  if (!confirmDelete) return;

  try {
    const { db } = await import('../lib/firebase');
    const { doc, deleteDoc, getDoc } = await import('firebase/firestore');
    
    // Check if user owns this clip
    const clipDoc = await getDoc(doc(db, 'clips', clipId));
    if (!clipDoc.exists()) {
      showNotification('Clip not found', 'error');
      return;
    }
    
    const clipData = clipDoc.data();
    if (clipData.userId !== user?.uid) {
      showNotification('You can only delete your own clips!', 'error');
      return;
    }
    
    await deleteDoc(doc(db, 'clips', clipId));
    showNotification('🗑️ Clip deleted!', 'success');
  } catch (error) {
    console.error('Delete error:', error);
    showNotification('Failed to delete clip', 'error');
  }
};

const handleUnlikeClip = async (clipId) => {
  if (!user?.uid) return;
  
  try {
    const { db } = await import('../lib/firebase');
    const { doc, updateDoc, increment, arrayRemove, setDoc } = await import('firebase/firestore');
    
    await updateDoc(doc(db, 'clips', clipId), {
      likes: increment(-1)
    });

    await setDoc(doc(db, 'userLikes', user?.uid), {
      likedClips: arrayRemove(clipId)
    }, { merge: true });

    setUser(prev => ({
      ...prev,
      likedClips: (prev.likedClips || []).filter(id => id !== clipId)
    }));
    updateClipStatInLists(clipId, 'likes', -1);

    showNotification('💔 Unliked!', 'info');
  } catch (error) {
    console.error('Unlike error:', error);
  }
};
  const handleSignOut = async () => {
    try {
      setSelectedClipsForPlaylist([]);
      setPlaylistQueue([]);
      playlistQueueRef.current = [];
      setPlaylistQueueIndex(0);
      playlistQueueIndexRef.current = 0;
      setIsPlayingQueue(false);
      setCurrentPlaylistInfo(null);
      if (currentPlaylistPlayerRef.current) {
        currentPlaylistPlayerRef.current.stop();
        currentPlaylistPlayerRef.current = null;
      }
      setCurrentPlaylistPlayer(null);
      setIsPlayingPlaylist(false);

      const { auth } = await import('../lib/firebase');
      const { signOut } = await import('firebase/auth');
      await signOut(auth);
      setUser({
        uid: null,
        displayName: 'Guest',
        email: '',
        accountCreatedDaysAgo: 0,
        likedClips: []
      });
      showNotification('✅ Signed out successfully!', 'success');
    } catch (error) {
      showNotification('❌ Sign out failed', 'error');
    }
  };

  const handleChangeUsername = async () => {
  if (!user?.uid) {
    showNotification('Please sign in first!', 'error');
    return;
  }

  const changesUsed = user.usernameChanges ?? 0;
  const remaining = USERNAME_CHANGE_QUOTA - changesUsed;
  if (remaining <= 0) {
    showNotification(`Username can only be changed ${USERNAME_CHANGE_QUOTA} times total. Limit reached.`, 'error');
    return;
  }

  const newName = prompt(`Enter new display name (3-20 chars, alphanumeric/underscore/spaces).\nChanges remaining after this: ${remaining - 1}/${USERNAME_CHANGE_QUOTA}`);
  if (!newName?.trim()) return;
  const trimmed = newName.trim();
  if (trimmed.length < 3 || trimmed.length > 20) {
    showNotification('Name must be 3-20 characters.', 'error');
    return;
  }
  if (!/^[a-zA-Z0-9_ ]+$/.test(trimmed)) {
    showNotification('Only letters, numbers, underscores and spaces allowed.', 'error');
    return;
  }

  try {
    const { db } = await import('../lib/firebase');
    const { doc, updateDoc, collection, query, where, getDocs, writeBatch, increment } = await import('firebase/firestore');

    // Check uniqueness
    const existingQuery = query(collection(db, 'users'), where('displayName', '==', trimmed));
    const existingSnap = await getDocs(existingQuery);
    if (!existingSnap.empty && existingSnap.docs[0].id !== user.uid) {
      showNotification('That username is taken. Choose another.', 'error');
      return;
    }

    await updateDoc(doc(db, 'users', user.uid), {
      displayName: trimmed,
      usernameChanges: increment(1)
    });

    const clipsQuery = query(collection(db, 'clips'), where('userId', '==', user.uid));
    const clipsSnapshot = await getDocs(clipsQuery);
    const batch = writeBatch(db);
    clipsSnapshot.docs.forEach((clipDoc) => {
      batch.update(clipDoc.ref, { createdBy: trimmed });
    });
    await batch.commit();

    setUser(prev => ({ ...prev, displayName: trimmed, usernameChanges: changesUsed + 1 }));
    showNotification(`Username updated! ${remaining - 1} change(s) remaining.`, 'success');
  } catch (error) {
    console.error('Username update error:', error);
    showNotification('Failed to update username', 'error');
  }
};
  useEffect(() => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    if (firstScriptTag?.parentNode) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => console.log('YouTube API Ready');

    return () => {
      stopTimeTracking();
      if (playerRef.current?.destroy) playerRef.current.destroy();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const seekTimeout = seekTimeoutRef.current;
      if (seekTimeout) clearTimeout(seekTimeout);
    };
  }, []); 

  // Media Session API — enables lock screen playback controls on mobile
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: videoTitle || 'ChorusClip',
      artist: artist || '',
      album: 'ChorusClip',
    });

    navigator.mediaSession.setActionHandler('play', () => {
      playerRef.current?.playVideo?.();
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      playerRef.current?.pauseVideo?.();
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      if (currentPlaylistPlayerRef.current) {
        currentPlaylistPlayerRef.current.previous?.();
      } else {
        handleLoopRestart();
      }
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      if (currentPlaylistPlayerRef.current) {
        currentPlaylistPlayerRef.current.skip?.();
      }
    });

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying, videoTitle, artist]);

const publicPlaylistShowcase = buildPublicPlaylistShowcase(publicPlaylists);
  const feedIsMostPlayed = feedSort === 'most-played';
  const filteredClips = clipSearchQuery
    ? clips.filter(c => fuzzyMatch(clipSearchQuery, c))
    : clips;
  const topPlayCounts = [...clips].sort((a,b)=>(b.plays||0)-(a.plays||0)).slice(0,3).map(c=>c.id);
  const visibleFeedClips = feedIsMostPlayed
    ? trendingByPlays.slice(0, 5)
    : (feedExpanded ? filteredClips.slice(0, feedPage * FEED_PAGE_SIZE) : filteredClips.slice(0, 5));
  
  return (
    <div className={`min-h-screen text-white relative overflow-hidden ${themeMode === 'electric' ? 'theme-electric' : 'theme-classic'}`}>
    <BackgroundAmbience theme={themeMode === 'electric' ? 'gold' : 'purple'} />

    {/* Global loading overlay */}
    {globalLoading && (
      <div className="fixed inset-0 z-[100] bg-black bg-opacity-60 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-auto cursor-wait">
        {/* Outer ring */}
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-purple-800 border-opacity-30" />
          <div className="absolute inset-0 rounded-full border-4 border-t-purple-400 border-r-pink-400 border-b-transparent border-l-transparent animate-spin" />
          <div className="absolute inset-2 rounded-full border-4 border-t-transparent border-r-transparent border-b-yellow-400 border-l-purple-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
          {/* Music note at center */}
          <div className="absolute inset-0 flex items-center justify-center text-2xl">🎵</div>
        </div>
        <p className="text-purple-300 text-sm font-semibold mt-4 animate-pulse">
          {pendingAction === 'post' ? 'Posting clip...' : 'Loading...'}
        </p>
      </div>
    )}
    
     {/* Skip to main content link for screen readers */}
    <a 
      href="#main-content" 
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-purple-600 focus:rounded"
    >
      Skip to main content
    </a>
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-40 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

<style jsx>{`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

* { 
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  letter-spacing: -0.01em;
}

h1, h2, h3 {
  font-weight: 800;
  letter-spacing: -0.02em;
}

/* PRIMARY BUTTON */
.btn-primary {
  background: rgba(255, 255, 255, 0.95);
  color: #1a1a1a;
  border: none;
  padding: 14px 32px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(0, 0, 0, 0.1);
}

.btn-primary:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05), 0 8px 24px rgba(0, 0, 0, 0.15);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 14px 32px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.btn-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 14px 32px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(16, 185, 129, 0.2), 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2), 0 8px 24px rgba(16, 185, 129, 0.4);
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  padding: 14px 32px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(239, 68, 68, 0.2), 0 4px 12px rgba(239, 68, 68, 0.3);
}

.card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
@media (min-width: 1280px) {
  .card { padding: 28px; }
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.1), 0 16px 32px rgba(0, 0, 0, 0.15);
  border-color: rgba(255, 255, 255, 0.25);
}

.input {
  width: 100%;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 14px 18px;
  font-size: 15px;
  color: white;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  font-weight: 500;
}

.input::placeholder { color: rgba(255, 255, 255, 0.5); }

.input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.4);
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.1);
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  padding: 6px 14px;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

@keyframes blob {
  0%, 100% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
}
.animate-blob { animation: blob 7s infinite; }
.animation-delay-2000 { animation-delay: 2s; }
.animation-delay-4000 { animation-delay: 4s; }
`}</style>

      {notification && (
        <Notification 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}

      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)}
          onSuccess={(msg) => {
            showNotification(msg, 'success');
            checkAuthState();
          }}
        />
      )}


{showTutorial && <TutorialModal onClose={() => setShowTutorial(false)} />}

{showFriendsPanel && (
  <FriendsPanel
    user={user}
    onClose={() => setShowFriendsPanel(false)}
    onPlayClip={handlePlayClip}
    showNotification={showNotification}
  />
)}
      {showMostReplayedSuggestion && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-3xl p-8 max-w-md w-full border border-purple-500">
            <h3 className="text-3xl font-bold mb-4">Smart Loop Suggestion!</h3>
            <p className="text-purple-200 mb-2 text-xl">Suggested section: {Math.floor(suggestedStart/60)}:{(suggestedStart%60).toString().padStart(2,'0')} - {Math.floor(suggestedEnd/60)}:{(suggestedEnd%60).toString().padStart(2,'0')}</p>
            <p className="text-base text-purple-300 mb-6">This is typically where the chorus/hook is. You can adjust using the sliders below.</p>
            <div className="space-y-3">
              <button onClick={applySuggestedLoop} 
className="btn-primary w-full py-5 text-xl">
                Use This Section
              </button>
              <button onClick={dismissSuggestion} className="w-full py-4 text-lg bg-purple-800 bg-opacity-50 rounded-xl hover:bg-opacity-70 transition">
                I&apos;ll Choose Manually
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PLAYLIST MANAGEMENT MODAL */}
      {managingPlaylist && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-3xl p-6 max-w-lg w-full border border-purple-500 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div className="flex-1 mr-3">
                <h2 className="text-2xl font-bold truncate">{managingPlaylist.name}</h2>
                <p className="text-sm text-purple-400">{managingPlaylist.clips?.length || 0}/10 clips</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleRenamePlaylist(managingPlaylist)}
                  className="px-3 py-2 bg-purple-700 hover:bg-purple-600 rounded-xl text-sm font-semibold transition">
                  Rename
                </button>
                <button onClick={() => setManagingPlaylist(null)}
                  className="text-white hover:text-purple-300">
                  <X size={28} />
                </button>
              </div>
            </div>

            {/* Public / Private toggle */}
            <div className="flex items-center justify-between bg-purple-900 bg-opacity-30 px-4 py-3 rounded-xl mb-3">
              <div>
                <p className="font-semibold text-sm">Visibility</p>
                <p className="text-xs text-purple-400 mt-0.5">
                  {managingPlaylist.isPublic !== false ? '🌍 Public  anyone can discover this' : '🔒 Private  only you'}
                </p>
              </div>
              <button
                onClick={async () => {
                  const newVal = !(managingPlaylist.isPublic !== false);
                  try {
                    const { updatePlaylist } = await import('../lib/firebase');
                    const updates = { isPublic: newVal, isFeatured: newVal ? managingPlaylist.isFeatured : false };
                    await updatePlaylist(managingPlaylist.id, updates);
                    setManagingPlaylist(prev => prev ? { ...prev, ...updates } : null);
                    loadUserPlaylists();
                    loadPublicPlaylists();
                    showNotification(newVal ? '🌍 Now public' : '🔒 Now private', 'success');
                  } catch (e) {
                    showNotification('Failed to update', 'error');
                  }
                }}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shrink-0 ${managingPlaylist.isPublic !== false ? 'bg-emerald-500' : 'bg-purple-700'}`}
                aria-label="Toggle playlist visibility"
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${managingPlaylist.isPublic !== false ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between bg-purple-900 bg-opacity-20 px-4 py-3 rounded-xl mb-3">
              <div>
                <p className="font-semibold text-sm">Public showcase slot</p>
                <p className="text-xs text-purple-400 mt-0.5">
                  {managingPlaylist.isFeatured ? 'Pinned as a featured public pick' : 'Optional extra slot you can deliberately promote'}
                </p>
              </div>
              <button
                onClick={async () => {
                  const nextFeatured = !managingPlaylist.isFeatured;
                  try {
                    const { updatePlaylist } = await import('../lib/firebase');
                    const updates = {
                      isFeatured: nextFeatured,
                      isPublic: nextFeatured ? true : managingPlaylist.isPublic
                    };
                    await updatePlaylist(managingPlaylist.id, updates);
                    setManagingPlaylist(prev => prev ? { ...prev, ...updates } : null);
                    loadUserPlaylists();
                    loadPublicPlaylists();
                    showNotification(nextFeatured ? '⭐ Featured on public showcase' : 'Featured showcase removed', 'success');
                  } catch (e) {
                    showNotification('Failed to update showcase slot', 'error');
                  }
                }}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shrink-0 ${managingPlaylist.isFeatured ? 'bg-yellow-500' : 'bg-purple-700'}`}
                aria-label="Toggle featured public showcase slot"
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${managingPlaylist.isFeatured ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Sort controls */}
            {(managingPlaylist.clips?.length || 0) > 1 && (
              <div className="mb-3">
                <p className="text-xs font-bold text-purple-400 uppercase tracking-wide mb-2">Sort by</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'A → Z', key: 'artist-asc' },
                    { label: 'Z → A', key: 'artist-desc' },
                    { label: 'Title A-Z', key: 'title-asc' },
                    { label: 'Oldest first', key: 'date-asc' },
                    { label: 'Newest first', key: 'date-desc' },
                  ].map(({ label, key }) => (
                    <button key={key} onClick={() => handleSortPlaylist(managingPlaylist, key)}
                      className="px-3 py-1.5 bg-purple-800 bg-opacity-50 hover:bg-opacity-80 rounded-lg text-xs font-semibold transition">
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2 mb-5">
              {(managingPlaylist.clips || []).length === 0 ? (
                <p className="text-center text-purple-400 py-6">No songs in this playlist yet.</p>
              ) : (managingPlaylist.clips || []).map((clip, idx) => (
                <div key={idx} className="flex items-center justify-between bg-purple-900 bg-opacity-40 px-4 py-3 rounded-xl">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="font-semibold truncate">{idx + 1}. {clip.title}</p>
                    <p className="text-sm text-purple-300 truncate">{clip.artist}</p>
                  </div>
                  <button onClick={() => handleRemoveClipFromPlaylist(managingPlaylist, idx)}
                    className="text-red-400 hover:text-red-300 flex-shrink-0">
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>

            <button onClick={() => handleDeletePlaylist(managingPlaylist.id)}
              className="w-full py-3 bg-red-700 hover:bg-red-600 rounded-xl font-semibold text-white transition">
              Delete Playlist
            </button>
          </div>
        </div>
      )}

      {/* CREATE / ADD-TO-EXISTING PLAYLIST MODAL */}
      {showPlaylistModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-3xl p-8 max-w-2xl w-full border border-purple-500 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowPlaylistModal(false)} className="float-right text-white hover:text-purple-300">
              <X size={32} />
            </button>

            <h2 className="text-3xl font-bold mb-4">Add {selectedClipsForPlaylist.length} Clip{selectedClipsForPlaylist.length !== 1 ? 's' : ''}</h2>

            <div className="bg-purple-900 bg-opacity-30 p-4 rounded-xl max-h-44 overflow-y-auto mb-5">
              {selectedClipsForPlaylist.map((clip, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-purple-700 last:border-0">
                  <div className="flex-1 min-w-0 mr-2">
                    <p className="font-semibold truncate">{idx + 1}. {clip.title}</p>
                    <p className="text-sm text-purple-300 truncate">{clip.artist}</p>
                  </div>
                  <button onClick={() => setSelectedClipsForPlaylist(selectedClipsForPlaylist.filter((_, i) => i !== idx))}
                    className="text-red-400 hover:text-red-300">
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add to existing playlist */}
            {playlists.length > 0 && (
              <div className="mb-5">
                <p className="font-bold text-purple-300 mb-2 text-sm uppercase tracking-wide">Add to existing playlist</p>
                <div className="space-y-2">
                  {playlists.map(pl => (
                    <button key={pl.id} onClick={() => handleAddToExistingPlaylist(pl)}
                      disabled={(pl.clips?.length || 0) >= 10}
                      className={`w-full flex justify-between items-center px-4 py-3 rounded-xl font-semibold transition text-left ${(pl.clips?.length || 0) >= 10 ? 'opacity-40 cursor-not-allowed bg-purple-900 bg-opacity-20' : 'bg-purple-800 bg-opacity-40 hover:bg-opacity-60'}`}>
                      <span>{pl.name}</span>
                      <span className="text-sm text-purple-400">{pl.clips?.length || 0}/10</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-purple-700 pt-5">
              <p className="font-bold text-purple-300 mb-2 text-sm uppercase tracking-wide">Create new playlist</p>
              <input type="text" id="playlist-name-input"
                placeholder="Playlist name (e.g. 'Vibes Only')"
                className="input mb-3" />
              <button onClick={handleCreatePlaylist} className="btn-primary w-full py-4 text-lg">
                Create Playlist
              </button>
            </div>
          </div>
        </div>
      )}
<header className="border-b border-purple-700 border-opacity-50 bg-black bg-opacity-20 backdrop-blur-md relative z-10 sticky top-0">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
    <div className="flex items-center justify-between gap-2">
      {/* Logo */}
      <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent tracking-tight shrink-0">
        ChorusClip
      </h1>

      {/* Right-side actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
        {user?.uid ? (
          <>
            {/* Friends button — icon only on mobile */}
            <button
              onClick={() => setShowFriendsPanel(true)}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-purple-800 bg-opacity-50 hover:bg-opacity-80 transition flex items-center gap-1.5 text-sm font-semibold shrink-0"
              aria-label="Friends"
            >
              <UserPlus size={18} />
              <span className="hidden sm:inline">Friends</span>
            </button>

            {/* Theme toggle */}
            <button
              onClick={handleThemeToggle}
              className="p-2 rounded-xl bg-purple-800 bg-opacity-50 hover:bg-opacity-80 transition text-sm shrink-0"
              title={themeMode === 'electric' ? 'Switch to Classic' : 'Switch to Electric'}
              aria-label="Toggle theme"
            >
              {themeMode === 'electric' ? '⚡' : '💜'}
            </button>

            {/* User info — avatar + username edit on desktop; hidden on mobile */}
            <div className="hidden sm:flex items-center gap-2 min-w-0">
              {/* Avatar — static initial circle */}
              <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0">
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-black">
                  {(user.displayName || 'U')[0].toUpperCase()}
                </div>
              </div>
              {/* Username — click to edit */}
              <button
                onClick={handleChangeUsername}
                className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-white bg-opacity-10 hover:bg-opacity-15 transition min-w-0"
                aria-label="Change username"
                title={`${USERNAME_CHANGE_QUOTA - (user.usernameChanges ?? 0)} change(s) remaining`}
              >
                <span className="text-sm font-semibold truncate max-w-[120px]">{user.displayName}</span>
                <span className="text-xs text-purple-300 shrink-0">Edit</span>
              </button>
            </div>

            {/* Mobile: static avatar initial circle */}
            <div className="sm:hidden w-9 h-9 rounded-full overflow-hidden shrink-0">
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-black">
                {(user.displayName || 'U')[0].toUpperCase()}
              </div>
            </div>

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              className="p-2 sm:px-4 sm:py-2 bg-red-600 hover:bg-red-700 rounded-xl font-semibold transition flex items-center gap-1 shrink-0"
              aria-label="Sign out"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline text-sm">Sign Out</span>
            </button>
          </>
        ) : (
          <>
            {/* "Strathmore Exclusive" badge — hidden on mobile to save space */}
            <span className="hidden sm:inline-block text-xs bg-purple-700 bg-opacity-50 backdrop-blur px-3 py-1.5 rounded-full border border-purple-500 font-semibold whitespace-nowrap">
              Strathmore Exclusive
            </span>
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-4 py-2 text-sm sm:text-base bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold hover:shadow-lg transition shrink-0"
              aria-label="Sign in to ChorusClip"
            >
              Sign In
            </button>
          </>
        )}
      </div>
    </div>
  </div>
</header>

      {/* Main content */}
      <div className="main-content-area max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10 pb-28">
  <div className="flex flex-col xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 xl:gap-10 xl:items-start">
    {/* YouTube player container — always in DOM so handlePlayPlaylist can create
        a YT.Player immediately without waiting for a React re-render.
        Kept outside all tab-hidden containers so audio keeps playing on every
        mobile tab. Visually hidden; audio plays through the hidden iframe. */}
    <div id="youtube-player" style={{position:'fixed',top:'-9999px',width:'2px',height:'2px',overflow:'hidden'}} aria-hidden="true"></div>
    {/* LEFT COLUMN - Create Loop */}
    <div className={`space-y-6 ${mobileTab !== 'create' && mobileTab !== 'more' ? 'hidden md:block' : ''}`}>
            <div className={mobileTab === 'more' ? 'hidden md:block' : ''}>
            <div 
className="card">          
<div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-black tracking-tight">Create Clip</h2>
                <button onClick={() => setShowTutorial(true)} className="text-purple-400 hover:text-purple-300 transition flex items-center gap-2 text-base">
                  <Video size={22} /> Help
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-base font-bold text-purple-300 mb-2">YouTube URL</label>
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
                    placeholder="https://youtube.com/watch?v=..."
className="input"/>
                </div>
                <button
                  onClick={handleUrlSubmit}
                  disabled={globalLoading}
                  className="btn-primary w-full py-5 text-xl disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {globalLoading ? (
                    <><span className="w-5 h-5 border-2 border-gray-800 border-t-transparent rounded-full animate-spin" /> Loading…</>
                  ) : 'Load Song'}
                </button>
              </div>

              {videoId && (
                <div className="mt-6 space-y-6">

<div className="relative">
  <AudioVisualizer
    isPlaying={isPlaying}
    currentTime={playerCurrentTime}
    loopDuration={loops[currentLoopIndex]?.end - loops[currentLoopIndex]?.start || 30}
    title={videoTitle}
  />
</div>
{/*   
<div className="w-full aspect-video bg-gradient-to-br from-purple-900 to-pink-900 rounded-2xl flex items-center justify-center border border-purple-700">
  <div className="text-center">
    <Music size={64} className="mx-auto mb-4 text-purple-400" />
    <p className="text-xl font-bold">Audio Only Mode</p>
    <p className="text-purple-300">Video hidden to maintain focus</p>
  </div>
</div>                   */}
                  {videoTitle && (
                    <div className="text-center">
                      <p className="font-bold text-2xl">{videoTitle}</p>
                      <p className="text-purple-300 text-xl">{artist}</p>
                      <div className="mt-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-6 py-3 rounded-xl text-center">
  <p className="text-sm font-bold uppercase tracking-wide">Live Playback</p>
  <p className="text-3xl font-black">
    {Math.floor(playerCurrentTime/60)}:{Math.floor(playerCurrentTime%60).toString().padStart(2,'0')}
  </p>
</div>
                    </div>
                  )}

                  {/* Read-only banner when playing from feed */}
                  {isReadOnlyMode && (
                    <div className="flex items-center justify-between bg-yellow-900 bg-opacity-40 border border-yellow-600 rounded-xl px-4 py-3">
                      <p className="text-yellow-300 text-sm font-semibold">Playing from feed — load your own URL to edit sections</p>
                      <button
                        onClick={() => setIsReadOnlyMode(false)}
                        className="text-yellow-400 hover:text-yellow-200 text-xs ml-3 underline"
                      >Unlock</button>
                    </div>
                  )}

                  {loops.map((loop, idx) => (
                    <div key={idx} className={`p-6 rounded-2xl border border-opacity-60 ${
                      idx === currentLoopIndex && isPlaying
                        ? 'border-pink-500'
                        : (loop.youtubeVideoId && loop.youtubeVideoId !== videoId)
                        ? 'border-yellow-500 border-opacity-50'
                        : 'border-purple-700'
                    } ${
                      (loop.youtubeVideoId && loop.youtubeVideoId !== videoId)
                        ? 'bg-gradient-to-br from-yellow-900 via-amber-900 to-orange-900 bg-opacity-40'
                        : 'bg-purple-900 bg-opacity-30'
                    }`}>
                      {/* Section header — always visible, tap to expand/collapse */}
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <button
                          onClick={() => setExpandedSections(prev =>
                            prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
                          )}
                          className="flex items-center gap-2 flex-1 min-w-0 text-left"
                          aria-expanded={expandedSections.includes(idx)}
                        >
                          <h4 className="font-bold text-xl">
                            Section {idx + 1}
                            {idx === currentLoopIndex && isPlaying && (
                              <span className="ml-2 text-sm text-pink-400 font-semibold animate-pulse">▶ Playing</span>
                            )}
                          </h4>
                          {!expandedSections.includes(idx) && (
                            <span className="text-xs text-purple-400">
                              {Math.floor(loop.start/60)}:{(loop.start%60).toString().padStart(2,'0')}–{Math.floor(loop.end/60)}:{(loop.end%60).toString().padStart(2,'0')} · {loop.loopCount === 0 ? '∞' : `${loop.loopCount}×`}
                            </span>
                          )}
                          <span className="text-purple-400 text-sm ml-auto shrink-0">{expandedSections.includes(idx) ? '▲' : '▼'}</span>
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Reorder buttons */}
                          {!isReadOnlyMode && loops.length > 1 && (
                            <>
                              <button
                                onClick={() => moveLoop(idx, 'up')}
                                disabled={idx === 0}
                                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-purple-800 bg-opacity-50 hover:bg-opacity-80 active:scale-95 disabled:opacity-20 transition text-purple-200 text-lg"
                                title="Move section up"
                                aria-label="Move section up"
                              >▲</button>
                              <button
                                onClick={() => moveLoop(idx, 'down')}
                                disabled={idx === loops.length - 1}
                                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-purple-800 bg-opacity-50 hover:bg-opacity-80 active:scale-95 disabled:opacity-20 transition text-purple-200 text-lg"
                                title="Move section down"
                                aria-label="Move section down"
                              >▼</button>
                            </>
                          )}
                          {!isReadOnlyMode && loops.length > 1 && (
                            <button onClick={() => removeLoop(idx)} className="text-red-400 hover:text-red-300 transition ml-1">
                              <X size={28} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Collapsible body */}
                      {expandedSections.includes(idx) && (
                      <>
                      {/* Mix song display — prominent when this section plays a different song */}
                      {loop.youtubeVideoId && loop.youtubeVideoId !== videoId && (
                        <div className="mb-3 flex items-center gap-2 bg-yellow-500 bg-opacity-10 border border-yellow-500 border-opacity-30 rounded-xl px-3 py-2">
                          <span className="text-yellow-400 text-lg">🎵</span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-yellow-400 uppercase tracking-wide">Mix Song</p>
                            <p className="text-sm font-semibold text-white truncate">{loop.title || loop.youtubeVideoId}</p>
                            {loop.artist && <p className="text-xs text-yellow-300 truncate">{loop.artist}</p>}
                          </div>
                          {!isReadOnlyMode && (
                            <button
                              onClick={() => {
                                const newLoops = [...loops];
                                const { youtubeVideoId, title, artist, ...rest } = newLoops[idx];
                                newLoops[idx] = rest;
                                setLoops(newLoops);
                                showNotification('Mix section cleared', 'info');
                              }}
                              className="ml-auto text-yellow-500 hover:text-red-400 transition text-xs shrink-0"
                            >
                              ✕ Clear
                            </button>
                          )}
                        </div>
                      )}

                      {/* Per-section repeat count */}
                      <div className="mb-5">
                        <label className="block text-base font-bold text-purple-300 mb-2">
                          Repeats for this section
                          <span className="text-xs text-purple-500 ml-2 font-normal">(Infinite = 5× in playlists)</span>
                        </label>
                        <select
                          value={loop.loopCount ?? 1}
                          onChange={(e) => !isReadOnlyMode && updateLoopCount(idx, e.target.value)}
                          disabled={isReadOnlyMode}
                          className="btn-secondary px-4 py-3 text-sm disabled:opacity-60"
                          aria-label={`Repeat count for section ${idx + 1}`}
                        >
                          <option value={0}>Infinite (caps at 5×)</option>
                          <option value={1}>1×</option>
                          <option value={2}>2×</option>
                          <option value={3}>3×</option>
                          <option value={5}>5×</option>
                          <option value={10}>10×</option>
                        </select>
                        {idx === currentLoopIndex && isPlaying && (loop.loopCount ?? 1) > 0 && currentLoopIteration > 0 && (
                          <span className="ml-3 text-purple-300 text-sm">
                            {currentLoopIteration}/{loop.loopCount}
                          </span>
                        )}
                      </div>

<div className="space-y-6">
  {/* START TIME */}
  <div>
    <label className="block text-lg font-bold text-purple-300 mb-3">
      Start: {Math.floor(loop.start/60)}:{(loop.start%60).toString().padStart(2,'0')}
    </label>

    <input
      type="range"
      min="0"
      max={videoDuration}
      step="1"
      value={loop.start}
      onChange={(e) => !isReadOnlyMode && updateLoop(idx, 'start', e.target.value)}
      disabled={isReadOnlyMode}
      className="w-full mb-2 disabled:opacity-50"
    />

    {!isReadOnlyMode && (
      <div className="flex gap-2 items-center">
        <input
          type="number"
          min="0"
          max="10"
          placeholder="Min"
          className="w-20 px-3 py-2 bg-purple-950 border border-purple-600 rounded-lg text-white"
          onChange={(e) => {
            const minutes = parseInt(e.target.value) || 0;
            const seconds = loop.start % 60;
            updateLoop(idx, 'start', minutes * 60 + seconds);
          }}
        />
        <span className="text-purple-300">:</span>
        <input
          type="number"
          min="0"
          max="59"
          placeholder="Sec"
          className="w-20 px-3 py-2 bg-purple-950 border border-purple-600 rounded-lg text-white"
          onChange={(e) => {
            const minutes = Math.floor(loop.start / 60);
            const seconds = parseInt(e.target.value) || 0;
            updateLoop(idx, 'start', minutes * 60 + seconds);
          }}
        />
        <span className="text-sm text-purple-400 ml-2">Type exact time</span>
      </div>
    )}
  </div>

  {/* END TIME */}
  <div>
    <label className="block text-lg font-bold text-purple-300 mb-3">
      End: {Math.floor(loop.end/60)}:{(loop.end%60).toString().padStart(2,'0')}
      <span className="text-base ml-2 text-yellow-400">
        (Duration: {Math.max(0, loop.end - loop.start)}s / Max 45s)
      </span>
    </label>

    <input
      type="range"
      min={loop.start + 1}
      max={Math.min(videoDuration, loop.start + 45)}
      step="1"
      value={loop.end}
      onChange={(e) => !isReadOnlyMode && updateLoop(idx, 'end', e.target.value)}
      disabled={isReadOnlyMode}
      className="w-full mb-2 disabled:opacity-50"
    />

    {!isReadOnlyMode && (
      <div className="flex gap-2 items-center">
        <input
          type="number"
          min="0"
          max="10"
          placeholder="Min"
          className="w-20 px-3 py-2 bg-purple-950 border border-purple-600 rounded-lg text-white"
          onChange={(e) => {
            const minutes = parseInt(e.target.value) || 0;
            const seconds = loop.end % 60;
            updateLoop(idx, 'end', minutes * 60 + seconds);
          }}
        />
        <span className="text-purple-300">:</span>
        <input
          type="number"
          min="0"
          max="59"
          placeholder="Sec"
          className="w-20 px-3 py-2 bg-purple-950 border border-purple-600 rounded-lg text-white"
          onChange={(e) => {
            const minutes = Math.floor(loop.end / 60);
            const seconds = parseInt(e.target.value) || 0;
            updateLoop(idx, 'end', minutes * 60 + seconds);
          }}
        />
      </div>
    )}
  </div>
  {/* Mix section: different song per section */}
  {!isReadOnlyMode && idx > 0 && (
    <div className="mt-3 border-t border-purple-700 border-opacity-40 pt-3">
      <button
        onClick={() => {
          const newLoops = [...loops];
          newLoops[idx] = {
            ...newLoops[idx],
            _showMixPanel: !newLoops[idx]._showMixPanel
          };
          setLoops(newLoops);
        }}
        className="text-xs text-purple-400 hover:text-purple-200 font-semibold flex items-center gap-1 transition"
      >
        {loops[idx].youtubeVideoId && loops[idx].youtubeVideoId !== videoId
          ? `Mix: ${loops[idx].title || loops[idx].youtubeVideoId}`
          : '+ Use a different song for this section'}
      </button>

      {loops[idx]._showMixPanel && (
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            <input
              id={`mix-url-${idx}`}
              type="text"
              placeholder="YouTube URL for this section..."
              className="flex-1 px-3 py-2 bg-black bg-opacity-40 border border-yellow-600 rounded-xl text-sm text-white placeholder-yellow-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              defaultValue={loops[idx].youtubeVideoId && loops[idx].youtubeVideoId !== videoId ? `https://youtube.com/watch?v=${loops[idx].youtubeVideoId}` : ''}
            />
            <button
              onClick={() => {
                const input = document.getElementById(`mix-url-${idx}`);
                const url = input?.value?.trim();
                if (!url) {
                  const newLoops = [...loops];
                  const { youtubeVideoId, title, artist, _showMixPanel, ...rest } = newLoops[idx];
                  newLoops[idx] = { ...rest, _showMixPanel: true };
                  setLoops(newLoops);
                  return;
                }
                const newVideoId = extractVideoId(url);
                if (!newVideoId) { showNotification('Invalid YouTube URL', 'error'); return; }
                const newLoops = [...loops];
                newLoops[idx] = { ...newLoops[idx], youtubeVideoId: newVideoId, title: 'Loading…', artist: '', _showMixPanel: true };
                setLoops(newLoops);
                fetch(`https://www.youtube.com/oembed?url=https://youtube.com/watch?v=${newVideoId}&format=json`)
                  .then(r => r.json())
                  .then(data => {
                    const parts = (data.title || '').split(' - ');
                    const sectionArtist = parts.length > 1 ? parts[0].trim() : data.author_name || '';
                    const sectionTitle = parts.length > 1 ? parts.slice(1).join(' - ').trim() : data.title;
                    setLoops(prev => {
                      const updated = [...prev];
                      updated[idx] = { ...updated[idx], title: sectionTitle, artist: sectionArtist };
                      return updated;
                    });
                  })
                  .catch(() => {});
                showNotification(`✅ Section ${idx + 1} set to a different song`, 'success');
              }}
              className="px-3 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-xl text-sm font-bold text-black transition"
            >
              Set
            </button>
          </div>
          <p className="text-xs text-yellow-600">
            {loops[idx].youtubeVideoId && loops[idx].youtubeVideoId !== videoId
              ? `Currently: ${loops[idx].title || loops[idx].youtubeVideoId}`
              : 'Leave blank to use the same song as Section 1'}
          </p>
        </div>
      )}
    </div>
  )}
  {/* Mobile helper: seek to section start and pause for precise adjustment */}
  {!isReadOnlyMode && (
    <button
      onClick={() => {
        if (playerRef.current?.seekTo) {
          skipTrackingUntilRef.current = Date.now() + 1500;
          playerRef.current.seekTo(loop.start, true);
          playerRef.current.pauseVideo();
          showNotification(
            `🎯 Paused at ${Math.floor(loop.start/60)}:${(loop.start%60).toString().padStart(2,'0')}  adjust sliders, then press Play`,
            'info'
          );
        }
      }}
      className="w-full py-3 mt-2 bg-purple-800 bg-opacity-50 hover:bg-opacity-80 active:scale-95 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
    >
      🎯 Jump to section start &amp; pause
    </button>
  )}
</div>
                      </>
                      )}
                    </div>
                  ))}

                  <div className="flex gap-3 flex-wrap">
                    <button
  onClick={togglePlayPause}
  
className="btn-success flex-1 min-w-[200px] py-5 text-xl flex items-center justify-center gap-2"
 aria-label={isPlaying ? 'Pause playback' : 'Play loop'}
  aria-pressed={isPlaying}
>
  {isPlaying ? <Pause size={28} aria-hidden="true" /> : <Play size={28} aria-hidden="true" />}
  {isPlaying ? 'Pause' : 'Play'}
</button>
{/* // 8. ADD PLAYLIST CONTROLS */}
{isPlayingPlaylist && currentPlaylistInfo && (
  <div className="bg-gradient-to-r from-purple-800 to-pink-800 p-6 rounded-2xl border border-purple-500">
    <p className="text-sm font-bold text-purple-300 mb-2">NOW PLAYING PLAYLIST</p>
    <p className="text-2xl font-black mb-1">{currentPlaylistInfo.name}</p>
    <p className="text-lg text-purple-200 mb-4">
      {currentPlaylistInfo.currentIndex + 1} / {currentPlaylistInfo.total}: {currentPlaylistInfo.currentClip.title}
    </p>
    
    <div className="flex gap-3 flex-wrap">
      <button
        onClick={() => currentPlaylistPlayer?.previous()}
        className="px-5 py-3 bg-purple-700 rounded-xl hover:bg-purple-600 transition"
      >
        <SkipBack size={24} />
      </button>
      
      <button
        onClick={() => currentPlaylistPlayer?.skip()}
        className="px-5 py-3 bg-purple-700 rounded-xl hover:bg-purple-600 transition"
      >
        <SkipForward size={24} />
      </button>
      
      <button
        onClick={() => currentPlaylistPlayer?.toggleShuffle()}
        className={`px-5 py-3 rounded-xl transition ${currentPlaylistPlayer?.isShuffled ? 'bg-pink-600 hover:bg-pink-500' : 'bg-purple-700 hover:bg-purple-600'}`}
        title={currentPlaylistPlayer?.isShuffled ? 'Shuffled – tap to restore order' : 'Shuffle'}
      >
        <Shuffle size={24} />
      </button>
      
      <button
        onClick={() => currentPlaylistPlayer?.toggleRepeat()}
        className={`relative px-5 py-3 rounded-xl transition ${
          currentPlaylistPlayer?.repeatPlaylist 
            ? 'bg-pink-600 hover:bg-pink-500' 
            : 'bg-purple-700 hover:bg-purple-600'
        }`}
      >
        <Repeat size={24} />
        {currentPlaylistPlayer?.repeatPlaylist && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-pink-600 rounded-full text-xs font-black flex items-center justify-center leading-none">
            1
          </span>
        )}
      </button>
      
      <button
        onClick={() => {
          currentPlaylistPlayer?.stop();
          currentPlaylistPlayerRef.current = null;
          setIsPlayingPlaylist(false);
          setCurrentPlaylistInfo(null);
          setCurrentPlaylistPlayer(null);
        }}
        className="px-5 py-3 bg-red-700 rounded-xl hover:bg-red-600 transition"
      >
        Stop Playlist
      </button>
    </div>
  </div>
)}
<button
  onClick={handleLoopRestart}
  className="px-7 py-5 bg-purple-800 bg-opacity-70 hover:bg-opacity-90 rounded-xl transition"
  aria-label="Restart loop from beginning"
>
  <RotateCcw size={28} aria-hidden="true" />
</button>
{!isPlayingPlaylist && (
<button
  onClick={() => setStandaloneLoop(v => !v)}
  className={`px-5 py-5 rounded-xl transition font-bold text-sm ${standaloneLoop ? 'bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-500/40' : 'bg-purple-800 bg-opacity-70 hover:bg-opacity-90'}`}
  aria-label={standaloneLoop ? 'Loop ON  tap to disable' : 'Loop OFF  tap to loop continuously'}
  title={standaloneLoop ? 'Loop ON' : 'Loop OFF'}
>
  <Repeat size={24} />
</button>
)}
                   
                  {/* Download removed — not available in serverless deployment */}
                  </div>

                  {!isReadOnlyMode && (
                  <div className="flex gap-3 flex-wrap">
                    {loops.length < maxLoopsPerSong && (
                      <button
                        onClick={addLoop}
                        className="flex-1 min-w-[200px] py-5 text-lg bg-purple-700 bg-opacity-50 hover:bg-opacity-70 rounded-xl flex items-center justify-center gap-2 font-bold transition"
                      >
                        <Plus size={22} /> Add Section ({loops.length}/{maxLoopsPerSong})
                      </button>
                    )}
                    <button
                      onClick={async () => { setPendingAction('post'); await handlePostToFeed(); setPendingAction(null); }}
                      disabled={pendingAction === 'post'}
                      className="flex-1 min-w-[200px] py-5 text-lg bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl font-bold hover:shadow-xl transition disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {pendingAction === 'post' ? (
                        <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Posting…</>
                      ) : 'Post to Feed'}
                    </button>
                  </div>
                  )}
                </div>
              )}
            </div>
            </div>

            <div className={`${mobileTab !== 'more' ? 'hidden md:block' : ''}`}>
            <div className="bg-black bg-opacity-40 backdrop-blur-xl rounded-3xl p-6 border border-purple-700 border-opacity-50">
              <h3 className="font-black text-xl mb-4 flex items-center gap-2">
                <Sparkles size={24} className="text-yellow-400" />
                Why ChorusClip?
              </h3>
              <div className="bg-black bg-opacity-40 backdrop-blur-xl rounded-3xl p-6 border border-purple-700 border-opacity-50">
  <h3 className="font-black text-xl mb-4 flex items-center gap-2">
    <Users size={24} className="text-purple-400" />
    Who Is This For?
  </h3>
  <ul className="space-y-3 text-base text-purple-200">
    <li className="flex items-start gap-2">
      <span className="text-purple-400 text-lg">🎤</span>
      <span><strong>Choirs:</strong> Master tricky vocal parts by looping specific sections</span>
    </li>
    <li className="flex items-start gap-2">
      <span className="text-purple-400 text-lg">💪</span>
      <span><strong>Workouts:</strong> Loop your most motivating beat drops</span>
    </li>
    <li className="flex items-start gap-2">
      <span className="text-purple-400 text-lg">📚</span>
      <span><strong>Study:</strong> Focus music on repeat without interruption</span>
    </li>
    <li className="flex items-start gap-2">
      <span className="text-purple-400 text-lg">🎵</span>
      <span><strong>Music Lovers:</strong> Obsess over that ONE perfect 6-second kick!</span>
    </li>
  </ul>
</div>
              <ul className="space-y-3 text-base text-purple-200">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 text-lg">✨</span>
                  <span>Auto-detect the chorus/hook section of any song</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 text-lg">🎵</span>
                  <span>Create a <strong>Clip</strong> with up to 3 sections per song, each repeating a custom number of times</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 text-lg">♾️</span>
                  <span><strong>Infinite repeats</strong> cap at 5× inside playlists to keep things moving</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 text-lg">📋</span>
                  <span>Queue up to 10 playlists and play them back-to-back</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 text-lg">👥</span>
                  <span>Add friends by username and see what they&apos;re listening to</span>
                </li>
              </ul>
            </div>

            <div className="bg-black bg-opacity-40 backdrop-blur-xl rounded-3xl p-6 border border-red-700 border-opacity-50">
              <h3 className="font-black text-xl mb-4 flex items-center gap-2">
                <AlertCircle size={24} className="text-red-400" />
                Need Help?
              </h3>
              <p className="text-base text-purple-200 mb-4">
                Experiencing issues? Have feedback? We&apos;d love to hear from you!
              </p>
              <div className="bg-purple-900 bg-opacity-40 rounded-xl px-4 py-3 mb-4 text-sm">
                <p className="font-bold text-purple-200 mb-1">📱 Listen on mobile like an app</p>
                <p className="text-purple-400 text-xs leading-relaxed">
                  On iPhone: tap Share → &quot;Add to Home Screen&quot;.<br/>
                  On Android: tap the browser menu → &quot;Add to Home Screen&quot; or &quot;Install app&quot;.<br/>
                  This lets ChorusClip run fullscreen and keeps audio playing when you switch apps.
                </p>
              </div>
              <a 
                href="mailto:ted.sande@strathmore.edu?subject=ChorusClip Support Request"
                className="block w-full py-4 text-lg bg-gradient-to-r from-red-600 to-pink-600 rounded-xl font-bold text-center hover:shadow-xl transition"
              >
                Contact Support
              </a>
              <p className="text-sm text-purple-400 text-center mt-3">
                Response time: 24-48 hours
              </p>
            </div>
            </div>
          </div>

          <div className={`space-y-6 ${mobileTab === 'create' || mobileTab === 'more' ? 'hidden md:block' : ''}`}>
            <div className={mobileTab === 'library' ? 'hidden md:block' : ''}>
            <div className="card">
              {/* Clip search */}
              <div className="relative mb-4">
                <input
                  type="text"
                  value={clipSearchQuery}
                  onChange={e => {
                    setClipSearchQuery(e.target.value);
                    if (e.target.value) {
                      setFeedExpanded(true);
                      setFeedPage(1);
                    } else {
                      setFeedExpanded(false);
                    }
                  }}
                  placeholder="Search by artist, song, or creator..."
                  className="w-full pl-9 pr-8 py-2.5 bg-purple-900 bg-opacity-40 border border-purple-700 rounded-xl text-sm text-white placeholder-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 text-sm pointer-events-none">🔍</span>
                {clipSearchQuery && (
                  <button
                    onClick={() => { setClipSearchQuery(''); setFeedExpanded(false); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-white text-xs w-5 h-5 flex items-center justify-center"
                    aria-label="Clear search"
                  >✕</button>
                )}
              </div>
              {clipSearchQuery && (
                <p className="text-xs text-purple-400 mb-3 -mt-2">
                  {filteredClips.length === 0
                    ? 'No clips found'
                    : `${filteredClips.length} clip${filteredClips.length !== 1 ? 's' : ''} found`}
                </p>
              )}
              <button
                className="w-full flex justify-between items-center mb-4"
                onClick={() => !feedIsMostPlayed && setFeedExpanded(v => !v)}
              >
                <h2 className="text-3xl font-black tracking-tight">Trending Clips</h2>
                <span className="flex items-center gap-2 text-purple-400 text-sm font-semibold">
                  {feedIsMostPlayed ? 'Top 5 played' : feedExpanded ? `${clips.length} loaded` : `${Math.min(clips.length, 5)} shown`}
                  {!feedIsMostPlayed && (feedExpanded ? <ChevronUp size={20}/> : <ChevronDown size={20}/>)}
                </span>
              </button>
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { key: 'latest', label: 'Latest uploads' },
                  { key: 'most-played', label: 'Most played' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setFeedSort(opt.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition border ${
                      feedSort === opt.key
                        ? 'bg-purple-600 border-purple-400 text-white'
                        : 'bg-purple-900 bg-opacity-40 border-purple-700 text-purple-300 hover:border-purple-500'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
                <div className="ml-auto flex items-center gap-1 bg-purple-900 bg-opacity-40 rounded-xl p-1">
                  <button
                    onClick={() => setClipsViewMode('grid')}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition ${clipsViewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-purple-400 hover:text-purple-200'}`}
                  >⊞ Grid</button>
                  <button
                    onClick={() => setClipsViewMode('list')}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition ${clipsViewMode === 'list' ? 'bg-purple-600 text-white' : 'text-purple-400 hover:text-purple-200'}`}
                  >≡ List</button>
                </div>
              </div>
              <p className="text-xs text-purple-400 mb-4">
                {feedIsMostPlayed ? 'Top 5 clips by play count.' : 'Latest uploads first. Expand and keep loading to browse older history.'}
              </p>
              {discoveryLoading && feedIsMostPlayed ? (
                <div className="text-center py-12 text-purple-300">
                  <p className="text-xl mb-2">Loading clips...</p>
                </div>
              ) : feedLoading && clips.length === 0 ? (
                <div className="text-center py-12 text-purple-300">
                  <p className="text-xl mb-2">Loading clips...</p>
                </div>
              ) : visibleFeedClips.length === 0 ? (
                <div className="text-center py-12 text-purple-300">
                  <p className="text-xl mb-2">No clips yet!</p>
                  <p className="text-base">Be the first to post a clip</p>
                </div>
              ) : (
                <>
                {clipsViewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {visibleFeedClips.map((clip) => {
                    const clipSections = clip.loops || [{ start: clip.startTime || 0, end: clip.endTime || 30 }];
                    const playCount = getClipPlayCount(clip);
                    return (
                      <div
                        key={clip.id}
                        className="relative rounded-2xl overflow-hidden border border-purple-700 border-opacity-40 hover:border-purple-500 transition group cursor-pointer"
                        onClick={() => handlePlayClip(clip.id, clip.youtubeVideoId, clip)}
                      >
                        {/* YouTube thumbnail */}
                        <div className="relative aspect-video bg-purple-900">
                          <img
                            src={`https://img.youtube.com/vi/${clip.youtubeVideoId}/mqdefault.jpg`}
                            alt={clip.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {/* Play overlay */}
                          <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-10 transition flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-white bg-opacity-90 flex items-center justify-center shadow-lg">
                              <Play size={16} fill="black" className="text-black ml-0.5" />
                            </div>
                          </div>
                          {/* Duration badge */}
                          <span className="absolute bottom-1.5 right-1.5 bg-black bg-opacity-80 text-white text-xs px-1.5 py-0.5 rounded font-mono">
                            {Math.max(0, (clipSections[0]?.end || 30) - (clipSections[0]?.start || 0))}s
                          </span>
                        </div>
                        {/* Info */}
                        <div className="p-2 bg-purple-950 bg-opacity-80">
                          <p className="text-xs font-bold text-white truncate leading-tight">{clip.title}</p>
                          <p className="text-xs text-purple-400 truncate">{clip.artist}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-purple-500">❤️ {clip.likes || 0}</span>
                            <span className="text-xs text-purple-500">▶ {playCount}</span>
                            {clip.userId === user?.uid && (
                              <span className={`text-xs ml-auto ${clip.isPublic ? 'text-emerald-400' : 'text-purple-500'}`}>
                                {clip.isPublic ? '🌍' : '🔒'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                ) : (
                <div className="space-y-4">
                  {visibleFeedClips.map((clip) => {
                    const clipSections = clip.loops || [{ start: clip.startTime || 0, end: clip.endTime || 30 }];
                    const firstSection = clipSections[0];
                    return (
                      <div
                        key={clip.id}
                        className="bg-purple-900 bg-opacity-30 rounded-2xl p-5 hover:bg-opacity-50 transition border border-purple-700 border-opacity-30"
                        role="article"
                        aria-label={`${clip.title} by ${clip.artist}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0 mr-2">
                            <h3 className="font-bold text-base sm:text-lg leading-tight truncate">{clip.title}</h3>
                            <p className="text-sm text-purple-300 truncate">{clip.artist}</p>
                            <p className="text-xs text-purple-500 mt-0.5 truncate">
                              @{clip.createdBy} · {formatCreatedDate(clip.createdAt)} · {clipSections.length} section{clipSections.length > 1 ? 's' : ''}
                            </p>
                          </div>
                          {clip.userId === user?.uid && (
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteClip(clip.id); }}
                                className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg text-red-400 hover:text-red-300 hover:bg-red-900 hover:bg-opacity-30 transition shrink-0"
                                title="Delete clip"
                                aria-label="Delete clip"
                              >
                                <X size={14} />
                              </button>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const newVal = !(clip.isPublic);
                                  try {
                                    const { db } = await import('../lib/firebase');
                                    const { doc, updateDoc } = await import('firebase/firestore');
                                    await updateDoc(doc(db, 'clips', clip.id), { isPublic: newVal });
                                    showNotification(newVal ? '🌍 Clip is now public' : '🔒 Clip set to private', 'success');
                                  } catch(e) {
                                    showNotification('Failed to update', 'error');
                                  }
                                }}
                                className={`text-xs px-2 py-1 rounded-full font-semibold transition border ${
                                  clip.isPublic
                                    ? 'border-emerald-500 text-emerald-400 hover:bg-emerald-900 hover:bg-opacity-30'
                                    : 'border-purple-600 text-purple-400 hover:bg-purple-900 hover:bg-opacity-30'
                                }`}
                                title={clip.isPublic ? 'Clip is public — tap to make private' : 'Clip is private — tap to make public'}
                              >
                                {clip.isPublic ? '🌍 Public' : '🔒 Private'}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Section timestamps — compact chips */}
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {clipSections.map((sec, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 text-xs bg-purple-900 bg-opacity-60 border border-purple-700 border-opacity-40 px-2 py-0.5 rounded-full text-purple-300">
                              §{idx + 1}
                              {sec.youtubeVideoId && sec.youtubeVideoId !== clip.youtubeVideoId && <span className="text-yellow-400">🎵</span>}
                              {' '}{Math.floor(sec.start / 60)}:{(sec.start % 60).toString().padStart(2, '0')}–{Math.floor(sec.end / 60)}:{(sec.end % 60).toString().padStart(2, '0')}
                              <span className="text-pink-400">{sec.loopCount === 0 ? '∞' : `${sec.loopCount}×`}</span>
                            </span>
                          ))}
                        </div>

                        {/* Clip card footer — two-row on mobile, single row on sm+ */}
                        <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-3 mt-1">
                          {/* Duration badge */}
                          <span className="text-xs text-purple-500 font-medium">
                            {Math.max(0, firstSection.end - firstSection.start)}s
                          </span>

                          {/* Action buttons — always on same line, tightly spaced */}
                          <div className="flex items-center gap-2 ml-auto">
                            {/* Like */}
                            <button
                              onClick={async () => {
                                setPendingAction(`like-${clip.id}`);
                                await (user.likedClips?.includes(clip.id) ? handleUnlikeClip(clip.id) : handleLikeClip(clip.id));
                                setPendingAction(null);
                              }}
                              disabled={pendingAction === `like-${clip.id}`}
                              className={`min-w-[36px] min-h-[36px] flex items-center justify-center gap-1 rounded-xl transition disabled:opacity-60 ${
                                user.likedClips?.includes(clip.id)
                                  ? 'text-pink-500 bg-pink-900 bg-opacity-30'
                                  : 'text-pink-400 hover:text-pink-300 hover:bg-pink-900 hover:bg-opacity-20'
                              }`}
                              aria-label={user.likedClips?.includes(clip.id) ? `Unlike ${clip.title}` : `Like ${clip.title}`}
                            >
                              {pendingAction === `like-${clip.id}`
                                ? <span className="w-3 h-3 border border-pink-400 border-t-transparent rounded-full animate-spin" />
                                : <Heart size={15} fill={user.likedClips?.includes(clip.id) ? 'currentColor' : 'none'} />
                              }
                              <span className="text-xs font-semibold">{clip.likes || 0}</span>
                            </button>

                            {/* Play */}
                            <button
                              onClick={() => handlePlayClip(clip.id, clip.youtubeVideoId, clip)}
                              className="min-w-[36px] min-h-[36px] flex items-center justify-center gap-1 rounded-xl text-purple-300 hover:text-purple-100 hover:bg-purple-900 hover:bg-opacity-30 transition"
                              aria-label={`Play ${clip.title}`}
                            >
                              <Play size={15} fill="currentColor" />
                              <span className={`text-xs font-semibold ${topPlayCounts.includes(clip.id) ? 'text-red-400 font-bold' : ''}`}>{getClipPlayCount(clip)}</span>
                            </button>

                            {/* Share */}
                            <button
                              onClick={() => handleShareClip(clip)}
                              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-purple-400 hover:text-purple-300 hover:bg-purple-900 hover:bg-opacity-30 transition"
                              aria-label={`Share ${clip.title}`}
                            >
                              <Share2 size={15} />
                            </button>

                            {/* Add to playlist staging */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!user?.uid) { showNotification('Sign in to create playlists!', 'error'); setShowAuthModal(true); return; }
                                if (selectedClipsForPlaylist.length >= 10) { showNotification('Playlist cap is 10 clips!', 'error'); return; }
                                if (isClipDuplicate(clip, selectedClipsForPlaylist)) { showNotification('Already staged!', 'info'); return; }
                                setSelectedClipsForPlaylist([...selectedClipsForPlaylist, clip]);
                                showNotification(`Added! (${selectedClipsForPlaylist.length + 1}/10)`, 'success');
                              }}
                              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900 hover:bg-opacity-30 transition"
                              aria-label="Add to playlist"
                            >
                              <Plus size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                )}

                  {!feedIsMostPlayed && clips.length > 5 && (
                    <div className="space-y-2">
                      {!feedExpanded && (
                        <button
                          onClick={() => setFeedExpanded(true)}
                          className="w-full py-3 bg-purple-800 bg-opacity-40 hover:bg-opacity-60 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
                        >
                          <ChevronDown size={16}/> Show {clips.length - 5} more clips
                        </button>
                      )}
                      {feedExpanded && feedHasMore && (
                        <button
                          onClick={loadMoreClips}
                          disabled={feedLoading}
                          className="w-full py-3 bg-gradient-to-r from-purple-700 to-pink-700 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-60"
                        >
                          <ChevronDown size={16}/> {feedLoading ? 'Loading older clips...' : `Load ${FEED_PAGE_SIZE} older clips`}
                        </button>
                      )}
                      {feedExpanded && !feedHasMore && clips.length > FEED_PAGE_SIZE && (
                        <p className="text-center text-xs text-purple-500 py-1">You’ve reached the oldest loaded clip in the archive.</p>
                      )}
                      {feedExpanded && (
                        <button
                          onClick={() => { setFeedExpanded(false); setFeedPage(1); }}
                          className="w-full py-3 bg-purple-800 bg-opacity-40 hover:bg-opacity-60 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
                        >
                          <ChevronUp size={16}/> Show less
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            </div>

            <div className={mobileTab === 'feed' ? 'hidden md:block' : ''}>
{user?.uid && (
  (() => {
    const myPrivateClips = myClips.filter(c => !c.isPublic);
    const visiblePrivate = myPrivateClips.slice(0, privateClipsLimit);
    return (
      <div className="mt-4 border-t border-purple-700 border-opacity-40 pt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-purple-400 uppercase tracking-wide">
            Your Private Clips ({myPrivateClips.length})
          </p>
          {myPrivateClips.length > 0 && (
            <p className="text-xs text-purple-600">{visiblePrivate.length}/{myPrivateClips.length} shown</p>
          )}
        </div>
        {myPrivateClips.length === 0 ? (
          <p className="text-xs text-purple-500 text-center py-2">No private clips yet</p>
        ) : (
          <>
            <div className="space-y-2">
              {visiblePrivate.map((clip) => (
                <div key={clip.id} className="flex items-center justify-between gap-2 bg-purple-900 bg-opacity-20 rounded-xl px-3 py-2.5 border border-purple-800 border-opacity-30">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-white">{clip.title}</p>
                    <p className="text-xs text-purple-400 truncate">{clip.artist}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Public/private toggle */}
                    <button
                      onClick={async () => {
                        const newVal = !(clip.isPublic);
                        try {
                          const { db } = await import('../lib/firebase');
                          const { doc, updateDoc } = await import('firebase/firestore');
                          await updateDoc(doc(db, 'clips', clip.id), { isPublic: newVal });
                          showNotification(newVal ? '🌍 Now public' : '🔒 Now private', 'success');
                        } catch(e) { showNotification('Failed', 'error'); }
                      }}
                      className="text-xs px-2 py-1 rounded-full border border-purple-600 text-purple-400 hover:border-purple-400 transition"
                    >
                      {clip.isPublic ? '🌍' : '🔒'}
                    </button>
                    {/* Play */}
                    <button
                      onClick={() => handlePlayClip(clip.id, clip.youtubeVideoId, clip)}
                      className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg bg-emerald-700 hover:bg-emerald-600 transition"
                      aria-label={`Play ${clip.title}`}
                    >
                      <Play size={14} fill="currentColor" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {myPrivateClips.length > privateClipsLimit && (
              <button
                onClick={() => setPrivateClipsLimit(p => p + 10)}
                className="w-full mt-3 py-2.5 bg-purple-900 bg-opacity-40 hover:bg-opacity-60 rounded-xl text-sm font-semibold text-purple-300 transition flex items-center justify-center gap-2"
              >
                <ChevronDown size={16} /> Load {Math.min(10, myPrivateClips.length - privateClipsLimit)} more clips
              </button>
            )}
            {myPrivateClips.length > 0 && myPrivateClips.length <= privateClipsLimit && privateClipsLimit > 10 && (
              <button
                onClick={() => setPrivateClipsLimit(10)}
                className="w-full mt-2 py-2 text-xs text-purple-600 hover:text-purple-400 transition"
              >
                Show less
              </button>
            )}
          </>
        )}
      </div>
    );
  })()
)}
            </div>

            <div className={mobileTab === 'library' ? 'hidden md:block' : ''}>
{publicPlaylistShowcase.length > 0 && (
  <div className="bg-black bg-opacity-40 backdrop-blur-xl rounded-3xl p-6 border border-purple-700 border-opacity-50 mt-6">
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <h3 className="font-black text-xl flex items-center gap-2">
          <Music size={22} className="text-purple-300" />
          Public Playlist Picks
        </h3>
        <p className="text-sm text-purple-200 mt-1">Visible even to signed-out listeners. Curated from public playlists only.</p>
      </div>
      {!user?.uid && (
        <button
          onClick={() => setShowAuthModal(true)}
          className="px-3 py-2 bg-purple-700 hover:bg-purple-600 rounded-xl text-sm font-semibold transition shrink-0"
        >
          Sign in for queue
        </button>
      )}
    </div>
    <div className="grid gap-3 md:grid-cols-2">
      {publicPlaylistShowcase.map(({ key, title, subtitle, playlist }) => (
        <div key={key} className="rounded-2xl border border-purple-700 border-opacity-40 bg-purple-900 bg-opacity-20 p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-purple-300 font-bold">{title}</p>
              <p className="text-xs text-purple-500 mt-1">{subtitle}</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-purple-900 bg-opacity-60 text-purple-200">
              {playlist.clips?.length || 0} clips
            </span>
          </div>
          <h4 className="text-lg font-bold leading-tight">{playlist.name}</h4>
          <p className="text-sm text-purple-100 mt-1">
            by @{playlist.createdBy || playlist.ownerDisplayName || 'community'} · runtime {formatSeconds(playlist.runtimeSeconds)}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => handlePlayPlaylist(playlist)}
              className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-black rounded-xl font-semibold transition hover:shadow-lg flex items-center justify-center gap-2"
            >
              <Play size={16} fill="currentColor" />
              Preview
            </button>
            {user?.uid && (
              <button
                onClick={() => handleAddToQueue(playlist)}
                className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition ${playlistQueue.some(p => p.id === playlist.id) ? 'bg-yellow-600 text-white' : 'bg-amber-900 bg-opacity-50 text-amber-200 hover:bg-opacity-80'}`}
              >
                {playlistQueue.some(p => p.id === playlist.id) ? 'In Queue' : '+ Queue'}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
)}
            </div>

            <div className={mobileTab === 'feed' ? 'hidden md:block' : ''}>
{/* MY PLAYLISTS SECTION */}
{user?.uid && playlists.length > 0 && (
  <div className="bg-purple-900 bg-opacity-30 border border-purple-700 border-opacity-40 rounded-2xl mt-6">
    <h3 className="font-black text-xl mb-2 flex items-center gap-2">
      <Music size={24} className="text-purple-400" />
      My Playlists
    </h3>

    {/* Play mode toggle */}
    <div className="flex gap-2 mb-3">
      <button
        onClick={() => setPlaylistMode('default')}
        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${playlistMode === 'default' ? 'bg-purple-600 text-white' : 'bg-purple-900 bg-opacity-40 text-purple-300 hover:bg-opacity-60'}`}
        title="Each section plays its saved repeat count (infinite capped at 5)"
      >
        Saved Repeats
      </button>
      <button
        onClick={() => setPlaylistMode('once')}
        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${playlistMode === 'once' ? 'bg-purple-600 text-white' : 'bg-purple-900 bg-opacity-40 text-purple-300 hover:bg-opacity-60'}`}
        title="Every section in every clip plays exactly once"
      >
        Play Once Each
      </button>
    </div>
    <p className="text-xs text-purple-500 mb-4">
      {playlistMode === 'once'
        ? 'Every section plays 1× regardless of saved count'
        : `Infinite sections play ${ENDLESS_CAP_IN_PLAYLIST}× max`}
    </p>

    <div className="space-y-2">
      {playlists.map((playlist) => {
        const isExpanded = expandedPlaylistId === playlist.id;
        const inQueue = playlistQueue.some(p => p.id === playlist.id);
        return (
          <div
            key={playlist.id}
            className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
              isExpanded
                ? 'border-purple-500 border-opacity-60 bg-purple-900 bg-opacity-60'
                : 'border-purple-700 border-opacity-30 bg-purple-900 bg-opacity-20 hover:bg-opacity-30'
            }`}
          >
            {/* Row header — always visible, tap to expand */}
            <button
              onClick={() => setExpandedPlaylistId(isExpanded ? null : playlist.id)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left"
            >
              <div className="flex-1 min-w-0 mr-3">
                <p className="font-bold text-base leading-tight truncate">{playlist.name}</p>
                <p className="text-xs text-purple-400 mt-0.5">
                  {playlist.clips?.length || 0}/10
                  {inQueue && <span className="ml-2 text-yellow-400 font-bold">· In Queue</span>}
                </p>
              </div>
              {/* Glowing expand button — right side */}
              <span className={`
                flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                ${isExpanded
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/50 ring-2 ring-purple-400'
                  : 'bg-purple-900 bg-opacity-60 text-purple-400 hover:shadow-md hover:shadow-purple-500/30 ring-1 ring-purple-700'
                }
              `}>
                {isExpanded ? '▲' : '▼'}
              </span>
            </button>

            {/* Expanded body */}
            {isExpanded && (
              <div className="px-4 pb-4 space-y-3">
                {/* Clip preview list */}
                {(playlist.clips || []).length === 0 ? (
                  <p className="text-xs text-purple-500 text-center py-2">No clips yet</p>
                ) : (
                  <div className="space-y-1">
                    {(playlist.clips || []).slice(0, 5).map((clip, i) => (
                      <div key={i} className="flex items-center gap-2 py-1 border-b border-purple-800 border-opacity-30 last:border-0">
                        <span className="text-xs text-purple-600 w-4 shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate text-white">{clip.title}</p>
                          <p className="text-xs text-purple-400 truncate">{clip.artist}</p>
                        </div>
                      </div>
                    ))}
                    {(playlist.clips?.length || 0) > 5 && (
                      <p className="text-xs text-purple-500 pt-1">+{playlist.clips.length - 5} more clips</p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handlePlayPlaylist(playlist)}
                    className="flex-1 min-w-[80px] py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl text-sm font-bold flex items-center justify-center gap-1 hover:shadow-lg transition"
                  >
                    <Play size={14} fill="currentColor" /> Play
                  </button>
                  <button
                    onClick={() => handleAddToQueue(playlist)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-bold transition ${
                      inQueue
                        ? 'bg-yellow-600 text-black'
                        : 'bg-yellow-900 bg-opacity-50 text-yellow-300 hover:bg-opacity-80'
                    }`}
                    title={inQueue ? 'Remove from queue' : 'Add to queue'}
                  >
                    {inQueue ? '✓Q' : '+Q'}
                  </button>
                  <button
                    onClick={() => setManagingPlaylist(playlist)}
                    className="px-3 py-2.5 bg-purple-800 hover:bg-purple-700 rounded-xl text-sm font-semibold transition"
                    title="Manage playlist"
                  >
                    ⋯
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>

    {/* Playlist Queue Panel */}
    {playlistQueue.length > 0 && (
      <div className="mt-5 bg-yellow-900 bg-opacity-30 border border-yellow-600 border-opacity-50 rounded-2xl p-4">
        <div className="flex justify-between items-center mb-3">
          <p className="font-bold text-yellow-300 flex items-center gap-2">
            Playlist Queue ({playlistQueue.length}/10)
          </p>
          {isPlayingQueue && (
            <span className="text-xs text-yellow-400 animate-pulse font-semibold">▶ Playing queue…</span>
          )}
        </div>
        <div className="space-y-2 mb-3">
          {playlistQueue.map((pl, qi) => (
            <div key={pl.id} className="flex items-center gap-2 bg-yellow-900 bg-opacity-20 px-3 py-2 rounded-xl">
              <span className="text-yellow-400 font-bold w-5 text-sm">{qi + 1}</span>
              <span className="flex-1 text-sm font-semibold truncate">{pl.name}</span>
              <div className="flex gap-1">
                <button onClick={() => handleMoveQueueItem(qi, 'up')} disabled={qi === 0}
                  className="text-yellow-400 hover:text-yellow-200 disabled:opacity-20 text-sm px-1">▲</button>
                <button onClick={() => handleMoveQueueItem(qi, 'down')} disabled={qi === playlistQueue.length - 1}
                  className="text-yellow-400 hover:text-yellow-200 disabled:opacity-20 text-sm px-1">▼</button>
                <button onClick={() => handleRemoveFromQueue(pl.id)}
                  className="text-red-400 hover:text-red-300 ml-1"><X size={14}/></button>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => handlePlayQueue(0)}
          className="w-full py-3 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl font-bold hover:shadow-lg transition flex items-center justify-center gap-2"
        >
          <Play size={18} fill="currentColor" />
          Play Queue ({playlistQueue.length} playlist{playlistQueue.length > 1 ? 's' : ''})
        </button>
      </div>
    )}
  </div>
)}
</div>

{/* Section divider */}
<div className="h-px bg-gradient-to-r from-transparent via-purple-700 via-opacity-40 to-transparent my-2" />

{/* FEED WRAPPER — Leaderboard + Top Artists (discovery content) */}
<div className={mobileTab === 'library' ? 'hidden md:block' : ''}>

            {/* STRATHMORE LEADERBOARD SECTION */}
            <div className="bg-black bg-opacity-40 backdrop-blur-xl rounded-3xl p-6 border border-purple-700 border-opacity-50 mt-6">
              <button
                className="w-full flex justify-between items-center mb-1"
                onClick={() => setLeaderboardExpanded(v => !v)}
              >
                <h3 className="font-black text-xl flex items-center gap-2">Strathmore Leaderboard</h3>
                <span className="flex items-center gap-1 text-purple-400 text-sm">
                  Top creators {leaderboardExpanded ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                </span>
              </button>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {[
                  { key: 'clips', label: '# Clips' },
                  { key: 'likes', label: ' Likes' },
                  { key: 'alphabetical', label: 'AZ' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setLeaderboardSort(opt.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition border ${
                      leaderboardSort === opt.key
                        ? 'bg-purple-600 border-purple-400 text-white'
                        : 'bg-purple-900 bg-opacity-40 border-purple-700 text-purple-300 hover:border-purple-500'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {!discoveryLoading && topArtists.length > 0 && (
                <div className="mb-4 bg-gradient-to-r from-purple-800 to-pink-900 bg-opacity-60 border border-purple-600 border-opacity-50 rounded-xl px-4 py-3 text-sm">
                  <span className="text-yellow-300 font-bold">🎓 Strathmore this month: </span>
                  <span className="text-purple-200">
                    vibing to{' '}
                    <strong className="text-white">{topArtists[0]?.artist}</strong>
                    {topArtists[1] && <>, <strong className="text-white">{topArtists[1]?.artist}</strong></>}
                    {topArtists.length > 2 && <span className="text-purple-400"> & more</span>}
                  </span>
                </div>
              )}
              {leaderboard.length === 0 ? (
                <div className="text-center py-6 text-purple-300"><p className="text-base">No rankings yet!</p></div>
              ) : (
                <>
                  <div className="space-y-3">
                    {(leaderboardExpanded ? leaderboard : leaderboard.slice(0, 5))
                      .slice()
                      .sort((a, b) => {
                        if (leaderboardSort === 'likes') return (b.likes || 0) - (a.likes || 0);
                        if (leaderboardSort === 'alphabetical') return (a.name || '').localeCompare(b.name || '');
                        return (b.songs || 0) - (a.songs || 0);
                      })
                      .map((entry, displayIdx) => (
                      <div key={entry.rank} className={`flex justify-between items-center p-4 rounded-xl ${
                        displayIdx === 0
                          ? 'bg-gradient-to-r from-yellow-900 to-amber-900 bg-opacity-60 border border-yellow-500 border-opacity-50'
                          : 'bg-purple-900 bg-opacity-30'
                      }`}>
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">
                            {displayIdx === 0 ? '🥇' : displayIdx === 1 ? '🥈' : displayIdx === 2 ? '🥉' : `#${displayIdx + 1}`}
                          </span>
                          <div>
                            <p className="font-bold text-lg">@{entry.name}</p>
                            <p className="text-sm text-purple-300">Top artist: {entry.artist}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-purple-300 font-bold text-xl">{leaderboardSort === 'likes' ? (entry.likes || 0) : (entry.songs || 0)}</p>
                          <p className="text-xs text-purple-500">{leaderboardSort === 'alphabetical' ? 'A-Z' : leaderboardSort}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {leaderboard.length > 5 && (
                    <button
                      onClick={() => setLeaderboardExpanded(v => !v)}
                      className="w-full mt-3 py-2.5 bg-purple-800 bg-opacity-40 hover:bg-opacity-60 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
                    >
                      {leaderboardExpanded ? <><ChevronUp size={16}/> Show less</> : <><ChevronDown size={16}/> Show {leaderboard.length - 5} more</>}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Section divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-purple-700 via-opacity-40 to-transparent my-2" />

<div className="bg-black bg-opacity-40 backdrop-blur-xl rounded-3xl p-6 border border-purple-700 border-opacity-50">
  <button
    className="w-full flex justify-between items-center mb-4"
    onClick={() => setArtistsExpanded(v => !v)}
  >
    <h3 className="font-black text-xl flex items-center gap-2">
      <Music size={22} className="text-pink-400" />
      Top Artists
    </h3>
    <span className="flex items-center gap-1 text-purple-400 text-sm">
      {artistsExpanded ? 'Show less' : 'Show more'} {artistsExpanded ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
    </span>
  </button>
  {discoveryLoading ? (
    <div className="flex items-center justify-center py-6 gap-2 text-purple-400 text-sm">
    </div>
  ) : topArtists.length === 0 ? (
    <p className="text-center text-purple-400 py-4 text-sm">No artist data yet</p>
  ) : (
    <div className="space-y-3">
      {(artistsExpanded ? topArtists : topArtists.slice(0, 5)).map((item, idx) => (
        <div key={idx} className="flex items-center gap-4 bg-purple-900 bg-opacity-30 p-4 rounded-xl hover:bg-opacity-50 transition group">
          <span className="text-2xl font-bold text-purple-400 w-8">{idx + 1}</span>
          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-purple-600 group-hover:border-yellow-400 transition flex-shrink-0">
            {artistImages[item.artist] ? (
              <Image
                src={artistImages[item.artist]}
                alt={item.artist}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <Music size={32} className="text-white" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg">{item.artist}</p>
            <p className="text-sm text-purple-300">{item.clips} clips</p>
          </div>
          <span className="text-pink-400 font-bold">{item.clips}</span>
        </div>
      ))}
    </div>
  )}
  {topArtists.length > 5 && (
    <button
      onClick={() => setArtistsExpanded(v => !v)}
      className="w-full mt-3 py-2.5 bg-purple-800 bg-opacity-40 hover:bg-opacity-60 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
    >
      {artistsExpanded ? <><ChevronUp size={16}/> Show less</> : <><ChevronDown size={16}/> Show {topArtists.length - 5} more</>}
    </button>
  )}
</div>
            </div>
          </div>
        </div>
      
      

{/* STICKY BOTTOM BANNER — staged clips only (playlist queue lives in the side drawer) */}
{selectedClipsForPlaylist.length > 0 && (
  <div className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ${queueBannerCollapsed ? 'translate-y-[calc(100%-48px)]' : 'translate-y-0'}`}>
    <div className="max-w-2xl mx-auto px-4 pb-4">
      <div className="bg-gradient-to-r from-amber-900 via-yellow-900 to-amber-900 border border-amber-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header / collapse toggle */}
        <button
          onClick={() => setQueueBannerCollapsed(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3 border-b border-amber-700 hover:bg-white hover:bg-opacity-5 transition"
        >
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-amber-300 font-bold text-sm">
              🎵 {selectedClipsForPlaylist.length} clip{selectedClipsForPlaylist.length !== 1 ? 's' : ''} staged
            </span>
          </div>
          <span className="text-amber-400 text-xs font-semibold shrink-0">
            {queueBannerCollapsed ? ' show' : ' hide'}
          </span>
        </button>

        {/* Staged clips edit section */}
        {!queueBannerCollapsed && (
          <div className="px-5 pt-2 pb-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-amber-300 font-bold text-sm">
                Drag ⠿ to reorder
              </span>
              <button
                onClick={() => setStagedClipsEditMode(v => !v)}
                className={`text-xs font-bold px-3 py-1 rounded-lg transition ${stagedClipsEditMode ? 'bg-amber-500 text-black' : 'bg-purple-800 text-purple-300 hover:text-white'}`}
              >
                {stagedClipsEditMode ? 'Done' : 'Edit Order'}
              </button>
            </div>

            {stagedClipsEditMode && (
              <div className="space-y-1.5 max-h-64 overflow-y-auto pb-2">
                {selectedClipsForPlaylist.map((clip, idx) => (
                  <div
                    key={clip.id || idx}
                    draggable
                    onDragStart={() => setDraggedQueueIdx(idx)}
                    onDragOver={(e) => { e.preventDefault(); }}
                    onDrop={() => {
                      if (draggedQueueIdx === null || draggedQueueIdx === idx) return;
                      const newClips = [...selectedClipsForPlaylist];
                      const [moved] = newClips.splice(draggedQueueIdx, 1);
                      newClips.splice(idx, 0, moved);
                      setSelectedClipsForPlaylist(newClips);
                      setDraggedQueueIdx(null);
                    }}
                    onDragEnd={() => setDraggedQueueIdx(null)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                      draggedQueueIdx === idx
                        ? 'opacity-40 border-amber-400 bg-amber-900 bg-opacity-40'
                        : 'border-amber-700 border-opacity-30 bg-amber-900 bg-opacity-20 hover:bg-opacity-30'
                    }`}
                  >
                    <span className="text-amber-400 font-bold text-sm w-5 shrink-0">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{clip.title}</p>
                      <p className="text-xs text-amber-400 truncate">{clip.artist}</p>
                    </div>
                    <button
                      onClick={() => setSelectedClipsForPlaylist(selectedClipsForPlaylist.filter((_, i) => i !== idx))}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-red-900 bg-opacity-50 hover:bg-opacity-80 text-red-400 text-xs transition shrink-0"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions row */}
        <div className="flex flex-wrap gap-2 px-5 py-3">
          {selectedClipsForPlaylist.length > 0 && (
            <button
              onClick={handlePlayStagedClips}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-black rounded-xl text-sm font-bold flex items-center gap-1 hover:shadow-lg transition"
            >
              <Play size={14} fill="currentColor" /> Play Clips
            </button>
          )}
          {selectedClipsForPlaylist.length > 0 && (
            <button
              onClick={() => setShowPlaylistModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 text-black rounded-xl text-sm font-bold flex items-center gap-1 hover:shadow-lg transition"
            >
              <Plus size={14}/> Save to Playlist
            </button>
          )}
          {selectedClipsForPlaylist.length > 0 && (
            <button
              onClick={() => { setSelectedClipsForPlaylist([]); setStagedClipsEditMode(false); }}
              className="px-4 py-2 bg-purple-800 hover:bg-purple-700 rounded-xl text-sm font-semibold transition"
            >
              Clear Staged
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
)}

{/* Floating queue indicator — always visible when queue has items */}
{playlistQueue.length > 0 && (
  <button
    onClick={() => setQueueDrawerOpen(v => !v)}
    className="fixed right-0 top-1/2 -translate-y-1/2 z-50 bg-yellow-600 hover:bg-yellow-500 text-black font-black py-6 px-2 rounded-l-2xl shadow-xl transition-all"
    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
    aria-label="Toggle queue"
  >
    <span className="text-xs font-black">QUEUE {playlistQueue.length}</span>
  </button>
)}

{/* Side drawer — playlist queue */}
{queueDrawerOpen && (
  <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setQueueDrawerOpen(false)}>
    <div
      className="w-80 max-w-[85vw] h-full bg-gradient-to-b from-yellow-900 to-amber-950 border-l border-yellow-700 shadow-2xl overflow-y-auto flex flex-col"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-yellow-700">
        <h3 className="font-black text-lg text-yellow-300">Play Queue ({playlistQueue.length}/10)</h3>
        <button onClick={() => setQueueDrawerOpen(false)} className="text-yellow-400 hover:text-white text-xl">✕</button>
      </div>

      {/* Edit Order toggle */}
      <div className="px-5 py-3 border-b border-yellow-800">
        <button
          onClick={() => setQueueEditMode(v => !v)}
          className={`text-sm font-bold px-4 py-2 rounded-xl transition ${queueEditMode ? 'bg-yellow-500 text-black' : 'bg-yellow-900 text-yellow-300 hover:bg-yellow-800'}`}
        >
          {queueEditMode ? 'Done Editing' : 'Edit Order'}
        </button>
      </div>

      {/* Queue items — drag sortable when editing */}
      <div className="flex-1 px-4 py-3 space-y-2">
        {playlistQueue.length === 0 ? (
          <p className="text-center text-yellow-600 text-sm py-6">Queue is empty</p>
        ) : (
          playlistQueue.map((pl, qi) => (
            <div
              key={pl.id}
              draggable={queueEditMode}
              onDragStart={() => queueEditMode && setDraggedQueueIdx(qi)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (!queueEditMode || draggedQueueIdx === null || draggedQueueIdx === qi) return;
                const newQueue = [...playlistQueue];
                const [moved] = newQueue.splice(draggedQueueIdx, 1);
                newQueue.splice(qi, 0, moved);
                setPlaylistQueue(newQueue);
                playlistQueueRef.current = newQueue;
                setDraggedQueueIdx(null);
                if (user?.uid) {
                  import('../lib/firebase').then(({ saveQueueToFirestore }) => {
                    saveQueueToFirestore(user.uid, newQueue.map(p => p.id));
                  });
                }
              }}
              onDragEnd={() => setDraggedQueueIdx(null)}
              className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                draggedQueueIdx === qi ? 'opacity-40' : ''
              } ${isPlayingQueue && playlistQueueIndex === qi
                ? 'border-yellow-400 bg-yellow-800 bg-opacity-60'
                : 'border-yellow-800 bg-yellow-900 bg-opacity-30'
              }`}
            >
              {queueEditMode && <span className="text-yellow-500 text-lg cursor-grab">⠿</span>}
              <span className={`font-black text-sm w-5 shrink-0 ${isPlayingQueue && playlistQueueIndex === qi ? 'text-yellow-300' : 'text-yellow-600'}`}>
                {isPlayingQueue && playlistQueueIndex === qi ? '▶' : qi + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-white">{pl.name}</p>
                <p className="text-xs text-yellow-500">{pl.clips?.length || 0} clips</p>
              </div>
              {queueEditMode && (
                <button
                  onClick={() => handleRemoveFromQueue(pl.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-red-900 bg-opacity-50 hover:bg-red-700 text-red-400 text-xs transition"
                >✕</button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Actions */}
      <div className="px-5 py-4 border-t border-yellow-800 space-y-2">
        {!isPlayingQueue && (
          <button
            onClick={() => { handlePlayQueue(0); setQueueDrawerOpen(false); }}
            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-xl font-black hover:shadow-lg transition flex items-center justify-center gap-2"
          >
            ▶ Play Queue
          </button>
        )}
        <button
          onClick={() => {
            setPlaylistQueue([]);
            playlistQueueRef.current = [];
            if (user?.uid) {
              import('../lib/firebase').then(({ saveQueueToFirestore }) => {
                saveQueueToFirestore(user.uid, []);
              });
            }
            setQueueDrawerOpen(false);
          }}
          className="w-full py-2.5 bg-red-900 bg-opacity-50 hover:bg-opacity-80 text-red-300 rounded-xl text-sm font-semibold transition"
        >
          Clear Queue
        </button>
      </div>
    </div>
  </div>
)}
</div>

{/* Mobile bottom tab bar — hidden on desktop */}
<nav className="fixed bottom-0 left-0 right-0 z-50 bg-black bg-opacity-90 backdrop-blur-md border-t border-purple-800 border-opacity-50 flex md:hidden">
  {[
    { key: 'create', icon: '🎵', label: 'Create' },
    { key: 'feed', icon: '🔥', label: 'Feed' },
    { key: 'library', icon: '📋', label: 'Library' },
    { key: 'more', icon: '☰', label: 'More' },
  ].map(tab => (
    <button
      key={tab.key}
      onClick={() => setMobileTab(tab.key)}
      className={`relative flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition ${
        mobileTab === tab.key ? 'text-purple-400' : 'text-purple-700 hover:text-purple-500'
      }`}
    >
      <span className="text-xl leading-none">{tab.icon}</span>
      <span className={`text-xs font-semibold ${mobileTab === tab.key ? 'text-purple-400' : 'text-purple-700'}`}>
        {tab.label}
      </span>
      {mobileTab === tab.key && (
        <span className="absolute bottom-0 w-8 h-0.5 bg-purple-400 rounded-full" />
      )}
    </button>
  ))}
</nav>
    </div>
  );
};
