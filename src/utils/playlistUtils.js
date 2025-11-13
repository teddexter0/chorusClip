// src/lib/playlistUtils.js

export const createPlaylist = async (userId, name, clips) => {
  const { db } = await import('../lib/firebase');
  const { collection, addDoc } = await import('firebase/firestore');
  
  const playlist = {
    userId,
    name,
    clips, // Array of clip objects with loops, loopCount, etc.
    createdAt: new Date(),
    plays: 0,
    isPublic: true // Allow non-signed users to see it
  };
  
  const docRef = await addDoc(collection(db, 'playlists'), playlist);
  return docRef.id;
};

export const getUserPlaylists = async (userId) => {
  const { db } = await import('../lib/firebase');
  const { collection, query, where, getDocs, orderBy } = await import('firebase/firestore');
  
  const q = query(
    collection(db, 'playlists'), 
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getAllPublicPlaylists = async () => {
  const { db } = await import('../lib/firebase');
  const { collection, query, where, getDocs, orderBy, limit } = await import('firebase/firestore');
  
  const q = query(
    collection(db, 'playlists'),
    where('isPublic', '==', true),
    orderBy('plays', 'desc'),
    limit(10)
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export class PlaylistPlayer {
  constructor(playlist, playerRef, callbacks) {
    this.playlist = playlist;
    this.playerRef = playerRef;
    this.callbacks = callbacks; // { onClipChange, onPlaylistComplete, showNotification }
    this.currentIndex = 0;
    this.currentClipIteration = 0;
    this.isShuffled = false;
    this.repeatPlaylist = false;
    this.playlistOrder = [...playlist.clips];
  }

  shuffle() {
    this.playlistOrder = shuffleArray(this.playlist.clips);
    this.isShuffled = true;
    this.callbacks.showNotification('🔀 Playlist shuffled!', 'success');
  }

  unshuffle() {
    this.playlistOrder = [...this.playlist.clips];
    this.isShuffled = false;
    this.callbacks.showNotification('↕️ Original order restored', 'success');
  }

  toggleRepeat() {
    this.repeatPlaylist = !this.repeatPlaylist;
    this.callbacks.showNotification(
      this.repeatPlaylist ? '🔁 Playlist will repeat' : '➡️ Play once mode',
      'success'
    );
  }

  async playNext() {
    if (this.currentIndex >= this.playlistOrder.length) {
      // Playlist finished
      if (this.repeatPlaylist) {
        console.log('🔁 Repeating playlist...');
        this.currentIndex = 0;
        this.currentClipIteration = 0;
        return this.playNext();
      } else {
        console.log('✅ Playlist complete!');
        this.callbacks.onPlaylistComplete?.();
        this.callbacks.showNotification('🎉 Playlist finished!', 'success');
        return;
      }
    }

    const currentClip = this.playlistOrder[this.currentIndex];
    const loopCount = currentClip.loopCount === 0 ? 2 : currentClip.loopCount; // Infinite = 2 times in playlist

    console.log(`🎵 Playing: ${currentClip.title} (${this.currentIndex + 1}/${this.playlistOrder.length})`);

    // Update UI
    this.callbacks.onClipChange?.(currentClip, this.currentIndex, this.playlistOrder.length);

    // Load video
    if (this.playerRef.current?.loadVideoById) {
      this.playerRef.current.loadVideoById({
        videoId: currentClip.youtubeVideoId,
        startSeconds: currentClip.loops[0].start
      });
      
      setTimeout(() => {
        this.playerRef.current?.playVideo();
      }, 500);
    }

    // Setup completion listener
    this.setupCompletionListener(currentClip, loopCount);
  }

  setupCompletionListener(clip, loopCount) {
    const checkCompletion = setInterval(() => {
      if (!this.playerRef.current?.getCurrentTime) {
        clearInterval(checkCompletion);
        return;
      }

      const time = this.playerRef.current.getCurrentTime();
      const lastLoop = clip.loops[clip.loops.length - 1];

      // Check if we've finished all loops
      if (time >= lastLoop.end - 0.5) {
        this.currentClipIteration++;

        if (this.currentClipIteration >= loopCount) {
          // Move to next song
          clearInterval(checkCompletion);
          this.currentIndex++;
          this.currentClipIteration = 0;
          
          setTimeout(() => {
            this.playNext();
          }, 500);
        } else {
          // Restart current clip's loops
          this.playerRef.current.seekTo(clip.loops[0].start, true);
        }
      }
    }, 500);

    // Store for cleanup
    this.completionInterval = checkCompletion;
  }

  stop() {
    if (this.completionInterval) {
      clearInterval(this.completionInterval);
    }
    this.playerRef.current?.pauseVideo();
    this.callbacks.showNotification('⏸️ Playlist stopped', 'info');
  }

  skip() {
    this.currentIndex++;
    this.currentClipIteration = 0;
    if (this.completionInterval) {
      clearInterval(this.completionInterval);
    }
    this.playNext();
  }

  previous() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.currentClipIteration = 0;
      if (this.completionInterval) {
        clearInterval(this.completionInterval);
      }
      this.playNext();
    }
  }
}