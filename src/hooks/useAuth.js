'use client';
import { useEffect, useState } from 'react';

const guest = {
  uid: null, displayName: 'Guest', email: '', likedClips: [], likedPlaylists: []
};

export function useAuth() {
  const [user, setUser] = useState(guest);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let disposed = false;
    let unsubscribe;
    let generation = 0;

    async function subscribe() {
      const [{ auth, db }, { onAuthStateChanged }, { getDoc, doc }] = await Promise.all([
        import('../lib/firebase'), import('firebase/auth'), import('firebase/firestore')
      ]);
      if (disposed) return;
      unsubscribe = onAuthStateChanged(auth, account => {
        const current = ++generation;
        const active = () => !disposed && current === generation;
        setProfile(null);
        setAuthReady(true);
        if (!account) {
          setUser(guest);
          return;
        }

        const { uid, email, displayName } = account;
        setUser({ ...guest, uid, email, displayName: displayName || email?.split('@')[0] || 'Member' });
        getDoc(doc(db, 'users', uid)).then(snapshot => {
          if (!active()) return;
          const data = snapshot.data() || {};
          setProfile({ uid, data });
          setUser(prev => ({
            ...prev,
            displayName: data.displayName || prev.displayName,
            isPremium: data.isPremium || false,
            appTheme: data.appTheme || 'classic',
            usernameChanges: data.usernameChanges || 0,
            accountCreatedDaysAgo: data.accountCreated?.toMillis
              ? Math.floor((Date.now() - data.accountCreated.toMillis()) / 86400000)
              : 0
          }));
        }).catch(error => {
          if (active()) setProfile({ uid, data: {} });
          console.error('Profile could not load:', error);
        });
        for (const [collection, field] of [['userLikes', 'likedClips'], ['userPlaylistLikes', 'likedPlaylists']]) {
          getDoc(doc(db, collection, uid)).then(snapshot => {
            if (!active()) return;
            setUser(prev => ({ ...prev, [field]: [...new Set([...(snapshot.data()?.[field] || []), ...prev[field]])] }));
          }).catch(error => console.error('Likes could not load:', error));
        }
      });
    }

    subscribe().catch(error => {
      if (!disposed) setAuthReady(true);
      console.error('Auth could not start:', error);
    });
    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, []);

  return { user, setUser, authReady, profile };
}
