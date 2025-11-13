'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Share2, Heart, Plus, X, AlertCircle, Video, Download, Sparkles, LogOut, Mail, Lock, User, Phone, CheckCircle, XCircle, Users, TrendingUp, Music } from 'lucide-react';

// Use relative imports instead of @/
import Notification from '../components/ui/Notifications';
import AuthModal from '../components/ui/AuthModal';
import PaymentModal from '../components/ui/PaymentModal';
import TutorialModal from '../components/ui/TutorialModal';
import PlaylistModal from '../components/ui/PlaylistModal';
import { useAuth } from '../hooks/useAuth';

import AudioVisualizer from '../components/ui/AudioVisualizer';
import BackgroundAmbience from '../components/ui/BackgroundAmbience';
import { PlaylistPlayer, getUserPlaylists, createPlaylist, getAllPublicPlaylists } from '../utils/playlistUtils';
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
const [artistImages, setArtistImages] = useState({});
const [publicPlaylists, setPublicPlaylists] = useState([]);

  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoId, setVideoId] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  // initial loop state
  const [loops, setLoops] = useState([{ start: 0, end: 30 }]);
  const [currentLoopIndex, setCurrentLoopIndex] = useState(0);
  const [loopCount, setLoopCount] = useState(0);
  const [currentLoopIteration, setCurrentLoopIteration] = useState(0);
  const [playerCurrentTime, setPlayerCurrentTime] = useState(0);
  
  const [showTutorial, setShowTutorial] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSongsWarning, setShowSongsWarning] = useState(false);
  const [showMostReplayedSuggestion, setShowMostReplayedSuggestion] = useState(false);
  const [suggestedStart, setSuggestedStart] = useState(0);
  const [suggestedEnd, setSuggestedEnd] = useState(30);

  const [notification, setNotification] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [clips, setClips] = useState([]); 
const [trendingByPlays, setTrendingByPlays] = useState([]);
const [topArtists, setTopArtists] = useState([]);

const loadTrendingData = async () => {
  const { getTrendingClipsByPlays, getTopArtists } = await import('../lib/firebase');
  const trending = await getTrendingClipsByPlays(5);
  const artists = await getTopArtists(5);
  setTrendingByPlays(trending);
  setTopArtists(artists);
};

  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const seekTimeoutRef = useRef(null);

const songsLimit = user?.accountCreatedDaysAgo < 7 ? 10 : 3;
const songsRemaining = user ? songsLimit - user.songsToday : 0;
  const maxLoopsPerSong = user?.isPremium ? 3 : 1;

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
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
    loadPublicPlaylists(); // ADD THIS
    checkAuthState();
  }
}, []);


