'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Share2, Heart, Plus, X, AlertCircle, Video, Download, Sparkles } from 'lucide-react';

const handleForgotPassword = async () => {
  const email = prompt('Enter your Strathmore email:');
  if (!email?.endsWith('@strathmore.edu')) {
    return alert('Please enter a valid Strathmore email!');
  }

  try {
    const { resetPassword } = await import('../lib/firebase');
    await resetPassword(email);
    alert('✅ Password reset email sent! Check your inbox.');
  } catch (error) {
    alert(`❌ Failed to send reset email: ${error.message}`);
  }
};
export default function ChorusClipFinal() {
  const [user, setUser] = useState({
    displayName: 'Guest',
    email: '',
    isPremium: false,
    songsToday: 0,
    accountCreatedDaysAgo: 0
  });

  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoId, setVideoId] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [loops, setLoops] = useState([{ start: 0, end: 30 }]);
  const [currentLoopIndex, setCurrentLoopIndex] = useState(0);
  
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSongsWarning, setShowSongsWarning] = useState(false);
  const [showMostReplayedSuggestion, setShowMostReplayedSuggestion] = useState(false);
  const [suggestedStart, setSuggestedStart] = useState(0);
  const [suggestedEnd, setSuggestedEnd] = useState(30);

  const [leaderboard, setLeaderboard] = useState([
    { rank: 1, name: 'john_doe', songs: 847, artist: 'Hillsong' },
    { rank: 2, name: 'mary_k', songs: 623, artist: 'Elevation' },
    { rank: 3, name: 'david_m', songs: 501, artist: 'Maverick City' }
  ]);

  const [clips, setClips] = useState([
    { id: 1, title: 'Amazing Grace Chorus', artist: 'Chris Tomlin', duration: '0:15-0:45', likes: 234, plays: 1200 },
    { id: 2, title: 'Oceans Outro', artist: 'Hillsong', duration: '2:30-3:00', likes: 189, plays: 890 },
    { id: 3, title: 'Goodness of God Bridge', artist: 'Bethel', duration: '3:15-3:45', likes: 421, plays: 2100 }
  ]);

  const playerRef = useRef(null);
  const intervalRef = useRef(null);

  const songsLimit = user.accountCreatedDaysAgo < 7 ? 10 : 3;
  const songsRemaining = songsLimit - user.songsToday;
  const maxLoopsPerSong = user.isPremium ? 3 : 1;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isFirstVisit = !localStorage.getItem('tutorialSeen');
      if (isFirstVisit) {
        setTimeout(() => setShowTutorial(true), 500);
        localStorage.setItem('tutorialSeen', 'true');
      }
      
      const savedCount = localStorage.getItem('songsToday');
      if (savedCount) {
        setUser(prev => ({ ...prev, songsToday: parseInt(savedCount) }));
      }

      loadTrendingClips();
      loadLeaderboard();
    }
  }, []);

  const loadTrendingClips = async () => {
    try {
      const { getTrendingClips } = await import('../lib/firebase');
      const trendingClips = await getTrendingClips(10);
      if (trendingClips && trendingClips.length > 0) {
        setClips(trendingClips);
      }
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
      alert('Daily song limit reached! Upgrade to Premium for unlimited songs.');
      return;
    }

    const id = extractVideoId(youtubeUrl);
    if (id) {
      setVideoId(id);
      setLoops([{ start: 0, end: 30 }]);
      setCurrentLoopIndex(0);
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
  setLoops([{ start: suggestedStart, end: suggestedEnd }]);
  setShowMostReplayedSuggestion(false);
  
  // WAIT for player to be ready, THEN seek
  setTimeout(() => {
    if (playerRef.current) {
      playerRef.current.seekTo(suggestedStart, true);
      console.log(`✅ Seeking to ${suggestedStart}s`);
    }
  }, 500);
};

const dismissSuggestion = () => {
  setShowMostReplayedSuggestion(false);
  // Keep default loop, seek to start
  setTimeout(() => {
    if (playerRef.current) {
      playerRef.current.seekTo(0, true);
      console.log(`✅ Seeking to 0s`);
    }
  }, 500);
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
    event.target.seekTo(loops[0].start, true);
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
            if (currentLoopIndex < loops.length - 1) {
              const nextIndex = currentLoopIndex + 1;
              setCurrentLoopIndex(nextIndex);
              playerRef.current.seekTo(loops[nextIndex].start, true);
            } else {
              setCurrentLoopIndex(0);
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
      playerRef.current.seekTo(loops[0].start, true);
      playerRef.current.playVideo();
    }
  };

  const addLoop = () => {
    if (loops.length >= maxLoopsPerSong) {
      alert(`${user.isPremium ? 'Maximum 3' : 'Free tier: Only 1'} loop${user.isPremium ? 's' : ''} per song.`);
      return;
    }
    setLoops([...loops, { start: 0, end: 30 }]);
  };

  const updateLoop = (index, field, value) => {
    const newLoops = [...loops];
    newLoops[index][field] = Number(value);
    
    if (field === 'end' && newLoops[index].end - newLoops[index].start > 45) {
      newLoops[index].end = newLoops[index].start + 45;
    }
    if (field === 'start' && newLoops[index].end - newLoops[index].start > 45) {
      newLoops[index].end = newLoops[index].start + 45;
    }
    
    setLoops(newLoops);
    if (playerRef.current && index === currentLoopIndex) {
      playerRef.current.seekTo(newLoops[index].start, true);
    }
  };

  const removeLoop = (index) => {
    if (loops.length === 1) return;
    setLoops(loops.filter((_, i) => i !== index));
    if (currentLoopIndex >= loops.length - 1) setCurrentLoopIndex(0);
  };

  const handleDownload = async () => {
    if (!user.isPremium) {
      alert('Downloads are Premium only!');
      return;
    }
    if (!videoId) {
      alert('Load a song first!');
      return;
    }

    const loop = loops[currentLoopIndex];
    try {
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
      alert('Download started!');
    } catch (error) {
      alert('Download failed.');
    }
  };

  const handlePostToFeed = async () => {
    if (!videoId) return alert('Load a song first!');
    if (!user.email) return alert('Sign in to post!');

    const loop = loops[0];
    const newClip = {
      id: Date.now(),
      title: videoTitle,
      artist,
      duration: `${Math.floor(loop.start/60)}:${(loop.start%60).toString().padStart(2,'0')}-${Math.floor(loop.end/60)}:${(loop.end%60).toString().padStart(2,'0')}`,
      likes: 0, plays: 0, videoId, startTime: loop.start, endTime: loop.end,
      userId: user.email, createdBy: user.displayName
    };

    try {
      setClips(prev => [newClip, ...prev]);
      const { createClip } = await import('../lib/firebase');
      await createClip({...newClip, youtubeVideoId: videoId});
      alert('Posted to feed!');
    } catch (error) {
      setClips(prev => prev.filter(c => c.id !== newClip.id));
      alert('Failed to post.');
    }
  };

  const handleSignIn = async () => {
  const email = prompt('Enter your Strathmore email (@strathmore.edu):');
  if (!email?.endsWith('@strathmore.edu')) {
    return alert('Please use a Strathmore email address!');
  }

  const password = prompt('Enter password (min 6 characters):');
  if (!password || password.length < 6) {
    return alert('Password must be at least 6 characters!');
  }

  // ASK USER: Sign in or Sign up?
  const isNewUser = confirm('Is this a new account? Click OK for Sign Up, Cancel for Sign In');

  try {
    const { signInUser, signUpUser, getUserData } = await import('../lib/firebase');
    
    if (isNewUser) {
      // SIGN UP FLOW
      const displayName = prompt('Choose a display name (3-20 characters):');
      if (!displayName || displayName.length < 3) {
        return alert('Display name must be at least 3 characters!');
      }
      
      try {
        const userCred = await signUpUser(email, password, displayName);
        const userData = await getUserData(userCred.uid);
        
        if (userData) {
          setUser({
            displayName: userData.displayName,
            email: userData.email,
            isPremium: false,
            songsToday: 0,
            accountCreatedDaysAgo: 0
          });
          
          alert(`✅ Account created! Welcome, ${displayName}!\n\n📧 Verification email sent to ${email}`);
          await loadTrendingClips();
          await loadLeaderboard();
        }
      } catch (signUpError) {
        if (signUpError.code === 'auth/email-already-in-use') {
          alert('❌ Email already registered! Try signing in instead.');
        } else {
          alert(`❌ Sign up failed: ${signUpError.message}`);
        }
      }
    } else {
      // SIGN IN FLOW
      try {
        const userCred = await signInUser(email, password);
        const userData = await getUserData(userCred.uid);
        
        if (userData) {
          setUser({
            displayName: userData.displayName,
            email: userData.email,
            isPremium: userData.isPremium,
            songsToday: userData.clipsToday,
            accountCreatedDaysAgo: Math.floor((Date.now() - userData.accountCreated.toDate().getTime()) / (1000 * 60 * 60 * 24))
          });
          
          alert(`✅ Welcome back, ${userData.displayName}!`);
          await loadTrendingClips();
          await loadLeaderboard();
        }
      } catch (signInError) {
        if (signInError.code === 'auth/user-not-found') {
          alert('❌ No account found with this email. Please sign up first!');
        } else if (signInError.code === 'auth/wrong-password') {
          alert('❌ Incorrect password!');
        } else if (signInError.code === 'auth/invalid-credential') {
          alert('❌ Invalid email or password!');
        } else {
          alert(`❌ Sign in failed: ${signInError.message}`);
        }
      }
    }
  } catch (error) {
    console.error('Auth error:', error);
    alert(`❌ Authentication failed: ${error.message}`);
  }
};

  const handleUpgrade = async () => {
    if (!user.email) return alert('Sign in first!');

    const phone = prompt('M-Pesa number (254XXXXXXXXX):');
    if (!phone?.match(/^254\d{9}$/)) return alert('Invalid phone number!');

    try {
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({userId: user.email, amount: 299, email: user.email, phone})
      });

      const data = await response.json();
      if (data.success) alert('Payment initiated! Check your phone.');
      else alert('Payment failed.');
    } catch (error) {
      alert('Payment error.');
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

  // ... REST OF THE JSX (keeping it exactly as it was in your page.js)
  // I'm not rewriting the entire JSX because it's already correct in your file
  // Just make sure the functions above match
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-40 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Inter', sans-serif; }
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
      `}</style>

      {showTutorial && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-3xl p-8 max-w-2xl w-full relative border border-purple-500">
            <button onClick={() => setShowTutorial(false)} className="absolute top-4 right-4 text-white hover:text-purple-300 transition">
              <X size={28} />
            </button>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Sparkles className="text-yellow-400" size={32} />
              Welcome to ChorusClip!
            </h2>
            <div className="bg-black bg-opacity-50 rounded-2xl p-8 mb-6 flex flex-col items-center justify-center aspect-video">
              <Video size={80} className="text-purple-400 mb-4" />
              <p className="text-purple-300 text-center">Quick tutorial:<br/>1. Paste YouTube link<br/>2. Adjust loop points<br/>3. Play & enjoy!</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm mb-6">
              <div className="bg-purple-800 bg-opacity-50 p-4 rounded-xl">
                <p className="font-semibold mb-2">🎵 Step 1</p>
                <p className="text-purple-200">Paste YouTube link</p>
              </div>
              <div className="bg-purple-800 bg-opacity-50 p-4 rounded-xl">
                <p className="font-semibold mb-2">⏱️ Step 2</p>
                <p className="text-purple-200">Auto-detect best part</p>
              </div>
              <div className="bg-purple-800 bg-opacity-50 p-4 rounded-xl">
                <p className="font-semibold mb-2">🔄 Step 3</p>
                <p className="text-purple-200">Loop endlessly!</p>
              </div>
              <div className="bg-purple-800 bg-opacity-50 p-4 rounded-xl">
                <p className="font-semibold mb-2">💎 Premium</p>
                <p className="text-purple-200">3 loops, playlists, downloads</p>
              </div>
            </div>
            <button onClick={() => setShowTutorial(false)} className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-lg hover:shadow-2xl transition pulse-glow">
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
              <button onClick={handleUpgrade} className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-xl font-bold text-lg hover:shadow-2xl transition">
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
          <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            ChorusClip
          </h1>
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-xs bg-purple-700 bg-opacity-50 backdrop-blur px-3 py-1.5 rounded-full border border-purple-500">
              Strathmore Exclusive
            </span>
            {!user.isPremium && (
              <span className="text-xs bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-1.5 rounded-full font-semibold">
                {songsRemaining} songs left today
              </span>
            )}
            {user.isPremium && (
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1">
                <Sparkles size={14} /> PREMIUM
              </span>
            )}
            <button onClick={handleSignIn} className="px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold hover:shadow-lg transition">
              Sign In
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-black bg-opacity-40 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-purple-700 border-opacity-50">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Create Loop</h2>
                <button onClick={() => setShowTutorial(true)} className="text-purple-400 hover:text-purple-300 transition flex items-center gap-2">
                  <Video size={20} /> Help
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">YouTube URL</label>
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
                      <p className="font-bold text-lg">{videoTitle}</p>
                      <p className="text-purple-300">{artist}</p>
                    </div>
                  )}

                  {loops.map((loop, idx) => (
                    <div key={idx} className="bg-purple-900 bg-opacity-30 p-5 rounded-2xl border border-purple-700 border-opacity-50">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold">Loop {idx + 1} {idx === currentLoopIndex && isPlaying && '🔄'}</h4>
                        {loops.length > 1 && (
                          <button onClick={() => removeLoop(idx)} className="text-red-400 hover:text-red-300">
                            <X size={20} />
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-purple-300 mb-2">
                            Start: {Math.floor(loop.start/60)}:{(loop.start%60).toString().padStart(2,'0')}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="300"
                            value={loop.start}
                            onChange={(e) => updateLoop(idx, 'start', e.target.value)}
                            className="w-full h-2 bg-purple-700 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-purple-300 mb-2">
                            End: {Math.floor(loop.end/60)}:{(loop.end%60).toString().padStart(2,'0')}
                            <span className="text-xs ml-2">
                              (Duration: {loop.end - loop.start}s / Max 45s)
                            </span>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="300"
                            value={loop.end}
                            onChange={(e) => updateLoop(idx, 'end', e.target.value)}
                            className="w-full h-2 bg-purple-700 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-3">
                    <button
                      onClick={togglePlayPause}
                      className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center gap-2 font-semibold hover:shadow-xl transition"
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
                        className="flex-1 py-3 bg-purple-700 bg-opacity-50 hover:bg-opacity-70 rounded-xl flex items-center justify-center gap-2 font-semibold transition"
                      >
                        <Plus size={20} /> Add Loop ({loops.length}/{maxLoopsPerSong})
                      </button>
                    )}
                    <button
                      onClick={handlePostToFeed}
                      className="flex-1 py-3 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl font-semibold hover:shadow-xl transition"
                    >
                      Post to Feed
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-black bg-opacity-40 backdrop-blur-xl rounded-3xl p-6 border border-purple-700 border-opacity-50">
              <h3 className="font-bold mb-4 flex items-center gap-2">
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
          </div>

          <div className="space-y-6">
            <div className="bg-black bg-opacity-40 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-purple-700 border-opacity-50">
              <h2 className="text-2xl font-bold mb-6">🔥 Trending Clips</h2>
              
              <div className="space-y-3">
                {clips.map((clip) => (
                  <div
                    key={clip.id}
                    className="bg-purple-900 bg-opacity-30 rounded-2xl p-4 hover:bg-opacity-50 transition cursor-pointer border border-purple-700 border-opacity-30"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{clip.title}</h3>
                        <p className="text-sm text-purple-300">{clip.artist}</p>
                      </div>
                      <button className="text-pink-400 hover:text-pink-300 transition">
                        <Heart size={20} />
                      </button>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-purple-400">{clip.duration}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-purple-300">{clip.likes} ❤️</span>
                        <span className="text-purple-300">{clip.plays} ▶️</span>
                        <button className="text-purple-400 hover:text-purple-300">
                          <Share2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {!user.isPremium && (
                <div className="mt-6 p-6 bg-gradient-to-br from-purple-800 to-pink-800 rounded-2xl text-center border border-purple-500">
                  <div className="flex justify-center mb-4">
                    <Sparkles className="text-yellow-400" size={32} />
                  </div>
                  <p className="text-sm mb-2">Free: {user.accountCreatedDaysAgo < 7 ? '10' : '3'} songs/day, 1 loop per song</p>
                  <p className="font-bold text-xl mb-4">Premium: KES 299/month</p>
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
                  <button onClick={handleUpgrade} className="w-full px-6 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-xl font-bold text-lg hover:shadow-2xl transition pulse-glow">
                    Upgrade Now 🚀
                  </button>
                </div>
              )}
            </div>

            <div className="bg-black bg-opacity-40 backdrop-blur-xl rounded-3xl p-6 border border-purple-700 border-opacity-50">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                🏆 Strathmore Leaderboard
              </h3>
              <p className="text-xs text-purple-300 mb-4">Top clip creators this week (updates when you sign in)</p>
              <div className="space-y-3">
                {leaderboard.map((entry) => (
                  <div key={entry.rank} className="flex justify-between items-center bg-purple-900 bg-opacity-30 p-3 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                      </span>
                      <div>
                        <p className="font-semibold">@{entry.name}</p>
                        <p className="text-xs text-purple-300">Top artist: {entry.artist}</p>
                      </div>
                    </div>
                    <span className="text-purple-300 font-semibold">{entry.songs}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}