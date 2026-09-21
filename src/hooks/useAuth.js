'use client';
import { useState, useEffect } from 'react';

export function useAuth() {
  const [user, setUser] = useState({
    uid: null,
    displayName: 'Guest',
    email: '',
    isPremium: false,
    songsToday: 0,
    accountCreatedDaysAgo: 0,
    likedClips: [],
    likedPlaylists: [],
    appTheme: null
  });
 
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      // Use relative path
      const { auth, getUserData, db, checkAndResetDailyLimit } = await import('../lib/firebase');
      const { onAuthStateChanged } = await import('firebase/auth');
      const { doc, getDoc } = await import('firebase/firestore');

      onAuthStateChanged(auth, async (firebaseUser) => {
        if (!firebaseUser) {
          return setUser({
            uid: null,
            displayName: 'Guest',
            email: '',
            isPremium: false,
            songsToday: 0,
            accountCreatedDaysAgo: 0,
            likedClips: [],
            likedPlaylists: [],
            appTheme: null
          });
        }

        try {
          const userData = await getUserData(firebaseUser.uid);
          let likedClips = [];
          let likedPlaylists = [];
          
          try {
            const likesDoc = await getDoc(doc(db, 'userLikes', firebaseUser.uid));
            if (likesDoc.exists()) likedClips = likesDoc.data().likedClips || [];
            const playlistLikesDoc = await getDoc(doc(db, 'userPlaylistLikes', firebaseUser.uid));
            if (playlistLikesDoc.exists()) likedPlaylists = playlistLikesDoc.data().likedPlaylists || [];
          } catch (e) {
            console.error('Failed to fetch liked clips:', e);
          }

          const songsToday = await checkAndResetDailyLimit(firebaseUser.uid);

          if (userData) {
            setUser({
              uid: firebaseUser.uid,
              displayName: userData.displayName,
              email: userData.email,
              isPremium: userData.isPremium || false,
              songsToday,
              appTheme: userData.appTheme || 'classic',
              accountCreatedDaysAgo: Math.floor(
                (Date.now() - userData.accountCreated.toDate().getTime()) / (1000 * 60 * 60 * 24)
              ),
              likedClips,
              likedPlaylists
            });
          }
        } catch (error) {
          console.error('Auth state handling failed:', error);
        }
      });
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  };

  return { user, setUser, checkAuthState };
}
