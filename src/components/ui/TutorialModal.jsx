'use client';
import { X, Sparkles, Video } from 'lucide-react';

export default function TutorialModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full relative border border-purple-500 my-8 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-purple-300 transition z-10">
          <X size={32} />
        </button>
        <h2 className="text-3xl sm:text-4xl font-bold mb-6 flex items-center gap-3 pr-12">
          <Sparkles className="text-yellow-400 flex-shrink-0" size={36} />
          <span>Welcome to ChorusClip!</span>
        </h2>
        <div className="bg-black bg-opacity-50 rounded-2xl p-6 sm:p-8 mb-6 flex flex-col items-center justify-center aspect-video">
          <Video size={72} className="text-purple-400 mb-4" />
          <p className="text-purple-300 text-center text-base sm:text-lg">
            1. Paste a YouTube link<br/>
            2. Define up to 3 sections of the song<br/>
            3. Set how many times each section repeats<br/>
            4. Save as a Clip &amp; add to a playlist!
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 text-base mb-6">
          <div className="bg-purple-800 bg-opacity-50 p-5 rounded-xl">
            <p className="font-semibold mb-2 text-lg">Creating a Clip</p>
            <p className="text-purple-200">Paste a YouTube URL  Load Song  adjust up to 3 sections  Post to Feed.</p>
          </div>
          <div className="bg-purple-800 bg-opacity-50 p-5 rounded-xl">
            <p className="font-semibold mb-2 text-lg">Setting timestamps</p>
            <p className="text-purple-200">Use the sliders <em>or</em> type exact min/sec. Tap <strong>"Jump to section start & pause"</strong> to preview a timestamp before saving it.</p>
          </div>
          <div className="bg-purple-800 bg-opacity-50 p-5 rounded-xl">
            <p className="font-semibold mb-2 text-lg">📱 Mobile tip</p>
            <p className="text-purple-200">Use ▲▼ buttons (now bigger!) to reorder sections. Jump-pause first, then drag the large slider. Way easier than guessing the timestamp.</p>
          </div>
          <div className="bg-purple-800 bg-opacity-50 p-5 rounded-xl">
            <p className="font-semibold mb-2 text-lg">Infinite repeats</p>
            <p className="text-purple-200">Infinite sections cap at 5 inside playlists so the queue keeps moving forward.</p>
          </div>
          <div className="bg-purple-800 bg-opacity-50 p-5 rounded-xl">
            <p className="font-semibold mb-2 text-lg">Queue (up to 10)</p>
            <p className="text-purple-200">Queue up to <strong>10 playlists</strong> for back-to-back play. Your queue is saved to your account  it survives refresh and works across devices.</p>
          </div>
          <div className="bg-purple-800 bg-opacity-50 p-5 rounded-xl">
            <p className="font-semibold mb-2 text-lg">Loop & Privacy</p>
            <p className="text-purple-200">Hit the 🔁 button to loop a clip continuously. Toggle playlists public/private anytime from the Manage screen.</p>
          </div>
        </div>
        <button onClick={onClose} className="w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-xl hover:shadow-2xl transition pulse-glow">
          Let's Go!
        </button>
      </div>
    </div>
  );
}
