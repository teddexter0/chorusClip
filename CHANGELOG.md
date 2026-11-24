# Changelog

All notable changes to ChorusClip are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## 2026-11-24 | Studio and playback

### Loading and sign-in

- Restore the Firebase account before fetching profile and like data. Fetch view-specific data when its view opens, and restore the saved queue only once per account.
- Load the YouTube API and create its player on first playback or Studio import. Split the tutorial, audio visualizer, authentication dialog, and social panel into separate bundles.
- Keep sign-in on the device by default. Uncheck the option for a session that ends when the browser session closes. The sign-in form supports password-manager autofill.

### Studio and queue

- Select a section from its card or trim handles. The selected section glows and limits Play and Replay to that section. Clear the selection to play the whole clip.
- Start and End use the same song timeline. Moving either handle preserves the opposite boundary within the 1–45 second clip limits and seeks to the committed timestamp automatically.
- Keep the draft and section boundaries in the browser across refreshes. Restore the draft manually from Studio. A successful post or explicit discard clears the draft.
- Stop advancing the queue while Studio is open or a draft is active. The queue drawer shows standby, and the desktop queue rail can be hidden or shown.
- Pause on disconnect or a sustained YouTube buffering stall. Resume from the last confirmed timestamp with Play. Remove delayed automatic Play calls that could restart or advance playback after a pause.
- Open the same search tips from Discover Clips or the How to use section.

### Verification

- Run `node --test tests/studio-playback.test.mjs` and `npm run test:playlists`.
- Run `npm run build` for the production bundle.

## [0.3.0]  2026-04

### Added
- **Persistent queue**  playlist queue (up to 10) saved to Firestore; survives refresh, logout, and syncs across devices
- **Standalone loop mode**  🔁 button in playback controls loops a single clip indefinitely
- **Sticky queue banner**  fixed bottom bar shows active queue and staged clips; collapsible
- **Playlist privacy toggle**  set any playlist public or private from the Manage screen; badge shown on playlist cards
- **Leaderboard sort criteria**  sort by # Clips (default),  Likes, or AZ name
- **Community pulse message**  dynamic "Strathmore this month: vibing to [Artist]" under leaderboard
- **Jump-to-timestamp button**  per section: seeks to section start and pauses, for precise mobile timestamp setting
- **Paginated feed**  clips load 15 at a time beyond the initial 5; no more content getting lost

### Changed
- Queue capacity raised from 5  **10 playlists**
- Wide-screen two-column layout now only activates at **1280px+** (xl breakpoint); mid-range laptops (10241279px) use single-column stacked layout
- Section reorder  buttons now **4444px minimum touch targets**
- Range sliders now **16px tall / 36px thumbs** on mobile
- Tutorial updated with new features and mobile tips
- Discover sections (Trending, Top Artists) show loading spinner while fetching

### Fixed
- Delete confirmation added when removing a song from a playlist (prevents accidental deletion while scrolling)
- Discover section toggles no longer appear broken before data loads

### Deferred
- Bulk YouTube URL import (multi-link paste  auto-clip)
- Spotify metadata in leaderboard (genre, streams, release date)
- 15-song playlists (planned as premium feature)
- Playlist view counters

---

## [0.2.0]  2025

### Added
- Playlist queue (up to 5) with back-to-back playback
- Shuffle and repeat controls for playlists
- Friends system  add by username, see friend activity
- Playlist management modal (rename, sort, reorder, delete)
- Per-section repeat counts (110 or Infinite, capped at 5 in playlists)
- Audio visualizer
- Background ambience video

### Fixed
- Stale closure bug in loop tracker (switched state tracking to refs)
- YouTube ENDED event handling (restarts section instead of stopping)
- Windows path issues with tmp directory

---

## [0.1.0]  2025

### Added
- Initial release  YouTube URL  loop creator  post to feed
- Firebase auth (Strathmore email)
- Leaderboard, trending clips, top artists
- Basic playlist creation
