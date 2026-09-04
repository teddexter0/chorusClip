'use client';
import { X, Sparkles } from 'lucide-react';

export default function TutorialModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full relative border border-purple-500 my-8 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-purple-300 transition z-10">
          <X size={32} />
        </button>

        <h2 className="text-3xl sm:text-4xl font-bold mb-2 flex items-center gap-3 pr-12">
          <Sparkles className="text-yellow-400 flex-shrink-0" size={36} />
          <span>ChorusClip Help</span>
        </h2>
        <p className="text-purple-400 text-sm mb-6">Everything you need to know — tap any section to expand</p>

        {/* HOW TO CREATE A CLIP */}
        <div className="mb-4">
          <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="bg-purple-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
            Creating a Clip
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="bg-purple-800 bg-opacity-50 p-4 rounded-xl border-l-4 border-purple-400">
              <p className="font-semibold mb-1">Paste a YouTube URL</p>
              <p className="text-purple-200 text-sm">Any YouTube music link works. Hit <strong>Load Song</strong> → the player loads in the background.</p>
              <p className="text-purple-400 text-xs mt-2">→ You&apos;ll see a Smart Loop suggestion pop up automatically</p>
            </div>
            <div className="bg-purple-800 bg-opacity-50 p-4 rounded-xl border-l-4 border-pink-400">
              <p className="font-semibold mb-1">Set your section timestamps</p>
              <p className="text-purple-200 text-sm">Drag the sliders or type exact min:sec. You get up to <strong>3 sections</strong> per clip.</p>
              <p className="text-purple-400 text-xs mt-2">→ Tap <strong>&quot;Jump to section start &amp; pause&quot;</strong> on mobile for precision</p>
            </div>
            <div className="bg-purple-800 bg-opacity-50 p-4 rounded-xl border-l-4 border-yellow-400">
              <p className="font-semibold mb-1">Mix-clips: 3 different songs</p>
              <p className="text-purple-200 text-sm">Section 2 and 3 can use <strong>a completely different YouTube song</strong>. Paste a new URL in the section&apos;s mix panel.</p>
              <p className="text-purple-400 text-xs mt-2">→ Tap &quot;+ Use a different song for this section&quot; under each section</p>
            </div>
            <div className="bg-purple-800 bg-opacity-50 p-4 rounded-xl border-l-4 border-green-400">
              <p className="font-semibold mb-1">Repeat counts</p>
              <p className="text-purple-200 text-sm">Each section loops 1–10× or Infinite. Infinite caps at 5× inside playlists so the queue keeps moving.</p>
              <p className="text-purple-400 text-xs mt-2">→ Set this in the &quot;Repeats for this section&quot; dropdown</p>
            </div>
          </div>
        </div>

        {/* PLAYLISTS & QUEUE */}
        <div className="mb-4">
          <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="bg-purple-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
            Playlists &amp; Queue
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="bg-purple-800 bg-opacity-50 p-4 rounded-xl border-l-4 border-blue-400">
              <p className="font-semibold mb-1">Staging clips → playlist</p>
              <p className="text-purple-200 text-sm">Tap <strong>+</strong> on any feed clip to stage it. The sticky banner at the bottom shows your staged clips.</p>
              <p className="text-purple-400 text-xs mt-2">→ Tap <strong>Edit Order</strong> in the banner to reorder before saving</p>
            </div>
            <div className="bg-purple-800 bg-opacity-50 p-4 rounded-xl border-l-4 border-orange-400">
              <p className="font-semibold mb-1">Queue up to 10 playlists</p>
              <p className="text-purple-200 text-sm">Add playlists to the queue from &quot;My Playlists&quot;. They play back-to-back automatically.</p>
              <p className="text-purple-400 text-xs mt-2">→ Your queue saves to your account — survives refresh &amp; works across devices</p>
            </div>
            <div className="bg-purple-800 bg-opacity-50 p-4 rounded-xl border-l-4 border-purple-400">
              <p className="font-semibold mb-1">Reorder queue without a playlist</p>
              <p className="text-purple-200 text-sm">In the sticky bottom banner, tap <strong>Edit Order</strong> next to the queue count to drag/reorder queued playlists on the fly.</p>
              <p className="text-purple-400 text-xs mt-2">→ ▲▼ buttons reorder · ✕ removes from queue</p>
            </div>
            <div className="bg-purple-800 bg-opacity-50 p-4 rounded-xl border-l-4 border-red-400">
              <p className="font-semibold mb-1">Playlist privacy</p>
              <p className="text-purple-200 text-sm">New playlists are <strong>Public</strong> by default. Toggle to Private anytime from the Manage screen.</p>
              <p className="text-purple-400 text-xs mt-2">→ Tap Manage → toggle the visibility switch</p>
            </div>
          </div>
        </div>

        {/* PLAYBACK */}
        <div className="mb-4">
          <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="bg-purple-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">3</span>
            Playback Controls
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="bg-purple-800 bg-opacity-50 p-4 rounded-xl border-l-4 border-green-400">
              <p className="font-semibold mb-1">🔁 Loop a single clip</p>
              <p className="text-purple-200 text-sm">The <strong>Loop button</strong> (🔁) next to the restart button loops your current clip continuously — no playlist needed.</p>
              <p className="text-purple-400 text-xs mt-2">→ Glows pink when active</p>
            </div>
            <div className="bg-purple-800 bg-opacity-50 p-4 rounded-xl border-l-4 border-yellow-400">
              <p className="font-semibold mb-1">⚡ Gold theme</p>
              <p className="text-purple-200 text-sm">Tap the <strong>⚡ button</strong> in the top bar to switch between Purple and Gold/Electric themes. Saved to your account.</p>
              <p className="text-purple-400 text-xs mt-2">→ Tap 💜 to switch back to purple</p>
            </div>
          </div>
        </div>

        {/* MOBILE */}
        <div className="mb-6">
          <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="bg-purple-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">4</span>
            Mobile Tips
          </p>
          <div className="bg-purple-800 bg-opacity-50 p-4 rounded-xl border-l-4 border-indigo-400 mb-3">
            <p className="font-semibold mb-1">📱 Listen without staying in the browser</p>
            <p className="text-purple-200 text-sm">
              <strong>iPhone:</strong> tap Share → &quot;Add to Home Screen&quot;<br/>
              <strong>Android:</strong> tap browser menu → &quot;Install app&quot; or &quot;Add to Home Screen&quot;<br/>
              This makes ChorusClip run like a native app — audio keeps playing when you switch apps.
            </p>
            <p className="text-purple-400 text-xs mt-2">→ Lock screen controls (play/pause/skip) appear automatically once installed</p>
          </div>
          <div className="bg-purple-800 bg-opacity-50 p-4 rounded-xl border-l-4 border-pink-400">
            <p className="font-semibold mb-1">Timestamp accuracy on mobile</p>
            <p className="text-purple-200 text-sm">Use the large sliders or type exact min:sec. Tap <strong>&quot;Jump to section start &amp; pause&quot;</strong> to land exactly where you want, then fine-tune.</p>
            <p className="text-purple-400 text-xs mt-2">→ Always pause before adjusting — drag sliders left/right slowly</p>
          </div>
        </div>

        <button onClick={onClose} className="w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-xl hover:shadow-2xl transition">
          Got it — Let&apos;s Go! 🎵
        </button>
      </div>
    </div>
  );
}
