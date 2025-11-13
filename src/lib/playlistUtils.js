export const createPlaylist = async (userId, name, clips) => {
  const { db } = await import('./firebase');
  const { collection, addDoc } = await import('firebase/firestore');
  
  const playlist = {
    userId,
    name,
    clips, // Array of {clipId, youtubeVideoId, loops, loopCount, title, artist}
    createdAt: new Date(),
    plays: 0
  };
  
  const docRef = await addDoc(collection(db, 'playlists'), playlist);
  return docRef.id;
};

export const getUserPlaylists = async (userId) => {
  const { db } = await import('./firebase');
  const { collection, query, where, getDocs } = await import('firebase/firestore');
  
  const q = query(collection(db, 'playlists'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const playPlaylist = async (playlist, playerRef, setCurrentPlaylistIndex, setLoops, setLoopCount) => {
  let currentIndex = 0;
  
  const playNext = () => {
    if (currentIndex >= playlist.clips.length) {
      console.log('🎉 Playlist finished!');
      return;
    }
    
    const clip = playlist.clips[currentIndex];
    setLoops(clip.loops);
    setLoopCount(clip.loopCount || 1); // If infinity, it'll loop once then move on
    
    // Load video
    if (playerRef.current?.loadVideoById) {
      playerRef.current.loadVideoById(clip.youtubeVideoId, clip.loops[0].start);
    }
    
    currentIndex++;
    setCurrentPlaylistIndex(currentIndex);
  };
  
  return playNext;
};