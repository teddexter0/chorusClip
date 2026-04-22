# Changelog

All notable changes to ChorusClip are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

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
