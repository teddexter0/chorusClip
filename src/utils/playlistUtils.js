// src/utils/playlistUtils.js

const PLAYLIST_MAX_CLIPS = 10;
const ENDLESS_CAP_IN_PLAYLIST = 5; // "Infinite" loops are capped at 5 plays in a playlist

export const createPlaylist = async (userId, name, clips) => {
  const { db } = await import('../lib/firebase');
  const { collection, addDoc } = await import('firebase/firestore');

  const playlist = {
    userId,
    name,
    clips: clips.slice(0, PLAYLIST_MAX_CLIPS),
    createdAt: new Date(),
    plays: 0,
    isPublic: true
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

export { PLAYLIST_MAX_CLIPS };

/**
 * PlaylistPlayer – manages clip playback within a playlist.
 *
 * playMode:
 *   'default' – each clip plays its saved loopCount times.
 *               Clips saved as "infinite" (loopCount === 0) are capped at ENDLESS_CAP_IN_PLAYLIST.
 *   'once'    – every clip plays exactly 1 time regardless of its saved loopCount.
 */
export class PlaylistPlayer {
  constructor(playlist, playerRef, callbacks, playMode = 'default') {
    this.playlist = playlist;
    this.playerRef = playerRef;
    this.callbacks = callbacks;
    this.playMode = playMode;
    this.currentIndex = 0;
    this.currentClipIteration = 0;
    this.isShuffled = false;
    this.repeatPlaylist = false;
    this.originalOrder = [...playlist.clips];
    this.playlistOrder = [...playlist.clips];
  }

  /** Returns how many times a clip should play for the current playMode. */
  getClipPlayCount(clip) {
    if (this.playMode === 'once') return 1;
    // Default: respect saved loopCount, cap "infinite" at ENDLESS_CAP_IN_PLAYLIST
    const count = clip.loopCount === 0 ? ENDLESS_CAP_IN_PLAYLIST : clip.loopCount;
    return Math.max(1, count);
  }

  /** Toggle shuffle on/off. Keeps current position in the new order. */
  toggleShuffle() {
    if (this.isShuffled) {
      this.playlistOrder = [...this.originalOrder];
      this.isShuffled = false;
      this.currentIndex = 0;
      this.callbacks.showNotification('↕️ Original order restored', 'success');
    } else {
      this.playlistOrder = shuffleArray(this.playlist.clips);
      this.isShuffled = true;
      this.currentIndex = 0;
      this.callbacks.showNotification('🔀 Playlist shuffled!', 'success');
    }
  }

  /** @deprecated Use toggleShuffle() */
  shuffle() { this.toggleShuffle(); }
  /** @deprecated Use toggleShuffle() */
  unshuffle() { if (this.isShuffled) this.toggleShuffle(); }

  toggleRepeat() {
    this.repeatPlaylist = !this.repeatPlaylist;
    this.callbacks.showNotification(
      this.repeatPlaylist ? '🔁 Playlist will repeat' : '➡️ Play once mode',
      'success'
    );
  }

  async playNext() {
    if (this.currentIndex >= this.playlistOrder.length) {
      if (this.repeatPlaylist) {
        this.currentIndex = 0;
        this.currentClipIteration = 0;
        return this.playNext();
      } else {
        this.callbacks.onPlaylistComplete?.();
        this.callbacks.showNotification('🎉 Playlist finished!', 'success');
        return;
      }
    }

    const currentClip = this.playlistOrder[this.currentIndex];
    const loopCount = this.getClipPlayCount(currentClip);

    this.callbacks.onClipChange?.(currentClip, this.currentIndex, this.playlistOrder.length);

    if (this.playerRef.current?.loadVideoById) {
      // Prefer reusing existing player to avoid "loads forever" bug
      this.playerRef.current.loadVideoById({
        videoId: currentClip.youtubeVideoId,
        startSeconds: currentClip.loops[0].start
      });
      setTimeout(() => {
        this.playerRef.current?.playVideo();
      }, 600);
    }

    this.setupCompletionListener(currentClip, loopCount);
  }

  setupCompletionListener(clip, loopCount) {
    if (this.completionInterval) clearInterval(this.completionInterval);

    this.completionInterval = setInterval(() => {
      if (!this.playerRef.current?.getCurrentTime) {
        clearInterval(this.completionInterval);
        return;
      }

      const time = this.playerRef.current.getCurrentTime();
      const lastLoop = clip.loops[clip.loops.length - 1];

      if (time >= lastLoop.end - 0.5) {
        this.currentClipIteration++;

        if (this.currentClipIteration >= loopCount) {
          clearInterval(this.completionInterval);
          this.currentIndex++;
          this.currentClipIteration = 0;
          setTimeout(() => this.playNext(), 500);
        } else {
          // Restart the clip's loops
          this.playerRef.current.seekTo(clip.loops[0].start, true);
        }
      }
    }, 500);
  }

  stop() {
    if (this.completionInterval) clearInterval(this.completionInterval);
    try { this.playerRef.current?.pauseVideo(); } catch (e) {}
    this.callbacks.showNotification('⏸️ Playlist stopped', 'info');
  }

  skip() {
    if (this.completionInterval) clearInterval(this.completionInterval);
    this.currentIndex++;
    this.currentClipIteration = 0;
    this.playNext();
  }

  previous() {
    if (this.completionInterval) clearInterval(this.completionInterval);
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.currentClipIteration = 0;
      this.playNext();
    }
  }
}
