'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Share2, Heart, Plus, X, AlertCircle, Video, Download, Sparkles, LogOut, Mail, Lock, User, Phone, CheckCircle, XCircle } from 'lucide-react';

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
      <Icon size={24} />
      <p className="font-semibold">{message}</p>
      <button onClick={onClose} className="ml-4 hover:bg-white hover:bg-opacity-20 rounded-full p-1">
        <X size={18} />
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
    setError('');
    setLoading(true);

    if (!email.endsWith('@strathmore.edu')) {
      setError('Please use a Strathmore email (@strathmore.edu)');
      setLoading(false);
      return;
    }

    try {
      const { signInUser, signUpUser, resetPassword, auth } = await import('../lib/firebase');
      const { fetchSignInMethodsForEmail } = await import('firebase/auth');

      if (mode === 'reset') {
        await resetPassword(email);
        onSuccess('✅ Password reset email sent! Check your inbox (and spam folder).');
        onClose();
      } else if (mode === 'signup') {
        if (!displayName || displayName.length < 3) {
          setError('Display name must be at least 3 characters');
          setLoading(false);
          return;
        }
        if (!password || password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }

        // Check if email exists first
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if (methods.length > 0) {
          setError('❌ Email already registered! Please sign in instead.');
          setLoading(false);
          return;
        }

        await signUpUser(email, password, displayName);
        onSuccess(`✅ Account created! Verification email sent to ${email}. Check spam folder!`);
        onClose();
      } else {
        // Sign in
        if (!password || password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }

        // Check if email exists
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if (methods.length === 0) {
          setError('❌ No account found with this email. Please sign up first!');
          setLoading(false);
          return;
        }

        await signInUser(email, password);
        onSuccess('✅ Welcome back!');
        onClose();
      }
    } catch (error) {
      if (error.code === 'auth/wrong-password') {
        setError('❌ Incorrect password! Try "Forgot Password" to reset.');
      } else if (error.code === 'auth/invalid-credential') {
        setError('❌ Invalid credentials! Check your email and password.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('❌ Too many attempts. Try again later or reset your password.');
      } else {
        setError(`❌ ${error.message}`);
      }
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-3xl p-8 max-w-md w-full border border-purple-500 my-8">
        <button onClick={onClose} className="float-right text-white hover:text-purple-300 transition">
          <X size={28} />
        </button>
        
        <h2 className="text-3xl font-black mb-6">
          {mode === 'reset' ? 'Reset Password' : mode === 'signup' ? 'Create Account' : 'Welcome Back'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-bold text-purple-300 mb-2">Display Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-purple-400" size={20} />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="john_doe"
                  className="w-full pl-10 pr-4 py-3 bg-purple-950 bg-opacity-50 border border-purple-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-purple-300 mb-2">Strathmore Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-purple-400" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.name@strathmore.edu"
                className="w-full pl-10 pr-4 py-3 bg-purple-950 bg-opacity-50 border border-purple-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                required
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div>
              <label className="block text-sm font-bold text-purple-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-purple-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-purple-950 bg-opacity-50 border border-purple-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  required
                />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-xl p-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-lg hover:shadow-2xl transition disabled:opacity-50"
          >
            {loading ? 'Loading...' : mode === 'reset' ? 'Send Reset Link' : mode === 'signup' ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          {mode !== 'reset' && (
            <>
              <button
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-purple-300 hover:text-purple-200 text-sm font-semibold"
              >
                {mode === 'signin' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
              </button>
              <br />
            </>
          )}
          <button
            onClick={() => setMode(mode === 'reset' ? 'signin' : 'reset')}
            className="text-purple-400 hover:text-purple-300 text-sm"
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
        // Redirect to Pesapal payment page
        window.location.href = data.iframeUrl;
      } else {
        setError('❌ Payment initiation failed. Please try again.');
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
          <X size={28} />
        </button>
        
        <h2 className="text-3xl font-black mb-4">Upgrade to Premium</h2>
        <p className="text-purple-200 mb-6">KES 299/month - Cancel anytime</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-purple-300 mb-2">M-Pesa Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 text-purple-400" size={20} />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0712345678"
                className="w-full pl-10 pr-4 py-3 bg-purple-950 bg-opacity-50 border border-purple-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                required
              />
            </div>
            <p className="text-xs text-purple-300 mt-2">
              Format: 0712345678 or 712345678 (we'll add +254)
            </p>
          </div>

          {error && (
            <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-xl p-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-xl font-bold text-lg hover:shadow-2xl transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Pay KES 299'}
          </button>
        </form>

        <p className="text-xs text-purple-300 text-center mt-4">
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
  const [loops, setLoops] = useState([{ start: 20, end: 50 }]); // DEFAULT: 20s to 50s (30 sec loop)
  const [userHasManuallyAdjusted, setUserHasManuallyAdjusted] = useState(false);
  const [currentLoopIndex, setCurrentLoopIndex] = useState(0);
  const [loopCount, setLoopCount] = useState(0);
  const [currentLoopIteration, setCurrentLoopIteration] = useState(0);
  
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

  const playerRef = useRef(null);
  const intervalRef = useRef(null);

  const songsLimit = user.accountCreatedDaysAgo < 7 ? 10 : 3;
  const songsRemaining = songsLimit - user.songsToday;
  const maxLoopsPerSong = user.isPremium ? 3 : 1;

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
      checkAuthState();
    }
  }, []);

  const checkAuthState = async () => {
    try {
      const { auth, getUserData, db } = await import('../lib/firebase');
      const { onAuthStateChanged } = await import('firebase/auth');
      const { doc, getDoc } = await import('firebase/firestore');
      
      onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const userData = await getUserData(firebaseUser.uid);
          
          // Get user's liked clips
          let likedClips = [];
          try {
            const likesDoc = await getDoc(doc(db, 'userLikes', firebaseUser.uid));
            if (likesDoc.exists()) {
              likedClips = likesDoc.data().likedClips || [];
            }
          } catch (e) {}
          
          if (userData) {
            setUser({
              uid: firebaseUser.uid,
              displayName: userData.displayName,
              email: userData.email,
              isPremium: userData.isPremium || false,
              songsToday: userData.clipsToday || 0,
              accountCreatedDaysAgo: Math.floor((Date.now() - userData.accountCreated.toDate().getTime()) / (1000 * 60 * 60 * 24)),
              likedClips
            });
            loadTrendingClips();
            loadLeaderboard();
          }
        }
      });
    } catch (error) {
      console.log('Auth check failed:', error);
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
      console.log('Using demo leaderboard');
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
    setSuggestedStart(0);
    setSuggestedEnd(30);
    setShowMostReplayedSuggestion(true);
  };

  const handleUrlSubmit = async () => {
    if (!user.isPremium && songsRemaining <= 0) {
      showNotification('Daily song limit reached! Upgrade to Premium for unlimited songs.', 'error');
      return;
    }

    const id = extractVideoId(youtubeUrl);
    if (id) {
      setVideoId(id);
      // Reset to default: 20-50s loop
      setLoops([{ start: 20, end: 50 }]);
      setUserHasManuallyAdjusted(false);
      setCurrentLoopIndex(0);
      setCurrentLoopIteration(0);
      await fetchMostReplayed();
      loadYouTubePlayer(id);
      
      const newCount = user.songsToday + 1;
      setUser(prev => ({ ...prev, songsToday: newCount }));
      localStorage.setItem('songsToday', newCount.toString());

      if (songsRemaining === 3 && !user.isPremium) {
        setShowSongsWarning(true);
      }
    }
  };

  const applySuggestedLoop = () => {
    // User clicked "Use This Section" - use suggested times
    setLoops([{ start: suggestedStart, end: suggestedEnd }]);
    setUserHasManuallyAdjusted(false); // Reset flag since we're using suggestion
    setShowMostReplayedSuggestion(false);
    
    setTimeout(() => {
      if (playerRef.current && playerRef.current.seekTo) {
        playerRef.current.seekTo(suggestedStart, true);
        playerRef.current.playVideo();
        console.log(`✅ Applied suggested loop: ${suggestedStart}s - ${suggestedEnd}s`);
      }
    }, 800);
  };

  const dismissSuggestion = () => {
    // User clicked "Choose Manually" - keep default 20-50s
    setUserHasManuallyAdjusted(true); // User wants manual control
    setShowMostReplayedSuggestion(false);
    
    setTimeout(() => {
      if (playerRef.current && playerRef.current.seekTo) {
        // Start at 20 seconds (our default)
        playerRef.current.seekTo(20, true);
        console.log(`✅ Manual mode: Starting at 20s`);
      }
    }, 800);
  };

  const loadYouTubePlayer = (id) => {
    if (window.YT && window.YT.Player) {
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
      
      playerRef.current = new window.YT.Player('youtube-player', {
        videoId: id,
        playerVars: { autoplay: 0, controls: 1, enablejsapi: 1 },
        events: { onReady: onPlayerReady, onStateChange: onPlayerStateChange }
      });
    }
  };

  const onPlayerReady = (event) => {
    const title = event.target.getVideoData().title;
    setVideoTitle(title);
    setArtist(extractArtist(title));
    
    // Seek to current loop start (respects user's choice or default 20s)
    setTimeout(() => {
      if (playerRef.current) {
        const startTime = loops[0].start;
        playerRef.current.seekTo(startTime, true);
        console.log(`✅ Player ready, seeking to ${startTime}s`);
      }
    }, 800);
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

  const startTimeTracking = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    intervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime && playerRef.current.getPlayerState) {
        const time = playerRef.current.getCurrentTime();
        const state = playerRef.current.getPlayerState();
        
        if (state === window.YT.PlayerState.PLAYING) {
          const currentLoop = loops[currentLoopIndex];
          
          if (time >= currentLoop.end - 0.1) {
            if (loopCount > 0 && currentLoopIteration >= loopCount) {
              playerRef.current.pauseVideo();
              setCurrentLoopIteration(0);
              return;
            }

            if (currentLoopIndex < loops.length - 1) {
              const nextIndex = currentLoopIndex + 1;
              setCurrentLoopIndex(nextIndex);
              playerRef.current.seekTo(loops[nextIndex].start, true);
            } else {
              setCurrentLoopIndex(0);
              setCurrentLoopIteration(prev => prev + 1);
              playerRef.current.seekTo(loops[0].start, true);
            }
          }
        }
      }
    }, 100);
  };

  const stopTimeTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const togglePlayPause = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }
  };

  const handleLoopRestart = () => {
    if (playerRef.current) {
      setCurrentLoopIndex(0);
      setCurrentLoopIteration(0);
      playerRef.current.seekTo(loops[0].start, true);
      playerRef.current.playVideo();
    }
  };

  const addLoop = () => {
    if (loops.length >= maxLoopsPerSong) {
      showNotification(`${user.isPremium ? 'Maximum 3' : 'Free tier: Only 1'} loop${user.isPremium ? 's' : ''} per song.`, 'error');
      return;
    }
    setLoops([...loops, { start: 0, end: 30 }]);
  };

  const updateLoop = (index, field, value) => {
    const newLoops = [...loops];
    const numValue = Number(value);
    
    // Mark that user has manually adjusted
    setUserHasManuallyAdjusted(true);
    
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
    
    // IMMEDIATE seek when user adjusts sliders (ALWAYS respect user input)
    if (playerRef.current && index === currentLoopIndex && playerRef.current.seekTo) {
      const seekTime = newLoops[index][field];
      playerRef.current.seekTo(seekTime, true);
      console.log(`✅ User manually adjusted ${field} to ${seekTime}s, seeking immediately`);
    }
  };

  const removeLoop = (index) => {
    if (loops.length === 1) return;
    setLoops(loops.filter((_, i) => i !== index));
    if (currentLoopIndex >= loops.length - 1) setCurrentLoopIndex(0);
  };

  const handleDownload = async () => {
    if (!user.isPremium) {
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

  const handlePostToFeed = async () => {
    if (!videoId) {
      showNotification('Load a song first!', 'error');
      return;
    }
    if (!user.uid) {
      showNotification('Sign in to post!', 'error');
      setShowAuthModal(true);
      return;
    }

    const loop = loops[0];
    const clipData = {
      title: videoTitle,
      artist,
      youtubeVideoId: videoId,
      startTime: loop.start,
      endTime: loop.end,
      userId: user.uid,
      createdBy: user.displayName,
      likes: 0,
      plays: 0
    };

    try {
      const { createClip } = await import('../lib/firebase');
      await createClip(clipData);
      showNotification('✅ Posted to feed!', 'success');
    } catch (error) {
      showNotification('Failed to post. Try again.', 'error');
    }
  };

  const handleLikeClip = async (clipId) => {
    if (!user.uid) {
      showNotification('Sign in to like clips!', 'error');
      setShowAuthModal(true);
      return;
    }

    if (user.likedClips.includes(clipId)) {
      showNotification('You already liked this clip!', 'info');
      return;
    }
    
    try {
      const { db } = await import('../lib/firebase');
      const { doc, updateDoc, increment, setDoc, arrayUnion } = await import('firebase/firestore');
      
      await updateDoc(doc(db, 'clips', clipId), {
        likes: increment(1)
      });

      await setDoc(doc(db, 'userLikes', user.uid), {
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

  const handlePlayClip = async (clipId, videoId, startTime) => {
    try {
      const { db } = await import('../lib/firebase');
      const { doc, updateDoc, increment } = await import('firebase/firestore');
      
      // Increment play count
      await updateDoc(doc(db, 'clips', clipId), {
        plays: increment(1)
      });

      // Load the clip's video
      setYoutubeUrl(`https://youtube.com/watch?v=${videoId}`);
      setVideoId(videoId);
      setLoops([{ start: startTime, end: startTime + 30 }]);
      loadYouTubePlayer(videoId);
      
      showNotification('▶️ Playing clip...', 'info');
    } catch (error) {
      console.error('Play error:', error);
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
        
        // Track share
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
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        showNotification('🔗 Link copied to clipboard!', 'success');
      } catch (error) {
        showNotification('Failed to copy link', 'error');
      }
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
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 text-white relative overflow-hidden">
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
          height: 8px;
          background: linear-gradient(to right, #a855f7 0%, #ec4899 100%);
          border-radius: 10px;
          outline: none;
          opacity: 0.9;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          background: #fff;
          border: 3px solid #a855f7;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.8);
        }
        input[type="range"]::-moz-range-thumb {
          width: 24px;
          height: 24px;
          background: #fff;
          border: 3px solid #a855f7;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.8);
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
              <X size={28} />
            </button>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 flex items-center gap-3 pr-12">
              <Sparkles className="text-yellow-400 flex-shrink-0" size={32} />
              <span>Welcome to ChorusClip!</span>
            </h2>
            <div className="bg-black bg-opacity-50 rounded-2xl p-4 sm:p-8 mb-4 sm:mb-6 flex flex-col items-center justify-center aspect-video">
              <Video size={60} className="text-purple-400 mb-4" />
              <p className="text-purple-300 text-center text-sm sm:text-base">Quick tutorial:<br/>1. Paste YouTube link<br/>2. Adjust loop points<br/>3. Play & enjoy!</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm mb-4 sm:mb-6">
              <div className="bg-purple-800 bg-opacity-50 p-3 sm:p-4 rounded-xl">
                <p className="font-semibold mb-2">🎵 Step 1</p>
                <p className="text-purple-200">Paste YouTube link</p>
              </div>
              <div className="bg-purple-800 bg-opacity-50 p-3 sm:p-4 rounded-xl">
                <p className="font-semibold mb-2">⏱️ Step 2</p>
                <p className="text-purple-200">Auto-detect best part</p>
              </div>
              <div className="bg-purple-800 bg-opacity-50 p-3 sm:p-4 rounded-xl">
                <p className="font-semibold mb-2">🔄 Step 3</p>
                <p className="text-purple-200">Loop endlessly!</p>
              </div>
              <div className="bg-purple-800 bg-opacity-50 p-3 sm:p-4 rounded-xl">
                <p className="font-semibold mb-2">💎 Premium</p>
                <p className="text-purple-200">3 loops, playlists, downloads</p>
              </div>
            </div>
            <button onClick={() => setShowTutorial(false)} className="w-full py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-base sm:text-lg hover:shadow-2xl transition pulse-glow">
              Let's Go! 🚀
            </button>
          </div>
        </div>
      )}

      {showSongsWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-3xl p-8 max-w-md w-full border border-yellow-500">
            <div className="flex items-center gap-4 mb-4">
              <AlertCircle className="text-yellow-400" size={40} />
              <h3 className="text-2xl font-bold">Only {songsRemaining} Songs Left Today!</h3>
            </div>
            <p className="text-purple-200 mb-6 text-lg">Upgrade to Premium for unlimited songs + 3 loops per song!</p>
            <div className="space-y-3">
              <button onClick={() => { setShowSongsWarning(false); setShowPaymentModal(true); }} className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-xl font-bold text-lg hover:shadow-2xl transition">
                Upgrade - KES 299/mo
              </button>
              <button onClick={() => setShowSongsWarning(false)} className="w-full py-3 bg-purple-800 bg-opacity-50 rounded-xl hover:bg-opacity-70 transition">
                Continue with Free
              </button>
            </div>
          </div>
        </div>
      )}

      {showMostReplayedSuggestion && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-3xl p-8 max-w-md w-full border border-purple-500">
            <h3 className="text-2xl font-bold mb-4">🎯 Suggested Loop Section!</h3>
            <p className="text-purple-200 mb-4">Start from: {Math.floor(suggestedStart/60)}:{(suggestedStart%60).toString().padStart(2,'0')} - {Math.floor(suggestedEnd/60)}:{(suggestedEnd%60).toString().padStart(2,'0')}</p>
            <p className="text-sm text-purple-300 mb-6">You can adjust the loop points using the sliders below</p>
            <div className="space-y-3">
              <button onClick={applySuggestedLoop} className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold hover:shadow-2xl transition pulse-glow">
                Use This Section ✨
              </button>
              <button onClick={dismissSuggestion} className="w-full py-3 bg-purple-800 bg-opacity-50 rounded-xl hover:bg-opacity-70 transition">
                Choose Manually
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="border-b border-purple-700 border-opacity-50 bg-black bg-opacity-20 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap justify-between items-center gap-4">
          <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
            ChorusClip
          </h1>
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-xs bg-purple-700 bg-opacity-50 backdrop-blur px-3 py-1.5 rounded-full border border-purple-500">
              Strathmore Exclusive
            </span>
            {!user.isPremium && user.uid && (
              <span className="text-xs bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-1.5 rounded-full font-semibold">
                {songsRemaining} songs left today
              </span>
            )}
            {user.isPremium && (
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1">
                <Sparkles size={14} /> PREMIUM
              </span>
            )}
            {user.uid ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold hidden sm:inline">Hi, {user.displayName}!</span>
                <button onClick={handleSignOut} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl font-semibold transition flex items-center gap-2">
                  <LogOut size={16} /> <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <button onClick={() => setShowAuthModal(true)} className="px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold hover:shadow-lg transition">
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-black bg-opacity-40 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-purple-700 border-opacity-50">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black tracking-tight">Create Loop</h2>
                <button onClick={() => setShowTutorial(true)} className="text-purple-400 hover:text-purple-300 transition flex items-center gap-2">
                  <Video size={20} /> Help
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-purple-300 mb-2">YouTube URL</label>
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full px-4 py-3 bg-purple-950 bg-opacity-50 border border-purple-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-purple-400 transition"
                  />
                </div>
                <button
                  onClick={handleUrlSubmit}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-lg hover:shadow-2xl transition pulse-glow"
                >
                  Load Song
                </button>
              </div>

              {videoId && (
                <div className="mt-6 space-y-6">
                  <div id="youtube-player" className="w-full aspect-video bg-black rounded-2xl overflow-hidden border border-purple-700"></div>
                  
                  {videoTitle && (
                    <div className="text-center">
                      <p className="font-bold text-xl">{videoTitle}</p>
                      <p className="text-purple-300 text-lg">{artist}</p>
                    </div>
                  )}

                  <div className="bg-purple-900 bg-opacity-30 p-5 rounded-2xl border border-purple-700 border-opacity-50">
                    <label className="block text-sm font-bold text-purple-300 mb-3">Loop Repetitions</label>
                    <select
                      value={loopCount}
                      onChange={(e) => setLoopCount(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-purple-950 bg-opacity-70 border border-purple-600 rounded-xl text-white font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value={0}>∞ Infinite Loop</option>
                      <option value={1}>1 time</option>
                      <option value={2}>2 times</option>
                      <option value={3}>3 times</option>
                      <option value={5}>5 times</option>
                      <option value={10}>10 times</option>
                    </select>
                    {loopCount > 0 && currentLoopIteration > 0 && (
                      <p className="text-purple-300 text-sm mt-2">
                        Playing: {currentLoopIteration}/{loopCount}
                      </p>
                    )}
                  </div>

                  {loops.map((loop, idx) => (
                    <div key={idx} className="bg-purple-900 bg-opacity-30 p-5 rounded-2xl border border-purple-700 border-opacity-50">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-lg">Loop {idx + 1} {idx === currentLoopIndex && isPlaying && '🔄'}</h4>
                        {loops.length > 1 && (
                          <button onClick={() => removeLoop(idx)} className="text-red-400 hover:text-red-300">
                            <X size={20} />
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-purple-300 mb-2">
                            Start: {Math.floor(loop.start/60)}:{(loop.start%60).toString().padStart(2,'0')}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="300"
                            step="1"
                            value={loop.start}
                            onChange={(e) => updateLoop(idx, 'start', e.target.value)}
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-bold text-purple-300 mb-2">
                            End: {Math.floor(loop.end/60)}:{(loop.end%60).toString().padStart(2,'0')}
                            <span className="text-xs ml-2 text-yellow-400">
                              (Duration: {Math.max(0, loop.end - loop.start)}s / Max 45s)
                            </span>
                          </label>
                          <input
                            type="range"
                            min={loop.start + 1}
                            max={Math.min(300, loop.start + 45)}
                            step="1"
                            value={loop.end}
                            onChange={(e) => updateLoop(idx, 'end', e.target.value)}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-3">
                    <button
                      onClick={togglePlayPause}
                      className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center gap-2 font-bold hover:shadow-xl transition"
                    >
                      {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                      {isPlaying ? 'Pause' : 'Play'}
                    </button>
                    <button
                      onClick={handleLoopRestart}
                      className="px-5 py-3 bg-purple-800 bg-opacity-70 hover:bg-opacity-90 rounded-xl transition"
                    >
                      <RotateCcw size={20} />
                    </button>
                    {user.isPremium && (
                      <button
                        onClick={handleDownload}
                        className="px-5 py-3 bg-green-700 hover:bg-green-600 rounded-xl transition"
                      >
                        <Download size={20} />
                      </button>
                    )}
                  </div>

                  <div className="flex gap-3">
                    {loops.length < maxLoopsPerSong && (
                      <button
                        onClick={addLoop}
                        className="flex-1 py-3 bg-purple-700 bg-opacity-50 hover:bg-opacity-70 rounded-xl flex items-center justify-center gap-2 font-bold transition"
                      >
                        <Plus size={20} /> Add Loop ({loops.length}/{maxLoopsPerSong})
                      </button>
                    )}
                    <button
                      onClick={handlePostToFeed}
                      className="flex-1 py-3 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl font-bold hover:shadow-xl transition"
                    >
                      Post to Feed
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-black bg-opacity-40 backdrop-blur-xl rounded-3xl p-6 border border-purple-700 border-opacity-50">
              <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                <Sparkles size={20} className="text-yellow-400" />
                Why ChorusClip?
              </h3>
              <ul className="space-y-3 text-sm text-purple-200">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">✨</span>
                  <span>Auto-detect most replayed sections</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">🙏</span>
                  <span>Perfect for worship, study, workouts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">🔄</span>
                  <span>Loop up to 3 sections per song (Premium)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">💎</span>
                  <span>Download audio loops (Premium)</span>
                </li>
              </ul>
            </div>

            <div className="bg-black bg-opacity-40 backdrop-blur-xl rounded-3xl p-6 border border-red-700 border-opacity-50">
              <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                <AlertCircle size={20} className="text-red-400" />
                Need Help?
              </h3>
              <p className="text-sm text-purple-200 mb-4">
                Experiencing issues? Have feedback? We'd love to hear from you!
              </p>
              <a 
                href="mailto:ted.sande@strathmore.edu?subject=ChorusClip Support Request"
                className="block w-full py-3 bg-gradient-to-r from-red-600 to-pink-600 rounded-xl font-bold text-center hover:shadow-xl transition"
              >
                📧 Contact Support
              </a>
              <p className="text-xs text-purple-400 text-center mt-3">
                Response time: 24-48 hours
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-black bg-opacity-40 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-purple-700 border-opacity-50">
              <h2 className="text-2xl font-black tracking-tight mb-6">🔥 Trending Clips</h2>
              
              {clips.length === 0 ? (
                <div className="text-center py-12 text-purple-300">
                  <p className="text-lg mb-2">No clips yet!</p>
                  <p className="text-sm">Be the first to post a loop 🎵</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {clips.map((clip) => (
                    <div
                      key={clip.id}
                      className="bg-purple-900 bg-opacity-30 rounded-2xl p-4 hover:bg-opacity-50 transition cursor-pointer border border-purple-700 border-opacity-30"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-lg">{clip.title}</h3>
                          <p className="text-sm text-purple-300">{clip.artist}</p>
                          <p className="text-xs text-purple-400 mt-1">by @{clip.createdBy}</p>
                        </div>
                        <button 
                          onClick={() => handleLikeClip(clip.id)}
                          className={`transition transform hover:scale-110 ${user.likedClips.includes(clip.id) ? 'text-pink-500' : 'text-pink-400 hover:text-pink-300'}`}
                          disabled={user.likedClips.includes(clip.id)}
                        >
                          <Heart size={20} fill={user.likedClips.includes(clip.id) ? "currentColor" : "none"} />
                        </button>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-purple-400 font-semibold">
                          {Math.floor(clip.startTime/60)}:{(clip.startTime%60).toString().padStart(2,'0')} - {Math.floor(clip.endTime/60)}:{(clip.endTime%60).toString().padStart(2,'0')}
                        </span>
                        <div className="flex items-center gap-4">
                          <span className="text-purple-300">{clip.likes || 0} ❤️</span>
                          <span className="text-purple-300">{clip.plays || 0} ▶️</span>
                          <button className="text-purple-400 hover:text-purple-300">
                            <Share2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!user.isPremium && (
                <div className="mt-6 p-6 bg-gradient-to-br from-purple-800 to-pink-800 rounded-2xl text-center border border-purple-500">
                  <div className="flex justify-center mb-4">
                    <Sparkles className="text-yellow-400" size={32} />
                  </div>
                  <p className="text-sm mb-2">Free: {user.accountCreatedDaysAgo < 7 ? '10' : '3'} songs/day, 1 loop per song</p>
                  <p className="font-black text-2xl mb-4">Premium: KES 299/month</p>
                  <ul className="text-xs text-left mb-6 space-y-2 bg-black bg-opacity-30 p-4 rounded-xl">
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> Unlimited songs per day
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> 3 loops per song (vs 1)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> Download audio loops
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> Create playlists
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> No ads
                    </li>
                  </ul>
                  <button onClick={() => setShowPaymentModal(true)} className="w-full px-6 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-xl font-bold text-lg hover:shadow-2xl transition pulse-glow">
                    Upgrade Now 🚀
                  </button>
                </div>
              )}
            </div>

            <div className="bg-black bg-opacity-40 backdrop-blur-xl rounded-3xl p-6 border border-purple-700 border-opacity-50">
              <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                🏆 Strathmore Leaderboard
              </h3>
              <p className="text-xs text-purple-300 mb-4">Top clip creators this week</p>
              {leaderboard.length === 0 ? (
                <div className="text-center py-8 text-purple-300">
                  <p className="text-sm">No rankings yet!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((entry) => (
                    <div key={entry.rank} className="flex justify-between items-center bg-purple-900 bg-opacity-30 p-3 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                        </span>
                        <div>
                          <p className="font-bold">@{entry.name}</p>
                          <p className="text-xs text-purple-300">Top artist: {entry.artist}</p>
                        </div>
                      </div>
                      <span className="text-purple-300 font-bold text-lg">{entry.songs}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}