// src/utils/playlistUtils.js

const PLAYLIST_MAX_CLIPS = 10;
const ENDLESS_CAP_IN_PLAYLIST = 5; // "Infinite" loops are capped at 5 plays in a playlist

export const createPlaylist = async (userId, name, clips, ownerDisplayName = '') => {
  const { db } = await import('../lib/firebase');
  const { collection, addDoc } = await import('firebase/firestore');

  const playlist = {
    userId,
    name,
    clips: clips.slice(0, PLAYLIST_MAX_CLIPS),
    createdAt: new Date(),
    plays: 0,
    isPublic: true,
    createdBy: ownerDisplayName || 'Community'
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
  const { collection, query, where, getDocs, limit } = await import('firebase/firestore');

  const q = query(
    collection(db, 'playlists'),
    where('isPublic', '==', true),
    limit(50)
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

export { PLAYLIST_MAX_CLIPS, ENDLESS_CAP_IN_PLAYLIST };

/**
 * PlaylistPlayer – manages clip-to-clip advancement within a playlist.
 *
 * ARCHITECTURE NOTE:
 *   Per-loop tracking (start/end seeking, repeat counts) is handled entirely by
 *   startTimeTracking() in page.js. When startTimeTracking detects that ALL loops in
 *   the current clip are exhausted, it calls advanceToNextClip() here instead of
 *   pausing. This avoids the race condition caused by having two competing interval
 *   timers (the old setupCompletionListener + startTimeTracking) watching the same
 *   getCurrentTime() value.
 *
 * playMode:
 *   'default' – respect each loop's saved loopCount; infinite (0) capped at ENDLESS_CAP.
 *   'once'    – every loop in every clip plays exactly 1 time.
 */
export class PlaylistPlayer {
  constructor(playlist, playerRef, callbacks, playMode = 'default') {
    this.playlist = playlist;
    this.playerRef = playerRef;
    this.callbacks = callbacks;
    this.playMode = playMode;
    this.currentIndex = 0;
    this.isShuffled = false;
    this.repeatPlaylist = false;
    this.originalOrder = [...playlist.clips];
    this.playlistOrder = [...playlist.clips];
  }

  /**
   * Normalize a clip's loops for the current playMode before handing it to
   * startTimeTracking. This is the single source of truth for repeat counts
   * inside a playlist.
   *
   * 'once'    → every loop plays exactly 1×
   * 'default' → respect per-loop loopCount; loopCount===0 (infinite) → ENDLESS_CAP
   */
  normalizeClip(clip) {
    const normalizedLoops = (clip.loops || [{ start: 0, end: 30, loopCount: 1 }]).map(loop => {
      let count;
      if (this.playMode === 'once') {
        count = 1;
      } else {
        // loopCount 0 means "infinite" — cap at ENDLESS_CAP in a playlist context
        count = (loop.loopCount === 0) ? ENDLESS_CAP_IN_PLAYLIST : (loop.loopCount ?? 1);
      }
      return { ...loop, loopCount: count };
    });
    return { ...clip, loops: normalizedLoops };
  }

  /** Toggle shuffle on/off. Resets to the beginning of the new order. */
  toggleShuffle() {
    if (this.isShuffled) {
      this.playlistOrder = [...this.originalOrder];
      this.isShuffled = false;
      this.currentIndex = 0;
      this.callbacks.showNotification('↕️ Original order restored', 'success');
    } else {
      this.playlistOrder = shuffleArray([...this.playlist.clips]);
      this.isShuffled = true;
      this.currentIndex = 0;
      this.callbacks.showNotification('🔀 Playlist shuffled!', 'success');
    }
  }

  toggleRepeat() {
    this.repeatPlaylist = !this.repeatPlaylist;
    this.callbacks.showNotification(
      this.repeatPlaylist ? '🔁 Playlist will repeat' : '➡️ Play once mode',
      'success'
    );
  }

  /**
   * Load and start the clip at currentIndex.
   * Normalizes the clip's loops, fires onClipChange so page.js syncs its refs,
   * then loads the video. startTimeTracking in page.js will handle per-loop
   * repetitions and call advanceToNextClip() when all loops are done.
   */
  async playNext() {
    if (this.currentIndex >= this.playlistOrder.length) {
      if (this.repeatPlaylist) {
        this.currentIndex = 0;
        return this.playNext();
      } else {
        this.callbacks.onPlaylistComplete?.();
        this.callbacks.showNotification('🎉 Playlist finished!', 'success');
        return;
      }
    }

    const rawClip = this.playlistOrder[this.currentIndex];
    // Normalize loops for playMode — page.js tracking reads these normalized values
    const clip = this.normalizeClip(rawClip);

    // Inform page.js: sets loops state, syncs loopsRef, resets iteration refs
    this.callbacks.onClipChange?.(clip, this.currentIndex, this.playlistOrder.length);

    if (this.playerRef.current?.loadVideoById) {
      this.playerRef.current.loadVideoById({
        videoId: clip.youtubeVideoId,
        startSeconds: clip.loops[0]?.start ?? 0
      });
      // Give the player time to buffer before calling playVideo
      setTimeout(() => {
        try { this.playerRef.current?.playVideo(); } catch (e) {}
      }, 700);
    }
    // No setupCompletionListener — startTimeTracking handles completion and calls advanceToNextClip().
  }

  /**
   * Called by startTimeTracking in page.js when all loops for the current clip
   * have completed. Advances to the next clip.
   */
  advanceToNextClip() {
    this.currentIndex++;
    setTimeout(() => this.playNext(), 400);
  }

  stop() {
    try { this.playerRef.current?.pauseVideo(); } catch (e) {}
    this.callbacks.showNotification('⏸️ Playlist stopped', 'info');
  }

  skip() {
    this.currentIndex++;
    this.playNext();
  }

  previous() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.playNext();
    }
  }
}
