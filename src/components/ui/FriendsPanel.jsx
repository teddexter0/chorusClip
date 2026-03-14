'use client';
import { useState, useEffect } from 'react';
import { X, UserPlus, Check, XCircle, Play, Music } from 'lucide-react';

export default function FriendsPanel({ user, onClose, onPlayClip, showNotification }) {
  const [tab, setTab] = useState('friends'); // 'friends' | 'requests' | 'activity'
  const [friendships, setFriendships] = useState([]);
  const [friendActivity, setFriendActivity] = useState([]);
  const [searchUsername, setSearchUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);

  useEffect(() => {
    if (user?.uid) loadFriendships();
  }, [user?.uid]);

  const loadFriendships = async () => {
    setLoading(true);
    try {
      const { getFriendships, getFriendActivity } = await import('../../lib/firebase');
      const all = await getFriendships(user.uid);
      setFriendships(all);

      // Load activity for accepted friends
      const acceptedFriendUids = all
        .filter(f => f.status === 'accepted')
        .map(f => f.fromUid === user.uid ? f.toUid : f.fromUid);
      if (acceptedFriendUids.length > 0) {
        const activity = await getFriendActivity(acceptedFriendUids, 10);
        setFriendActivity(activity);
      }
    } catch (e) {
      console.error('Load friendships error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    const target = searchUsername.trim();
    if (!target) return;
    setSendingRequest(true);
    try {
      const { sendFriendRequest } = await import('../../lib/firebase');
      const result = await sendFriendRequest(user.uid, user.displayName, target);
      const messages = {
        sent: `Friend request sent to @${target}!`,
        already_friends: `You're already connected with @${target}`,
        not_found: `No user found with username "@${target}"`,
        self: `You can't add yourself!`,
      };
      showNotification(messages[result] || 'Done', result === 'sent' ? 'success' : 'info');
      if (result === 'sent') { setSearchUsername(''); loadFriendships(); }
    } catch (e) {
      showNotification('Failed to send request', 'error');
    } finally {
      setSendingRequest(false);
    }
  };

  const handleRespond = async (friendshipId, accept) => {
    try {
      const { respondToFriendRequest } = await import('../../lib/firebase');
      await respondToFriendRequest(friendshipId, accept);
      showNotification(accept ? 'Friend added!' : 'Request declined', accept ? 'success' : 'info');
      loadFriendships();
    } catch (e) {
      showNotification('Failed to respond', 'error');
    }
  };

  const acceptedFriends = friendships.filter(f => f.status === 'accepted');
  const pendingReceived = friendships.filter(f => f.status === 'pending' && f.toUid === user.uid);
  const pendingSent = friendships.filter(f => f.status === 'pending' && f.fromUid === user.uid);

  const getFriendName = (f) => f.fromUid === user.uid ? f.toDisplayName : f.fromDisplayName;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-start justify-end p-4 sm:p-6">
      <div className="bg-gradient-to-br from-purple-950 to-indigo-950 rounded-3xl p-6 w-full max-w-md border border-purple-500 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-black flex items-center gap-2">
            <UserPlus size={24} className="text-purple-400" /> Friends
          </h2>
          <button onClick={onClose} className="text-white hover:text-purple-300 transition">
            <X size={28} />
          </button>
        </div>

        {/* Send friend request */}
        <div className="mb-5">
          <label className="block text-sm font-bold text-purple-300 mb-2">Add friend by username</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchUsername}
              onChange={e => setSearchUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendRequest()}
              placeholder="exact_username"
              className="flex-1 px-4 py-3 bg-purple-950 bg-opacity-60 border border-purple-600 rounded-xl text-white placeholder-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
            <button
              onClick={handleSendRequest}
              disabled={sendingRequest || !searchUsername.trim()}
              className="px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold text-sm disabled:opacity-50 transition hover:shadow-lg"
            >
              {sendingRequest ? '...' : 'Send'}
            </button>
          </div>
          <p className="text-xs text-purple-500 mt-1">Username must match exactly (case-sensitive)</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { key: 'friends', label: `Friends (${acceptedFriends.length})` },
            { key: 'requests', label: `Requests ${pendingReceived.length > 0 ? `(${pendingReceived.length})` : ''}` },
            { key: 'activity', label: 'Activity' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${tab === t.key ? 'bg-purple-600 text-white' : 'bg-purple-900 bg-opacity-40 text-purple-300 hover:bg-opacity-70'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading && <p className="text-center text-purple-400 py-6 text-sm">Loading...</p>}

        {/* FRIENDS TAB */}
        {!loading && tab === 'friends' && (
          <div className="space-y-2">
            {acceptedFriends.length === 0 ? (
              <div className="text-center py-8 text-purple-400">
                <UserPlus size={40} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">No friends yet. Send a request above!</p>
              </div>
            ) : acceptedFriends.map(f => (
              <div key={f.id} className="flex items-center justify-between bg-purple-900 bg-opacity-30 px-4 py-3 rounded-xl">
                <div>
                  <p className="font-semibold">@{getFriendName(f)}</p>
                  <p className="text-xs text-purple-400">Connected</p>
                </div>
                <Check size={18} className="text-green-400" />
              </div>
            ))}

            {pendingSent.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-bold text-purple-400 uppercase tracking-wide mb-2">Sent requests</p>
                {pendingSent.map(f => (
                  <div key={f.id} className="flex items-center justify-between bg-purple-900 bg-opacity-20 px-4 py-3 rounded-xl mb-1">
                    <p className="text-sm font-semibold">@{f.toDisplayName}</p>
                    <span className="text-xs text-yellow-400 font-semibold">Pending</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REQUESTS TAB */}
        {!loading && tab === 'requests' && (
          <div className="space-y-2">
            {pendingReceived.length === 0 ? (
              <p className="text-center text-purple-400 py-8 text-sm">No pending requests</p>
            ) : pendingReceived.map(f => (
              <div key={f.id} className="bg-purple-900 bg-opacity-30 px-4 py-4 rounded-xl">
                <p className="font-semibold mb-1">@{f.fromDisplayName}</p>
                <p className="text-xs text-purple-400 mb-3">wants to be friends</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRespond(f.id, true)}
                    className="flex-1 py-2 bg-green-700 hover:bg-green-600 rounded-xl text-sm font-semibold flex items-center justify-center gap-1 transition"
                  >
                    <Check size={16}/> Accept
                  </button>
                  <button
                    onClick={() => handleRespond(f.id, false)}
                    className="flex-1 py-2 bg-red-800 hover:bg-red-700 rounded-xl text-sm font-semibold flex items-center justify-center gap-1 transition"
                  >
                    <XCircle size={16}/> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ACTIVITY TAB */}
        {!loading && tab === 'activity' && (
          <div className="space-y-2">
            {friendActivity.length === 0 ? (
              <div className="text-center py-8 text-purple-400">
                <Music size={40} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">
                  {acceptedFriends.length === 0
                    ? 'Add friends to see their clips here'
                    : "No recent clips from friends yet"}
                </p>
              </div>
            ) : friendActivity.map(clip => {
              const sections = clip.loops || [{ start: clip.startTime || 0, end: clip.endTime || 30 }];
              return (
                <div key={clip.id} className="bg-purple-900 bg-opacity-30 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="font-semibold truncate">{clip.title}</p>
                      <p className="text-xs text-purple-300 truncate">{clip.artist}</p>
                      <p className="text-xs text-purple-500 mt-0.5">@{clip.createdBy} · {sections.length} section{sections.length > 1 ? 's' : ''}</p>
                    </div>
                    <button
                      onClick={() => { onPlayClip(clip.id, clip.youtubeVideoId, clip); onClose(); }}
                      className="text-purple-300 hover:text-white transition flex-shrink-0"
                      title="Play clip"
                    >
                      <Play size={20} fill="currentColor" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
