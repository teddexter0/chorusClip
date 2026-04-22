# ChorusClip 🎵

**Loop your favorite song moments. Share with friends. Discover new music.**

[**Try ChorusClip **](https://chorus-clip.vercel.app/)

ChorusClip lets you create and share looped clips of your favorite sections of any YouTube song  with up to 3 sections per clip, custom repeat counts, playlists, and a persistent cross-device queue.

---

## Features

- **Smart loop suggestion**  auto-detects the chorus/hook (25% into the song)
- **Up to 3 sections per clip**  each with its own repeat count (110 or Infinite)
- **Playlists**  up to 10 clips per playlist, sortable, public or private
- **Cross-device queue**  queue up to 10 playlists; queue is saved to your account and persists across refresh and devices
- **Standalone loop mode**  🔁 button loops a single clip continuously
- **Social feed**  trending clips, leaderboard with sort criteria, top artists
- **Friends**  add by username, see what friends are listening to
- **Mobile-friendly**  large touch targets, jump-to-timestamp helper, drag-reorder

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Database | Firebase Firestore |
| Auth | Firebase Auth |
| Payments | Pesapal (KES) |
| APIs | YouTube IFrame API, Spotify Web API |
| Deployment | Vercel |

---

## Getting Started

```bash
git clone https://github.com/teddexter0/chorusClip.git
cd chorusClip
npm install
cp .env.local.example .env.local
# fill in your Firebase + Spotify credentials
npm run dev
```

### Required env vars (`.env.local`):
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=
NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET=
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## Deployment

Push to `main`  Vercel auto-deploys.

```bash
git add .
git commit -m "your message"
git push origin main
```

---

## Roadmap

- [ ] Bulk YouTube URL import (paste 5 links  auto-create clips)
- [ ] Leaderboard Spotify metadata (genre, streams, release date)
- [ ] Premium tier  15-song playlists, audio download
- [ ] Playlist view counters (YouTube-style)

---

## Contributing

1. Fork the repo
2. `git checkout -b feat/your-feature`
3. Commit and push
4. Open a Pull Request

---

## License

MIT  see `license` file.

---

**Developer:** Ted Dexter Sande  [ted.sande@strathmore.edu](mailto:ted.sande@strathmore.edu)
**Built for music lovers at Strathmore University**
