// YouTube Player types
declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

export namespace YT {
  export class Player {
    constructor(elementId: string, options: PlayerOptions);
    loadVideoById(options: { videoId: string; startSeconds: number; endSeconds: number }): void;
    playVideo(): void;
    pauseVideo(): void;
    seekTo(seconds: number, allowSeekAhead: boolean): void;
    getCurrentTime(): number;
    getPlayerState(): number;
    getVideoData(): { title: string; video_id: string };
    destroy(): void;
  }

  export interface PlayerOptions {
    videoId: string;
    playerVars?: {
      autoplay?: number;
      controls?: number;
      enablejsapi?: number;
    };
    events?: {
      onReady?: (event: PlayerEvent) => void;
      onStateChange?: (event: PlayerEvent) => void;
    };
  }

  export interface PlayerEvent {
    target: Player;
    data: number;
  }

  export enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5,
  }
}

// Firebase types
export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  isPremium: boolean;
  clipsToday: number;
  clipsThisWeek: number;
  accountCreated: { toDate: () => Date };
  lastClipReset: { toDate: () => Date };
}

export interface ClipData {
  id: string | number;
  title: string;
  artist: string;
  duration: string;
  likes: number;
  plays: number;
  videoId?: string;
  startTime?: number;
  endTime?: number;
  userId?: string;
  createdBy?: string;
}

export interface Loop {
  start: number;
  end: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  songs: number;
  artist: string;
}