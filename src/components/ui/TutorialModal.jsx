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
          <p className="text-purple-300 text-center text-base sm:text-lg">Quick tutorial:<br/>1. Paste YouTube link<br/>2. Adjust loop points<br/>3. Play and enjoy!</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 text-base mb-6">
          <div className="bg-purple-800 bg-opacity-50 p-5 rounded-xl">
            <p className="font-semibold mb-2 text-lg">Step 1</p>
            <p className="text-purple-200">Paste YouTube link</p>
          </div>
          <div className="bg-purple-800 bg-opacity-50 p-5 rounded-xl">
            <p className="font-semibold mb-2 text-lg">Step 2</p>
            <p className="text-purple-200">Auto-detect best part</p>
          </div>
          <div className="bg-purple-800 bg-opacity-50 p-5 rounded-xl">
            <p className="font-semibold mb-2 text-lg">Step 3</p>
            <p className="text-purple-200">Loop endlessly!</p>
          </div>
          <div className="bg-purple-800 bg-opacity-50 p-5 rounded-xl">
            <p className="font-semibold mb-2 text-lg">Premium</p>
            <p className="text-purple-200">3 loops, playlists, downloads</p>
          </div>
        </div>
        <button onClick={onClose} className="w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-xl hover:shadow-2xl transition pulse-glow">
          Let's Go!
        </button>
      </div>
    </div>
  );
}