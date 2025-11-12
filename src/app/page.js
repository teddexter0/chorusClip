'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Share2, Heart, Plus, X, AlertCircle, Video, Download, Sparkles, LogOut, Mail, Lock, User, Phone, CheckCircle, XCircle, Users, TrendingUp, Music } from 'lucide-react';
// NOTIFICATION COMPONENT
const Notification = ({ message, type, onClose }) => {
  const bgColor = type === 'success' ? 'from-green-600 to-green-700' : type === 'error' ? 'from-red-600 to-red-700' : 'from-blue-600 to-blue-700';
  const Icon = type === 'success' ? CheckCircle : type === 'error' ? XCircle : AlertCircle;

  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-20 right-4 z-50 bg-gradient-to-r ${bgColor} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-slideIn max-w-md`}>
      <Icon size={28} />
      <p className="font-semibold text-lg">{message}</p>
      <button onClick={onClose} className="ml-4 hover:bg-white hover:bg-opacity-20 rounded-full p-1">
        <X size={20} />
      </button>
    </div>
  );
};

// AUTH MODAL COMPONENT

const AuthModal = ({ onClose, onSuccess }) => {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'signin') {
        await signInUser(email, password);
        onSuccess?.('✅ Welcome back!');
        onClose();
      } else if (mode === 'signup') {
        await signUpUser(email, password, displayName);
        onSuccess?.('🎉 Account created! Welcome!');
        onClose();
      } else if (mode === 'reset') {
        await sendPasswordResetEmail(email);
        onSuccess?.('✉️ Check your inbox for reset link!');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'Something went wrong!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-3xl p-8 max-w-md w-full border border-purple-500 my-8 relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-white hover:text-purple-300 transition"
          aria-label="Close dialog"
        >
          <X size={32} aria-hidden="true" />
        </button>

        <h2 className="text-4xl font-black mb-6">
          {mode === 'reset' ? 'Reset Password' : mode === 'signup' ? 'Create Account' : 'Welcome Back'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-base font-bold text-purple-300 mb-2">Display Name</label>
              <div className="relative">
                <User className="absolute left-3 top-4 text-purple-400" size={22} />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="john_doe"
                  className="w-full pl-12 pr-4 py-4 text-lg bg-purple-950 bg-opacity-50 border border-purple-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-base font-bold text-purple-300 mb-2">Strathmore Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-4 text-purple-400" size={22} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.name@strathmore.edu"
                className="w-full pl-12 pr-4 py-4 text-lg bg-purple-950 bg-opacity-50 border border-purple-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                required
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div>
              <label className="block text-base font-bold text-purple-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-4 text-purple-400" size={22} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 text-lg bg-purple-950 bg-opacity-50 border border-purple-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  required
                />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-xl p-4 text-base">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 text-xl bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold hover:shadow-2xl transition disabled:opacity-50"
          >
            {loading
              ? 'Loading...'
              : mode === 'reset'
              ? 'Send Reset Link'
              : mode === 'signup'
              ? 'Create Account'
              : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          {mode !== 'reset' && (
            <button
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-purple-300 hover:text-purple-200 text-base font-semibold"
            >
              {mode === 'signin'
                ? "Don't have an account? Sign Up"
                : 'Already have an account? Sign In'}
            </button>
          )}
          <button
            onClick={() => setMode(mode === 'reset' ? 'signin' : 'reset')}
            className="text-purple-400 hover:text-purple-300 text-base"
          >
            {mode === 'reset' ? '← Back to Sign In' : 'Forgot Password?'}
          </button>
        </div>
      </div>
    </div>
  );
};

// PAYMENT MODAL
const PaymentModal = ({ onClose, userEmail, onSuccess }) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatPhone = (value) => {
    let cleaned = value.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('7')) {
      cleaned = '254' + cleaned;
    } else if (cleaned.startsWith('+254')) {
      cleaned = cleaned.substring(1);
    } else if (!cleaned.startsWith('254')) {
      cleaned = '254' + cleaned;
    }
    return cleaned.substring(0, 12);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formattedPhone = formatPhone(phone);
    if (!formattedPhone.match(/^254\d{9}$/)) {
      setError('Invalid phone number. Use format: 0712345678 or 712345678');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userEmail,
          amount: 299,
          email: userEmail,
          phone: formattedPhone
        })
      });

      const data = await response.json();
      
      if (data.success && data.iframeUrl) {
        window.location.href = data.iframeUrl;
      } else {
        setError(`❌ ${data.error || 'Payment initiation failed. Please try again.'}`);
        setLoading(false);
      }
    } catch (error) {
      setError('❌ Payment error. Please try again later.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-3xl p-8 max-w-md w-full border border-yellow-500">
        <button onClick={onClose} className="float-right text-white hover:text-purple-300 transition">
          <X size={32} />
        </button>
        
        <h2 className="text-4xl font-black mb-4">Upgrade to Premium</h2>
        <p className="text-purple-200 mb-6 text-lg">KES 299/month - Cancel anytime</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-base font-bold text-purple-300 mb-2">M-Pesa Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-4 text-purple-400" size={22} />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0712345678"
                className="w-full pl-12 pr-4 py-4 text-lg bg-purple-950 bg-opacity-50 border border-purple-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                required
              />
            </div>
            <p className="text-sm text-purple-300 mt-2">
              Format: 0712345678 or 712345678 (we'll add +254)
            </p>
          </div>

          {error && (
            <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-xl p-4 text-base">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 text-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-xl font-bold hover:shadow-2xl transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Pay KES 299'}
          </button>
        </form>

        <p className="text-sm text-purple-300 text-center mt-4">
          You'll be redirected to Pesapal to complete payment
        </p>
      </div>
    </div>
  );
};

export default function ChorusClipModern() {
  const [user, setUser] = useState({
    uid: null,
    displayName: 'Guest',
    email: '',
    isPremium: false,
    songsToday: 0,
    accountCreatedDaysAgo: 0,
    likedClips: []
  });

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
      checkAuthState();
    }
  }, []);
const checkAuthState = async () => {
  try {
    const { auth, getUserData, db, checkAndResetDailyLimit } = await import('../lib/firebase');
    const { onAuthStateChanged } = await import('firebase/auth');
    const { doc, getDoc } = await import('firebase/firestore');
onAuthStateChanged(auth, async (firebaseUser) => {
  if (!firebaseUser) {
    return setUser({
      uid: null,
      displayName: 'Guest',
      email: '',
      isPremium: false,
      songsToday: 0,
      accountCreatedDaysAgo: 0,
      likedClips: []
    });
  }
  }
  );
  }
  catch (error) {
    console.error('Auth check failed:', error);
  }
};


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
          onReady: onPlayerReady, 
          onStateChange: onPlayerStateChange
        }
      });
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
    if (!playerRef.current || !playerRef.current.getCurrentTime || !playerRef.current.getPlayerState) {
      return;
    }
    
    try {
      const time = playerRef.current.getCurrentTime();
      const state = playerRef.current.getPlayerState();
      
      setPlayerCurrentTime(time);
      
      // Only track when actually PLAYING
      if (state !== window.YT.PlayerState.PLAYING) {
        return;
      }
      
      // Validate we have loops
      if (!loops || loops.length === 0 || !loops[currentLoopIndex]) {
        console.error('No valid loops to track');
        return;
      }
      
      const currentLoop = loops[currentLoopIndex];
      
      // Check if we've passed the END of current loop
      if (time >= currentLoop.end - 0.3) {
        console.log(`🔄 Loop ${currentLoopIndex + 1}/${loops.length} ended at ${time.toFixed(1)}s`);
        
        // Are we on the LAST loop in the sequence?
        if (currentLoopIndex < loops.length - 1) {
          // Move to NEXT loop
          const nextIndex = currentLoopIndex + 1;
          setCurrentLoopIndex(nextIndex);
          playerRef.current.seekTo(loops[nextIndex].start, true);
          console.log(`➡️ Moving to loop ${nextIndex + 1} at ${loops[nextIndex].start}s`);
        } else {
          // We finished ALL loops - check if we should repeat
          const newIteration = currentLoopIteration + 1;
          
          // If loopCount is 0, loop forever
          if (loopCount === 0) {
            console.log(`🔁 Infinite loop - restarting sequence (iteration ${newIteration})`);
            setCurrentLoopIteration(newIteration);
            setCurrentLoopIndex(0);
            playerRef.current.seekTo(loops[0].start, true);
          } else if (newIteration < loopCount) {
            // Haven't reached limit yet
            console.log(`🔁 Iteration ${newIteration}/${loopCount} - restarting`);
            setCurrentLoopIteration(newIteration);
            setCurrentLoopIndex(0);
            playerRef.current.seekTo(loops[0].start, true);
          } else {
            // Reached the limit - STOP
            console.log(`✅ Completed ${loopCount} iterations - STOPPING`);
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
  }, 200); // Check every 200ms
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
  
  if (!newName) return; // User cancelled
  
  if (newName.length < 3 || newName.length > 20) {
    showNotification('Invalid name. Must be 3-20 characters.', 'error');
    return;
  }
  
  const validPattern = /^[a-zA-Z0-9_\s]+$/;
  if (!validPattern.test(newName)) {
    showNotification('Only letters, numbers, underscores, and spaces allowed.', 'error');
    return;
  }
  
  try {
    const { db } = await import('../lib/firebase');
    const { doc, updateDoc } = await import('firebase/firestore');
    
    await updateDoc(doc(db, 'users', user?.uid), {
      displayName: newName
    });
    
    setUser(prev => ({ ...prev, displayName: newName }));
    showNotification('✅ Username updated!', 'success');
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
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Poppins:wght@400;500;600;700;800&display=swap');
        * { 
          font-family: 'Poppins', 'Montserrat', sans-serif;
          letter-spacing: -0.02em;
        }
        h1, h2, h3 {
          font-family: 'Montserrat', sans-serif;
          font-weight: 800;
        }
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(168, 85, 247, 0.4); }
          50% { box-shadow: 0 0 40px rgba(168, 85, 247, 0.8); }
        }
        .pulse-glow { animation: pulse-glow 2s infinite; }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slideIn { animation: slideIn 0.3s ease-out; }
        
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 10px;
          background: linear-gradient(to right, #a855f7 0%, #ec4899 100%);
          border-radius: 10px;
          outline: none;
          opacity: 0.9;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 28px;
          height: 28px;
          background: #fff;
          border: 4px solid #a855f7;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 12px rgba(168, 85, 247, 0.8);
        }
        input[type="range"]::-moz-range-thumb {
          width: 28px;
          height: 28px;
          background: #fff;
          border: 4px solid #a855f7;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 12px rgba(168, 85, 247, 0.8);
        }
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
          userEmail={user.email}
          onSuccess={(msg) => showNotification(msg, 'success')}
        />
      )}

      {showTutorial && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full relative border border-purple-500 my-8 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowTutorial(false)} className="absolute top-4 right-4 text-white hover:text-purple-300 transition z-10">
              <X size={32} />
            </button>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 flex items-center gap-3 pr-12">
              <Sparkles className="text-yellow-400 flex-shrink-0" size={36} />
              <span>Welcome to ChorusClip!</span>
            </h2>
            <div className="bg-black bg-opacity-50 rounded-2xl p-6 sm:p-8 mb-6 flex flex-col items-center justify-center aspect-video">
              <Video size={72} className="text-purple-400 mb-4" />
              <p className="text-purple-300 text-center text-base sm:text-lg">Quick tutorial:<br/>1. Paste YouTube link<br/>2. Adjust loop points<br/>3. Play and enjoy!</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 text-base mb-6">
              <div className="bg-purple-800 bg-opacity-50 p-5 rounded-xl">
                <p className="font-semibold mb-2 text-lg">Step 1</p>
                <p className="text-purple-200">Paste YouTube link</p>
              </div>
              <div className="bg-purple-800 bg-opacity-50 p-5 rounded-xl">
                <p className="font-semibold mb-2 text-lg">Step 2</p>
                <p className="text-purple-200">Auto-detect best part</p>
              </div>
              <div className="bg-purple-800 bg-opacity-50 p-5 rounded-xl">
                <p className="font-semibold mb-2 text-lg">Step 3</p>
                <p className="text-purple-200">Loop endlessly!</p>
              </div>
              <div className="bg-purple-800 bg-opacity-50 p-5 rounded-xl">
                <p className="font-semibold mb-2 text-lg">Premium</p>
                <p className="text-purple-200">3 loops, playlists, downloads</p>
              </div>
            </div>
            <button onClick={() => setShowTutorial(false)} className="w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-xl hover:shadow-2xl transition pulse-glow">
              Lets Go!
            </button>
          </div>
        </div>
      )}

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

      {showMostReplayedSuggestion && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-3xl p-8 max-w-md w-full border border-purple-500">
            <h3 className="text-3xl font-bold mb-4">Smart Loop Suggestion!</h3>
            <p className="text-purple-200 mb-2 text-xl">Suggested section: {Math.floor(suggestedStart/60)}:{(suggestedStart%60).toString().padStart(2,'0')} - {Math.floor(suggestedEnd/60)}:{(suggestedEnd%60).toString().padStart(2,'0')}</p>
            <p className="text-base text-purple-300 mb-6">This is typically where the chorus/hook is. You can adjust using the sliders below.</p>
            <div className="space-y-3">
              <button onClick={applySuggestedLoop} className="w-full py-5 text-xl bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold hover:shadow-2xl transition pulse-glow">
                Use This Section
              </button>
              <button onClick={dismissSuggestion} className="w-full py-4 text-lg bg-purple-800 bg-opacity-50 rounded-xl hover:bg-opacity-70 transition">
                I'll Choose Manually
              </button>
            </div>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-black bg-opacity-40 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-purple-700 border-opacity-50">
              <div className="flex justify-between items-center mb-6">
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
                    className="w-full px-5 py-4 text-lg bg-purple-950 bg-opacity-50 border border-purple-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-purple-400 transition"
                  />
                </div>
                <button
                  onClick={handleUrlSubmit}
                  className="w-full py-5 text-xl bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold hover:shadow-2xl transition pulse-glow"
                >
                  Load Song
                </button>
              </div>

              {videoId && (
                <div className="mt-6 space-y-6">
// In page.js, replace the player div:
<div id="youtube-player" className="w-full aspect-video bg-black rounded-2xl overflow-hidden border border-purple-700 hidden"></div>

// Add below it:
<div className="w-full aspect-video bg-gradient-to-br from-purple-900 to-pink-900 rounded-2xl flex items-center justify-center border border-purple-700">
  <div className="text-center">
    <Music size={64} className="mx-auto mb-4 text-purple-400" />
    <p className="text-xl font-bold">Audio Only Mode</p>
    <p className="text-purple-300">Video hidden to maintain focus</p>
  </div>
</div>                  
                  {videoTitle && (
                    <div className="text-center">
                      <p className="font-bold text-2xl">{videoTitle}</p>
                      <p className="text-purple-300 text-xl">{artist}</p>
                      <p className="text-purple-400 text-base mt-1">
                        Current time: {Math.floor(playerCurrentTime/60)}:{Math.floor(playerCurrentTime%60).toString().padStart(2,'0')}
                      </p>
                    </div>
                  )}

                  <div className="bg-purple-900 bg-opacity-30 p-6 rounded-2xl border border-purple-700 border-opacity-50">
                    <label className="block text-lg font-bold text-purple-300 mb-3">Loop Repetitions</label>
             
             <select
  value={loopCount}
  onChange={(e) => setLoopCount(Number(e.target.value))}
  className="w-full px-5 py-4 text-lg bg-purple-950 bg-opacity-70 border border-purple-600 rounded-xl text-white font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
  aria-label="Number of loop repetitions"
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
  className="flex-1 min-w-[200px] py-5 text-xl bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center gap-2 font-bold hover:shadow-xl transition"
  aria-label={isPlaying ? 'Pause playback' : 'Play loop'}
  aria-pressed={isPlaying}
>
  {isPlaying ? <Pause size={28} aria-hidden="true" /> : <Play size={28} aria-hidden="true" />}
  {isPlaying ? 'Pause' : 'Play'}
</button>
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
            <div className="bg-black bg-opacity-40 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-purple-700 border-opacity-50">
              <h2 className="text-3xl font-black tracking-tight mb-6">Trending Clips</h2>
              
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
      </div>
    </div>
  </div>
);

})}
                </div>
              )}

              {!user?.isPremium && (
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
  {topArtists.map((item, idx) => (
    <div key={idx} className="flex justify-between items-center bg-purple-900 bg-opacity-30 p-4 rounded-xl mb-2">
      <div>
        <p className="font-bold">{idx + 1}. {item.artist}</p>
      </div>
      <span className="text-pink-400 font-bold">{item.clips} clips</span>
    </div>
  ))}
</div>
          </div>
        </div>
      </div>
    </div>
  );
};