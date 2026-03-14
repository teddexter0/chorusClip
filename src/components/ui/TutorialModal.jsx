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
            <p className="font-semibold mb-2 text-lg">Clip</p>
            <p className="text-purple-200">Up to 3 sections of a song, each with their own repeat count</p>
          </div>
          <div className="bg-purple-800 bg-opacity-50 p-5 rounded-xl">
            <p className="font-semibold mb-2 text-lg">Sections</p>
            <p className="text-purple-200">Pick start + end times. Set repeat count (1–10× or Infinite)</p>
          </div>
          <div className="bg-purple-800 bg-opacity-50 p-5 rounded-xl">
            <p className="font-semibold mb-2 text-lg">Infinite repeats</p>
            <p className="text-purple-200">Infinite caps at 5× inside playlists so the queue keeps moving</p>
          </div>
          <div className="bg-purple-800 bg-opacity-50 p-5 rounded-xl">
            <p className="font-semibold mb-2 text-lg">Playlists &amp; Queue</p>
            <p className="text-purple-200">Add clips to playlists, then queue up to 5 playlists to play back-to-back</p>
          </div>
        </div>
        <button onClick={onClose} className="w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-xl hover:shadow-2xl transition pulse-glow">
          Let's Go!
        </button>
      </div>
    </div>
  );
}