useEffect(() => {
  if (topArtists.length > 0) {
    loadArtistImages();
  }
}, [topArtists]);

  const loadTrendingClips = async () => {
    try {
      const { subscribeToTrendingClips } = await import('../lib/firebase');
      subscribeToTrendingClips((trendingClips) => {
        setClips(trendingClips);
      });
    } catch (error) {
      console.log('Using demo clips');
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
    setSuggestedStart(60);
    setSuggestedEnd(90);
    setShowMostReplayedSuggestion(true);
  };
const handleUrlSubmit = async () => {
  if (!window.YT || !window.YT.Player) {
    showNotification('⏳ YouTube player loading... Try again in 2 seconds', 'info');
    return;
  }
  if (!user?.isPremium && songsRemaining <= 0) {
    showNotification('Daily song limit reached! Upgrade to Premium for unlimited songs.', 'error');
    return;
  }

  const id = extractVideoId(youtubeUrl);
  if (id) {
    setVideoId(id);
    // DON'T reset loops here - let suggestion modal handle it
    setCurrentLoopIndex(0);
    setCurrentLoopIteration(0);
    loadYouTubePlayer(id);
    
    // Show suggestion modal AFTER player loads
    setTimeout(() => {
      fetchMostReplayed();
    }, 1000);
    
    const newCount = user.songsToday + 1;
    setUser(prev => ({ ...prev, songsToday: newCount }));
    localStorage.setItem('songsToday', newCount.toString());

    if (songsRemaining === 3 && !user?.isPremium) {
      setShowSongsWarning(true);
    }
  }
};
  const applySuggestedLoop = () => {
  const newLoops = [{ start: suggestedStart, end: suggestedEnd }];
  setLoops(newLoops);
  setShowMostReplayedSuggestion(false);
  
  // Seek immediately, no timeout
  if (playerRef.current && playerRef.current.seekTo) {
    try {
      playerRef.current.seekTo(suggestedStart, true);
      console.log(`✅ Applied suggested loop: ${suggestedStart}s - ${suggestedEnd}s`);
    } catch (e) {
      console.log('Seek error (ignored):', e);
    }
  }
};

const dismissSuggestion = () => {
  // Keep default 20-50s but DON'T seek - let user control
  setShowMostReplayedSuggestion(false);
  console.log('✅ Manual mode: User will adjust sliders');
};

const loadYouTubePlayer = (id) => {
  if (window.YT && window.YT.Player) {
    if (playerRef.current && playerRef.current.destroy) {
      playerRef.current.destroy();
    }
    
    playerRef.current = new window.YT.Player('youtube-player', {
      videoId: id,
      playerVars: { 
        autoplay: 0, 
        controls: 1, 
        enablejsapi: 1,
        origin: typeof window !== 'undefined' ? window.location.origin : '',
        widget_referrer: typeof window !== 'undefined' ? window.location.origin : ''
      },
      events: { 
        onReady: (event) => {
          const title = event.target.getVideoData().title;
          setVideoTitle(title);
          setArtist(extractArtist(title));
          
          // CRITICAL: Seek to start immediately when ready
          setTimeout(() => {
            try {
              event.target.seekTo(loops[0].start, true);
              console.log(`✅ Player ready, seeked to ${loops[0].start}s`);
            } catch (e) {
              console.log('Initial seek error:', e);
            }
          }, 500);
        }, 
        onStateChange: onPlayerStateChange
      }
    });
  }
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

const loadPublicPlaylists = async () => {
  try {
    const publicLists = await getAllPublicPlaylists();
    setPublicPlaylists(publicLists);
  } catch (error) {
    console.error('Failed to load public playlists:', error);
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
    await createPlaylist(user.uid, name, selectedClipsForPlaylist);
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

  // Stop any existing playlist
  if (currentPlaylistPlayer) {
    currentPlaylistPlayer.stop();
  }

  const player = new PlaylistPlayer(playlist, playerRef, {
    onClipChange: (clip, index, total) => {
      setCurrentPlaylistInfo({
        name: playlist.name,
        currentIndex: index,
        total: total,
        currentClip: clip
      });
      setLoops(clip.loops);
      setLoopCount(clip.loopCount || 1);
      setVideoTitle(clip.title);
      setArtist(clip.artist);
    },
    onPlaylistComplete: () => {
      setIsPlayingPlaylist(false);
      setCurrentPlaylistInfo(null);
      setCurrentPlaylistPlayer(null);
    },
    showNotification
  });

  setCurrentPlaylistPlayer(player);
  setIsPlayingPlaylist(true);
  player.playNext();
  showNotification(`▶️ Playing: ${playlist.name}`, 'success');
};

const loadArtistImages = async () => {
  const uniqueArtists = [...new Set(topArtists.map(a => a.artist))];
  
  for (const artist of uniqueArtists) {
    if (!artistImages[artist]) {
      const imageUrl = await getArtistImageWithCache(artist);
      setArtistImages(prev => ({ ...prev, [artist]: imageUrl }));
    }
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
    } else if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) {
      setIsPlaying(false);
      stopTimeTracking();
    }
  };
  
  // COMPLETE REPLACEMENT for startTimeTracking function:

  const startTimeTracking = () => {
  if (intervalRef.current) clearInterval(intervalRef.current);
  
  intervalRef.current = setInterval(() => {
    if (!playerRef.current?.getCurrentTime || !playerRef.current?.getPlayerState) {
      return;
    }
    
    try {
      const time = playerRef.current.getCurrentTime();
      const state = playerRef.current.getPlayerState();
      
      setPlayerCurrentTime(time);
      
      if (state !== window.YT.PlayerState.PLAYING) return;
      
      if (!loops || loops.length === 0 || !loops[currentLoopIndex]) return;
      
      const currentLoop = loops[currentLoopIndex];
      
      // INCREASED BUFFER for short clips
      const buffer = currentLoop.end - currentLoop.start < 15 ? 0.5 : 0.3;
      
      if (time >= currentLoop.end - buffer) {
        console.log(`🔄 Loop ended at ${time.toFixed(1)}s`);
        
        // Force seek with allowSeekAhead=true
        playerRef.current.seekTo(currentLoop.start, true);
        
        if (currentLoopIndex < loops.length - 1) {
          setCurrentLoopIndex(currentLoopIndex + 1);
        } else {
          const newIteration = currentLoopIteration + 1;
          if (loopCount === 0 || newIteration < loopCount) {
            setCurrentLoopIteration(newIteration);
            setCurrentLoopIndex(0);
          } else {
            playerRef.current.pauseVideo();
            setCurrentLoopIteration(0);
            setCurrentLoopIndex(0);
            stopTimeTracking();
          }
        }
      }
    } catch (e) {
      console.error('Tracking error:', e);
    }
  }, 100); // Reduced from 200ms to 100ms for tighter loops
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
showNotification(
  `${user?.isPremium ? 'Maximum 3' : 'Free tier: Only 1'} loop${user?.isPremium ? 's' : ''} per song.`,
  'error'
);
      return;
    }
    setLoops([...loops, { start: 0, end: 30 }]);
  };

  const updateLoop = (index, field, value) => {
  const newLoops = [...loops];
  const numValue = Number(value);
  
  if (field === 'start') {
    newLoops[index].start = Math.max(0, numValue);
    if (newLoops[index].end <= newLoops[index].start) {
      newLoops[index].end = Math.min(newLoops[index].start + 30, 300);
    }
    if (newLoops[index].end - newLoops[index].start > 45) {
      newLoops[index].end = newLoops[index].start + 45;
    }
  } else if (field === 'end') {
    newLoops[index].end = Math.max(newLoops[index].start + 1, numValue);
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

  const handleDownload = async () => {
    if (!user?.isPremium) {
      showNotification('Downloads are Premium only!', 'error');
      return;
    }
    if (!videoId) {
      showNotification('Load a song first!', 'error');
      return;
    }

    const loop = loops[currentLoopIndex];
    try {
      showNotification('Preparing download...', 'info');
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId, startTime: loop.start, endTime: loop.end, title: videoTitle
        })
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${videoTitle.replace(/[^a-z0-9]/gi, '_')}_loop.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showNotification('Download started!', 'success');
    } catch (error) {
      showNotification('Download failed. Try again later.', 'error');
    }
  };

  // Update handlePostToFeed function (around line 740):
  
  const handlePostToFeed = async () => {
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
    // CRITICAL: Save ALL loops as array
    loops: loops.map(loop => ({
      start: Number(loop.start),
      end: Number(loop.end)
    })),
    loopCount: loopCount || 0,
    userId: user?.uid,
    createdBy: user.displayName,
    likes: 0,
    plays: 0,
    shares: 0,
    createdAt: new Date()
  };

  console.log('Posting clip with data:', clipData);

  try {
    const { createClip } = await import('../lib/firebase');
    await createClip(clipData);
    showNotification(`✅ Posted ${loops.length} loop(s) to feed!`, 'success');
  } catch (error) {
    console.error('Post error:', error);
    showNotification('Failed to post. Try again.', 'error');
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
        likedClips: [...prev.likedClips, clipId]
      }));

      showNotification('❤️ Clip liked!', 'success');
    } catch (error) {
      showNotification('Failed to like. Check your permissions.', 'error');
      console.error('Like error:', error);
    }
  };

  const handlePlayClip = async (clipId, videoIdToPlay, clipData) => {
  console.log('Playing clip:', clipData);

  try {
    // Increment play count only if user is signed in
    if (user?.uid) {
      const { db } = await import('../lib/firebase');
      const { doc, updateDoc, increment } = await import('firebase/firestore');
      await updateDoc(doc(db, 'clips', clipId), { plays: increment(1) });
    } else {
      console.log('Unsigned user - skipping play count');
    }

    // Destroy existing player if present
    if (playerRef.current?.destroy) {
      try {
        playerRef.current.destroy();
      } catch (e) {
        console.log('Destroy error (ignored):', e);
      }
    }

    // Setup loops
    const loopsToLoad = clipData.loops || [{ start: clipData.startTime || 0, end: clipData.endTime || 30 }];
    console.log('Loading loops:', loopsToLoad);

    // Update state
    setYoutubeUrl(`https://youtube.com/watch?v=${videoIdToPlay}`);
    setVideoId(videoIdToPlay);
    setLoops(loopsToLoad);
    setLoopCount(clipData.loopCount || 0);
    setCurrentLoopIndex(0);
    setCurrentLoopIteration(0);

    showNotification(`⏳ Loading ${loopsToLoad.length} loop(s)...`, 'info');

    // Load YouTube player
    if (window.YT?.Player) {
      playerRef.current = new window.YT.Player('youtube-player', {
        videoId: videoIdToPlay,
        playerVars: {
          autoplay: 1,
          controls: 1,
          enablejsapi: 1,
          origin: typeof window !== 'undefined' ? window.location.origin : '',
          widget_referrer: typeof window !== 'undefined' ? window.location.origin : ''
        },
        events: {
          onReady: (event) => {
            const title = event.target.getVideoData().title;
            setVideoTitle(title);
            setArtist(extractArtist(title));

            setTimeout(() => {
              try {
                event.target.seekTo(loopsToLoad[0].start, true);
                event.target.playVideo();
                showNotification(`▶️ Playing ${loopsToLoad.length} loop(s)!`, 'success');
                console.log(`✅ Started at ${loopsToLoad[0].start}s`);
              } catch (e) {
                console.log('Seek error:', e);
              }
            }, 500);
          },
          onStateChange: onPlayerStateChange
        }
      });
    }
  } catch (error) {
    console.error('Play clip error:', error);

    if (error.code === 'permission-denied') {
      showNotification('⚠️ Some features require sign in. You can still watch clips!', 'info');
    } else {
      showNotification('❌ Failed to play clip', 'error');
    }
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
      likedClips: prev.likedClips.filter(id => id !== clipId)
    }));

    showNotification('💔 Unliked!', 'info');
  } catch (error) {
    console.error('Unlike error:', error);
  }
};
  const handleSignOut = async () => {
    try {
      const { auth } = await import('../lib/firebase');
      const { signOut } = await import('firebase/auth');
      await signOut(auth);
      setUser({
        uid: null,
        displayName: 'Guest',
        email: '',
        isPremium: false,
        songsToday: 0,
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
  
  const newName = prompt('Enter new display name (3-20 characters):');
  if (!newName || newName.length < 3 || newName.length > 20) {
    showNotification('Invalid name. Must be 3-20 characters.', 'error');
    return;
  }
  
  try {
    const { db } = await import('../lib/firebase');
    const { doc, updateDoc, collection, query, where, getDocs, writeBatch } = await import('firebase/firestore');
    
    // Update user document
    await updateDoc(doc(db, 'users', user.uid), {
      displayName: newName
    });
    
    // Update ALL clips by this user (BATCH UPDATE)
    const clipsQuery = query(collection(db, 'clips'), where('userId', '==', user.uid));
    const clipsSnapshot = await getDocs(clipsQuery);
    
    const batch = writeBatch(db);
    clipsSnapshot.docs.forEach((clipDoc) => {
      batch.update(clipDoc.ref, { createdBy: newName });
    });
    await batch.commit();
    
    setUser(prev => ({ ...prev, displayName: newName }));
    showNotification('✅ Username updated everywhere!', 'success');
  } catch (error) {
    console.error('Username update error:', error);
    showNotification('❌ Failed to update username', 'error');
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
      if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
    };
  }, []); 
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 text-white relative overflow-hidden">
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
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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


{showPaymentModal && (
  <PaymentModal
    onClose={() => setShowPaymentModal(false)}
    userEmail={user?.email}
    onSuccess={(msg) => showNotification(msg, 'success')}
  />
)}


{showTutorial && <TutorialModal onClose={() => setShowTutorial(false)} />}

      {showSongsWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-3xl p-8 max-w-md w-full border border-yellow-500">
            <div className="flex items-center gap-4 mb-4">
              <AlertCircle className="text-yellow-400" size={48} />
              <h3 className="text-3xl font-bold">Only {songsRemaining} Songs Left Today!</h3>
            </div>
            <p className="text-purple-200 mb-6 text-xl">Upgrade to Premium for unlimited songs + 3 loops per song!</p>
            <div className="space-y-3">
              <button onClick={() => { setShowSongsWarning(false); setShowPaymentModal(true); }} className="w-full py-5 text-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-xl font-bold hover:shadow-2xl transition">
                Upgrade - KES 299/mo
              </button>
              <button onClick={() => setShowSongsWarning(false)} className="w-full py-4 text-lg bg-purple-800 bg-opacity-50 rounded-xl hover:bg-opacity-70 transition">
                Continue with Free
              </button>
            </div>
          </div>
        </div>
      )}
{user?.uid && playlists.length > 0 && (
  <div className="bg-black bg-opacity-40 backdrop-blur-xl rounded-3xl p-6 border border-purple-700 border-opacity-50 mt-6">
    <h3 className="font-black text-xl mb-4">My Playlists</h3>
    <div className="space-y-3">
      {playlists.map((playlist) => (
        <div key={playlist.id} className="bg-purple-900 bg-opacity-30 p-4 rounded-xl hover:bg-opacity-50 transition">
          <div className="flex justify-between items-center mb-2">
            <p className="font-bold text-lg">{playlist.name}</p>
            <span className="text-purple-300 text-sm">{playlist.clips?.length || 0} songs</span>
          </div>
          <button
            onClick={() => handlePlayPlaylist(playlist)}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
          >
            <Play size={20} fill="currentColor" />
            Play Playlist
          </button>
        </div>
      ))}
    </div>
  </div>
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
                I'll Choose Manually
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD PLAYLIST MODAL HERE */}
      
      {showPlaylistModal && (
  <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
    <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-3xl p-8 max-w-2xl w-full border border-purple-500 max-h-[90vh] overflow-y-auto">
      <button onClick={() => setShowPlaylistModal(false)} className="float-right text-white hover:text-purple-300">
        <X size={32} />
      </button>
      
      <h2 className="text-3xl font-bold mb-6">Create Playlist</h2>
      
      <input
        type="text"
        id="playlist-name-input"
        placeholder="Playlist name (e.g., '2010s Party Mix')"
 
className="btn-secondary px-5 py-4"     />
      
      <div className="bg-purple-900 bg-opacity-30 p-4 rounded-xl max-h-60 overflow-y-auto mb-6">
        <p className="font-bold mb-3">Selected Clips ({selectedClipsForPlaylist.length}):</p>
        {selectedClipsForPlaylist.map((clip, idx) => (
          <div key={idx} className="flex justify-between items-center py-3 border-b border-purple-700">
            <div className="flex-1">
              <p className="font-semibold">{idx + 1}. {clip.title}</p>
              <p className="text-sm text-purple-300">{clip.artist}</p>
            </div>
            <button
              onClick={() => setSelectedClipsForPlaylist(selectedClipsForPlaylist.filter((_, i) => i !== idx))}
              className="text-red-400 hover:text-red-300 ml-3"
            >
              <X size={20} />
            </button>
          </div>
        ))}
      </div>
      
      <button
        onClick={handleCreatePlaylist}
        
className="btn-primary w-full py-5 text-xl"
      >
        Create Playlist
      </button>
    </div>
  </div>
)}
<header className="border-b border-purple-700 border-opacity-50 bg-black bg-opacity-20 backdrop-blur-md relative z-10 sticky top-0">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
    {/* Top row: Logo and Auth */}
    <div className="flex justify-between items-center mb-3 sm:mb-0">
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
        ChorusClip
      </h1>
      
      {/* Auth section */}
      <div className="flex items-center gap-2">
        {user?.uid ? (
          <>
            <span className="text-sm sm:text-base font-semibold hidden md:inline truncate max-w-[150px]">
              Hey there, {user.displayName}!
            </span>
            <button 
              onClick={handleChangeUsername}
              className="text-xs sm:text-sm text-purple-300 hover:text-purple-200 transition hidden sm:inline"
              aria-label="Change username"
            >
              Edit
            </button>
            <button 
              onClick={handleSignOut} 
              className="px-3 sm:px-5 py-2 text-sm sm:text-base bg-red-600 hover:bg-red-700 rounded-xl font-semibold transition flex items-center gap-1 sm:gap-2"
              aria-label="Sign out"
            >
              <LogOut size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </>
        ) : (
          <button 
            onClick={() => setShowAuthModal(true)} 
            className="px-4 sm:px-6 py-2 text-sm sm:text-base bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold hover:shadow-lg transition"
            aria-label="Sign in to ChorusClip"
          >
            Sign In
          </button>
        )}
      </div>
    </div>
    
    {/* Bottom row: Badges */}
    <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start mt-3 sm:mt-0">
      <span className="text-xs sm:text-sm bg-purple-700 bg-opacity-50 backdrop-blur px-3 py-1.5 rounded-full border border-purple-500 font-semibold whitespace-nowrap">
        Strathmore Exclusive
      </span>
      
      {!user?.isPremium && user?.uid && (
  <span className="text-xs sm:text-sm bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-1.5 rounded-full font-bold whitespace-nowrap">
    {songsRemaining} songs left today
  </span>
)}
      
      {user?.isPremium && (
        <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1 whitespace-nowrap">
          <Sparkles size={14} /> PREMIUM
        </span>
      )}
    </div>
  </div>
</header>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div 
className="card">          <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-black tracking-tight">Create Loop</h2>
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
                 
className="btn-primary w-full py-5 text-xl"            >
                  Load Song
                </button>
              </div>

              {videoId && (
                <div className="mt-6 space-y-6"> 
                
<div className="relative">
  <div id="youtube-player" className="absolute opacity-0 pointer-events-none"></div>
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

                  <div className="bg-purple-900 bg-opacity-30 p-6 rounded-2xl border border-purple-700 border-opacity-50">
                    <label className="block text-lg font-bold text-purple-300 mb-3">Loop Repetitions</label>
             
             <select
  value={loopCount}
  onChange={(e) => setLoopCount(Number(e.target.value))}
  
className="btn-secondary px-5 py-4" aria-label="Number of loop repetitions"
>
  <option value={0}>Infinite Loop</option>
  <option value={1}>1 time</option>
  <option value={2}>2 times</option>
  <option value={3}>3 times</option>
  <option value={5}>5 times</option>
  <option value={10}>10 times</option>
</select>
                    {loopCount > 0 && currentLoopIteration > 0 && (
                      <p className="text-purple-300 text-lg mt-3">
                        Playing: {currentLoopIteration}/{loopCount}
                      </p>
                    )}
                  </div>

                  {loops.map((loop, idx) => (
                    <div key={idx} className="bg-purple-900 bg-opacity-30 p-6 rounded-2xl border border-purple-700 border-opacity-50">
                      <div className="flex justify-between items-center mb-5">
                        <h4 className="font-bold text-2xl">Loop {idx + 1} {idx === currentLoopIndex && isPlaying && 'Playing'}</h4>
                        {loops.length > 1 && (
                          <button onClick={() => removeLoop(idx)} className="text-red-400 hover:text-red-300 transition">
                            <X size={28} />
                          </button>
                        )}
                      </div>
                      
<div className="space-y-6">
  {/* START TIME */}
  <div>
    <label className="block text-lg font-bold text-purple-300 mb-3">
      Start: {Math.floor(loop.start/60)}:{(loop.start%60).toString().padStart(2,'0')}
    </label>
    
    {/* Slider */}
    <input
      type="range"
      min="0"
      max="600"
      step="1"
      value={loop.start}
      onChange={(e) => updateLoop(idx, 'start', e.target.value)}
      className="w-full mb-2"
    />
    
    {/* Manual Input */}
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
  </div>
  
  {/* END TIME - Same pattern */}
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
      max={Math.min(600, loop.start + 45)}
      step="1"
      value={loop.end}
      onChange={(e) => updateLoop(idx, 'end', e.target.value)}
      className="w-full mb-2"
    />
    
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
  </div>
</div>
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
        onClick={() => currentPlaylistPlayer?.shuffle()}
        className="px-5 py-3 bg-purple-700 rounded-xl hover:bg-purple-600 transition"
      >
        <Shuffle size={24} />
      </button>
      
      <button
        onClick={() => currentPlaylistPlayer?.toggleRepeat()}
        className={`px-5 py-3 rounded-xl transition ${
          currentPlaylistPlayer?.repeatPlaylist 
            ? 'bg-pink-600 hover:bg-pink-500' 
            : 'bg-purple-700 hover:bg-purple-600'
        }`}
      >
        <Repeat size={24} />
      </button>
      
      <button
        onClick={() => {
          currentPlaylistPlayer?.stop();
          setIsPlayingPlaylist(false);
          setCurrentPlaylistInfo(null);
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
                   
                   {user?.isPremium && (
  <button
    onClick={handleDownload}
    className="px-7 py-5 bg-green-700 hover:bg-green-600 rounded-xl transition"
    aria-label="Download loop as MP3"
  >
    <Download size={28} aria-hidden="true" />
  </button>
)}
                  </div>

                  <div className="flex gap-3 flex-wrap">
                    {loops.length < maxLoopsPerSong && (
                      <button
                        onClick={addLoop}
                        className="flex-1 min-w-[200px] py-5 text-lg bg-purple-700 bg-opacity-50 hover:bg-opacity-70 rounded-xl flex items-center justify-center gap-2 font-bold transition"
                      >
                        <Plus size={22} /> Add Loop ({loops.length}/{maxLoopsPerSong})
                      </button>
                    )}
                    <button
                      onClick={handlePostToFeed}
                      className="flex-1 min-w-[200px] py-5 text-lg bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl font-bold hover:shadow-xl transition"
                    >
                      Post to Feed
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-black bg-opacity-40 backdrop-blur-xl rounded-3xl p-6 border border-purple-700 border-opacity-50">
              <h3 className="font-black text-xl mb-4 flex items-center gap-2">
                <Sparkles size={24} className="text-yellow-400" />
                Why ChorusClip?
              </h3>
              <div className="bg-black bg-opacity-40 backdrop-blur-xl rounded-3xl p-6 border border-blue-700 border-opacity-50">
  <h3 className="font-black text-xl mb-4 flex items-center gap-2">
    <Users size={24} className="text-blue-400" />
    Who Is This For?
  </h3>
  <ul className="space-y-3 text-base text-purple-200">
    <li className="flex items-start gap-2">
      <span className="text-blue-400 text-lg">💒</span>
      <span><strong>Weddings:</strong> Practice walking down the aisle to your perfect song moment</span>
    </li>
    <li className="flex items-start gap-2">
      <span className="text-blue-400 text-lg">🎤</span>
      <span><strong>Choirs:</strong> Master tricky vocal parts by looping specific sections</span>
    </li>
    <li className="flex items-start gap-2">
      <span className="text-blue-400 text-lg">🙏</span>
      <span><strong>Worship:</strong> Meditate on powerful worship moments endlessly</span>
    </li>
    <li className="flex items-start gap-2">
      <span className="text-blue-400 text-lg">💪</span>
      <span><strong>Workouts:</strong> Loop your most motivating beat drops</span>
    </li>
    <li className="flex items-start gap-2">
      <span className="text-blue-400 text-lg">📚</span>
      <span><strong>Study:</strong> Focus music on repeat without interruption</span>
    </li>
    <li className="flex items-start gap-2">
      <span className="text-blue-400 text-lg">🎵</span>
      <span><strong>Music Lovers:</strong> Obsess over that ONE perfect 6-second kick!</span>
    </li>
  </ul>
</div>
              <ul className="space-y-3 text-base text-purple-200">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 text-lg">✨</span>
                  <span>Auto-detect most replayed sections</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 text-lg">🙏</span>
                  <span>Perfect for worship, study, workouts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 text-lg">🔄</span>
                  <span>Loop up to 3 sections per song (Premium)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 text-lg">💎</span>
                  <span>Download audio loops (Premium)</span>
                </li>
              </ul>
            </div>

            <div className="bg-black bg-opacity-40 backdrop-blur-xl rounded-3xl p-6 border border-red-700 border-opacity-50">
              <h3 className="font-black text-xl mb-4 flex items-center gap-2">
                <AlertCircle size={24} className="text-red-400" />
                Need Help?
              </h3>
              <p className="text-base text-purple-200 mb-4">
                Experiencing issues? Have feedback? We'd love to hear from you!
              </p>
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

          <div className="space-y-6">
            <div 
className="card"> <h2 className="text-3xl font-black tracking-tight mb-6">Trending Clips</h2>
              
              {clips.length === 0 ? (
                <div className="text-center py-12 text-purple-300">
                  <p className="text-xl mb-2">No clips yet!</p>
                  <p className="text-base">Be the first to post a loop</p>
                </div>
              ) : (
                <div className="space-y-4">
       
       {clips.map((clip) => {
  const clipLoops = clip.loops || [{ start: clip.startTime || 0, end: clip.endTime || 30 }];
  const firstLoop = clipLoops[0];
  
  return (
  <div
    key={clip.id}
    className="bg-purple-900 bg-opacity-30 rounded-2xl p-5 hover:bg-opacity-50 transition border border-purple-700 border-opacity-30"
    role="article"
    aria-label={`${clip.title} by ${clip.artist}`}
  >
    {/* Header: title, artist, loops, delete button */}
    <div className="flex justify-between items-start mb-3">
      <div className="flex-1">
        <h3 className="font-bold text-xl">{clip.title}</h3>
        <p className="text-base text-purple-300">{clip.artist}</p>
        <p className="text-sm text-purple-400 mt-1">
          by @{clip.createdBy} • {clipLoops.length} loop{clipLoops.length > 1 ? 's' : ''}
          {clip.loopCount > 0 && ` • ${clip.loopCount}x`}
        </p>
      </div>

     {/* Delete button if user owns the clip */}
{clip.userId === user?.uid && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      handleDeleteClip(clip.id);
    }}
    className="text-red-400 hover:text-red-300 transition ml-2"
    title="Delete clip"
    aria-label="Delete clip"
  >
    <X size={20} />
  </button>
)}

    </div>

    {/* Loop timestamps */}
    <div className="mb-3 space-y-1">
      {clipLoops.map((loop, idx) => (
        <div key={idx} className="text-sm text-purple-400">
          Loop {idx + 1}: {Math.floor(loop.start / 60)}:{(loop.start % 60).toString().padStart(2, '0')} -{' '}
          {Math.floor(loop.end / 60)}:{(loop.end % 60).toString().padStart(2, '0')}
        </div>
      ))}
    </div>

    {/* Footer: duration, like/play/share */}
    <div className="flex justify-between items-center text-base">
      <span className="text-purple-400 font-semibold">
        Duration: {Math.max(0, firstLoop.end - firstLoop.start)}s per loop
      </span>
      <div className="flex items-center gap-4">
        <span className="text-purple-300 text-base">{clip.likes || 0} ❤️</span>

        {/* Like / Unlike */}
        <button
          onClick={() =>
            user.likedClips.includes(clip.id)
              ? handleUnlikeClip(clip.id)
              : handleLikeClip(clip.id)
          }
          className={`transition transform hover:scale-110 ${
            user.likedClips.includes(clip.id)
              ? 'text-pink-500'
              : 'text-pink-400 hover:text-pink-300'
          }`}
          aria-label={
            user.likedClips.includes(clip.id)
              ? `Unlike ${clip.title}`
              : `Like ${clip.title}`
          }
          aria-pressed={user.likedClips.includes(clip.id)}
        >
          <Heart
            size={24}
            fill={user.likedClips.includes(clip.id) ? 'currentColor' : 'none'}
            aria-hidden="true"
          />
        </button>

        {/* Play */}
        <button
          onClick={() => handlePlayClip(clip.id, clip.youtubeVideoId, clip)}
          className="text-purple-300 hover:text-purple-100 transition flex items-center gap-1"
          aria-label={`Play ${clip.title} by ${clip.artist}`}
        >
          <Play size={16} fill="currentColor" aria-hidden="true" />
          <span>{clip.plays || 0}</span>
        </button>

        {/* Share */}
        <button
          onClick={() => handleShareClip(clip)}
          className="text-purple-400 hover:text-purple-300 transition"
          aria-label={`Share ${clip.title}`}
        >
          <Share2 size={18} aria-hidden="true" />
        </button>

        {/* Add to Playlist */}
        <button
  onClick={(e) => {
    e.stopPropagation();
    if (!user?.uid) {
      showNotification('Sign in to create playlists!', 'error');
      setShowAuthModal(true);
      return;
    }
    setSelectedClipsForPlaylist([...selectedClipsForPlaylist, clip]);
    showNotification('Added to playlist queue!', 'success');
  }}
  className="text-green-400 hover:text-green-300 transition"
  aria-label="Add to playlist"
>
  <Plus size={18} />
</button>
      </div>
    </div>
  </div>
);

})}
                </div>
              )}

              {!user?.isPremium && user?.uid &&(
                <div className="mt-6 p-6 bg-gradient-to-br from-purple-800 to-pink-800 rounded-2xl text-center border border-purple-500">
                  <div className="flex justify-center mb-4">
                    <Sparkles className="text-yellow-400" size={36} />
                  </div>
                  <p className="text-base mb-2">Free: {user.accountCreatedDaysAgo < 7 ? '10' : '3'} songs/day, 1 loop per song</p>
                  <p className="font-black text-3xl mb-4">Premium: KES 299/month</p>
                  <ul className="text-base text-left mb-6 space-y-2 bg-black bg-opacity-30 p-4 rounded-xl">
                    <li className="flex items-center gap-2">
                      <span className="text-green-400 text-lg">✓</span> Unlimited songs per day
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400 text-lg">✓</span> 3 loops per song (vs 1)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400 text-lg">✓</span> Download audio loops
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400 text-lg">✓</span> Create playlists
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400 text-lg">✓</span> No ads
                    </li>
                  </ul>
                  <button onClick={() => setShowPaymentModal(true)} className="w-full px-6 py-5 text-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-xl font-bold hover:shadow-2xl transition pulse-glow">
                    Upgrade Now
                  </button>
                </div>
              )}
            </div>

            <div className="bg-black bg-opacity-40 backdrop-blur-xl rounded-3xl p-6 border border-purple-700 border-opacity-50">
              <h3 className="font-black text-xl mb-4 flex items-center gap-2">
                Strathmore Leaderboard
              </h3>
              <p className="text-sm text-purple-300 mb-4">Top clip creators this week</p>
              {leaderboard.length === 0 ? (
                <div className="text-center py-8 text-purple-300">
                  <p className="text-base">No rankings yet!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((entry) => (
                    <div key={entry.rank} className="flex justify-between items-center bg-purple-900 bg-opacity-30 p-4 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">
                          {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                        </span>
                        <div>
                          <p className="font-bold text-lg">@{entry.name}</p>
                          <p className="text-sm text-purple-300">Top artist: {entry.artist}</p>
                        </div>
                      </div>
                      <span className="text-purple-300 font-bold text-xl">{entry.songs}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            
<div className="bg-black bg-opacity-40 backdrop-blur-xl rounded-3xl p-6 border border-purple-700 border-opacity-50 mb-6">
  <h3 className="font-black text-xl mb-4 flex items-center gap-2">
    <TrendingUp size={24} className="text-green-400" />
    Most Played Clips
  </h3>
  {trendingByPlays.map((clip, idx) => (
    <div key={clip.id} className="flex justify-between items-center bg-purple-900 bg-opacity-30 p-4 rounded-xl mb-2">
      <div>
        <p className="font-bold">{idx + 1}. {clip.title}</p>
        <p className="text-sm text-purple-300">{clip.artist}</p>
      </div>
      <span className="text-green-400 font-bold">{clip.plays || 0} plays</span>
    </div>
  ))}
</div>

<div className="bg-black bg-opacity-40 backdrop-blur-xl rounded-3xl p-6 border border-purple-700 border-opacity-50">
  <h3 className="font-black text-xl mb-4 flex items-center gap-2">
    <Music size={24} className="text-pink-400" />
    Top Artists
  </h3>
  <div className="space-y-3">
    {topArtists.map((item, idx) => (
      <div key={idx} className="flex items-center gap-4 bg-purple-900 bg-opacity-30 p-4 rounded-xl hover:bg-opacity-50 transition group">
        <span className="text-2xl font-bold text-purple-400 w-8">{idx + 1}</span>
        
        {/* Artist Image */}
        <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-purple-600 group-hover:border-yellow-400 transition flex-shrink-0">
          {artistImages[item.artist] ? (
            <img
              src={artistImages[item.artist]}
              alt={item.artist}
              className="w-full h-full object-cover"
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
</div>
          </div>
        </div>
      
      

{selectedClipsForPlaylist.length > 0 && (
  <button
    onClick={() => setShowPlaylistModal(true)}
    className="fixed bottom-8 right-8 bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-4 rounded-full shadow-2xl z-40 flex items-center gap-2 font-bold animate-pulse"
  >
    <Plus size={24} />
    Create Playlist ({selectedClipsForPlaylist.length})
  </button>
)}</div>
    </div>
  );
};