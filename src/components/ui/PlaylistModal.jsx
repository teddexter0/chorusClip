'use client';
import { X } from 'lucide-react';

export default function PlaylistModal({ 
  onClose, 
  selectedClips, 
  setSelectedClips, 
  userId, 
  showNotification 
}) {
  
  const handleCreate = async () => {
    const name = document.getElementById('playlist-name-input')?.value;
    if (!name || selectedClips.length === 0) {
      showNotification('Add clips and enter a name!', 'error');
      return;
    }
    
    try {
      // Use relative path
      const { createPlaylist } = await import('../../utils/playlistUtils');
      await createPlaylist(userId, name, selectedClips);
      showNotification('🎉 Playlist created!', 'success');
      onClose();
      setSelectedClips([]);
    } catch (error) {
      showNotification('Failed to create playlist', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-3xl p-8 max-w-2xl w-full border border-purple-500">
        <button onClick={onClose} className="float-right text-white hover:text-purple-300 transition">
          <X size={32} />
        </button>
        
        <h2 className="text-3xl font-bold mb-6">Create Playlist</h2>
        
        <div className="space-y-4 mb-6">
          <input
            type="text"
            placeholder="Playlist name (e.g., '2010s Party Mix')"
            className="w-full px-5 py-4 bg-purple-950 border border-purple-600 rounded-xl text-white"
            id="playlist-name-input"
          />
          
          <div className="bg-purple-900 bg-opacity-30 p-4 rounded-xl max-h-60 overflow-y-auto">
            <p className="font-bold mb-2">Selected Clips ({selectedClips.length}):</p>
            {selectedClips.map((clip, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-purple-700">
                <span>{clip.title}</span>
                <button
                  onClick={() => setSelectedClips(selectedClips.filter((_, i) => i !== idx))}
                  className="text-red-400"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleCreate}
            className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold"
          >
            Create Playlist
          </button>
          <button
            onClick={onClose}
            className="px-6 py-4 bg-purple-800 rounded-xl"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}