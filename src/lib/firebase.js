// lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, sendEmailVerification } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, limit, onSnapshot, startAfter } from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail as firebaseSendPasswordReset,
  signOut as firebaseSignOut
} from 'firebase/auth';


export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('✅ Password reset email sent to:', email);
    return true;
  } catch (error) {
    console.error('❌ Password reset failed:', error);
    throw error;
  }
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

let app;
let auth;
let db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase init error:', error);
}

export { auth, db };

// REAL-TIME CLIPS SUBSCRIPTION
export const subscribeToTrendingClips = (callback) => {
  try {
    const q = query(collection(db, 'clips'), orderBy('createdAt', 'desc'), limit(20));
    return onSnapshot(q, (snapshot) => {
      const clips = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(clips);
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    return () => {}; // Return empty cleanup function
  }
};

// LEADERBOARD - Top clip CREATORS (users who posted clips) this week
// Groups by createdBy (the ChorusClip user's display name), not the YouTube artist.
// Falls back to all-time if Firestore composite index isn't created yet.
export const getLeaderboard = async (limitCount = 10) => {
  try {
    let clipDocs = [];

    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const q = query(
        collection(db, 'clips'),
        where('createdAt', '>=', sevenDaysAgo),
        orderBy('createdAt', 'desc'),
        limit(200)
      );
      const snap = await getDocs(q);
      clipDocs = snap.docs.map(d => d.data());
    } catch {
      // Composite index not yet created — fall back to most-recent 200 clips (all time)
      const q = query(collection(db, 'clips'), orderBy('createdAt', 'desc'), limit(200));
      const snap = await getDocs(q);
      clipDocs = snap.docs.map(d => d.data());
    }

    // Aggregate by the ChorusClip user who posted the clip (createdBy = displayName)
    const creatorStats = {};
    clipDocs.forEach(data => {
      const creator = data.createdBy;
      if (!creator) return;
      if (!creatorStats[creator]) {
        creatorStats[creator] = { name: creator, songs: 0, topArtist: data.artist || '', likes: 0 };
      }
      creatorStats[creator].songs++;
      creatorStats[creator].likes += data.likes || 0;
    });

    return Object.values(creatorStats)
      .sort((a, b) => b.songs - a.songs || b.likes - a.likes)
      .slice(0, limitCount)
      .map((c, i) => ({ ...c, rank: i + 1, artist: c.topArtist }));
  } catch (error) {
    console.log('Leaderboard error:', error);
    return [];
  }
};
// PLAYLIST CRUD
export const deletePlaylist = async (playlistId) => {
  const { deleteDoc } = await import('firebase/firestore');
  await deleteDoc(doc(db, 'playlists', playlistId));
};

export const updatePlaylist = async (playlistId, updates) => {
  await updateDoc(doc(db, 'playlists', playlistId), updates);
};

export const getUserData = async (uid) => {
  const userDoc = await getDoc(doc(db, 'users', uid));
  return userDoc.exists() ? userDoc.data() : null;
};

// CLIPS
export const createClip = async (clipData) => {
  const clipRef = doc(collection(db, 'clips'));
  await setDoc(clipRef, {
    ...clipData,
    id: clipRef.id,
    likes: 0,
    plays: 0,
    shares: 0,
    trendingScore: 0,
    createdAt: new Date()
  });
  return clipRef.id;
};

export const getTrendingClips = async (limitCount = 20) => {
  const q = query(collection(db, 'clips'), orderBy('createdAt', 'desc'), limit(limitCount));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const getClipsPage = async (limitCount = 15, lastVisibleDoc = null) => {
  try {
    const constraints = [orderBy('createdAt', 'desc'), limit(limitCount)];
    if (lastVisibleDoc) {
      constraints.splice(1, 0, startAfter(lastVisibleDoc));
    }

    const q = query(collection(db, 'clips'), ...constraints);
    const snapshot = await getDocs(q);
    const clips = snapshot.docs.map(entry => ({
      id: entry.id,
      ...entry.data()
    }));

    return {
      clips,
      lastVisibleDoc: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.docs.length === limitCount
    };
  } catch (error) {
    console.error('Clip pagination error:', error);
    return {
      clips: [],
      lastVisibleDoc: null,
      hasMore: false
    };
  }
};

// PAYMENTS
export const createPayment = async (userId, amount, pesapalRef) => {
  const paymentRef = doc(collection(db, 'payments'));
  await setDoc(paymentRef, {
    id: paymentRef.id,
    userId: userId,
    amount: amount,
    currency: 'KES',
    status: 'pending',
    pesapalRef: pesapalRef,
    createdAt: new Date()
  });
  return paymentRef.id;
};

export const updatePaymentStatus = async (paymentId, status) => {
  await updateDoc(doc(db, 'payments', paymentId), {
    status: status,
    updatedAt: new Date()
  });

  if (status === 'completed') {
    const paymentDoc = await getDoc(doc(db, 'payments', paymentId));
    const payment = paymentDoc.data();
    
    await updateDoc(doc(db, 'users', payment.userId), {
      isPremium: true,
      premiumSince: new Date(),
      premiumExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
  }
};

export const checkAndResetDailyLimit = async (uid) => {
  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) return;
  
  const userData = userDoc.data();
  const lastReset = userData.lastClipReset?.toDate() || new Date(0);
  const now = new Date();
  
  // Check if it's a new day
  const isSameDay = 
    lastReset.getDate() === now.getDate() &&
    lastReset.getMonth() === now.getMonth() &&
    lastReset.getFullYear() === now.getFullYear();
  
  if (!isSameDay) {
    // Reset counter
    await updateDoc(userRef, {
      clipsToday: 0,
      lastClipReset: now
    });
    return 0; // Return new count
  }
  
  return userData.clipsToday || 0;
};

// Add to firebase.js:

// TRENDING - Most played clips in the last 30 days
export const getTrendingClipsByPlays = async (limitCount = 5) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Filter to recent clips, then client-side sort by plays
    const q = query(
      collection(db, 'clips'),
      where('createdAt', '>=', thirtyDaysAgo),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const snapshot = await getDocs(q);
    const clips = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return clips.sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, limitCount);
  } catch (error) {
    console.error('Trending clips error:', error);
    return [];
  }
};

// TOP ARTISTS - Based on clip activity in the last 30 days
export const getTopArtists = async (limitCount = 5) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const q = query(
      collection(db, 'clips'),
      where('createdAt', '>=', thirtyDaysAgo),
      orderBy('createdAt', 'desc'),
      limit(200)
    );
    const snapshot = await getDocs(q);

    const artistCounts = {};
    snapshot.docs.forEach(doc => {
      const artist = doc.data().artist || 'Unknown';
      artistCounts[artist] = (artistCounts[artist] || 0) + 1;
    });

    return Object.entries(artistCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limitCount)
      .map(([artist, count]) => ({ artist, clips: count }));
  } catch (error) {
    console.error('Top artists error:', error);
    return [];
  }
};

// ── FRIENDS SYSTEM ─────────────────────────────────────────────────────────

/**
 * Send a friend request by the target's displayName (username).
 * Returns 'sent' | 'already_friends' | 'not_found' | 'self'
 */
export const sendFriendRequest = async (fromUid, fromDisplayName, toUsername) => {
  const { collection, query, where, getDocs, addDoc, serverTimestamp } = await import('firebase/firestore');

  if (fromDisplayName.toLowerCase() === toUsername.toLowerCase()) return 'self';

  // Look up target user by displayName
  const usersQ = query(collection(db, 'users'), where('displayName', '==', toUsername));
  const usersSnap = await getDocs(usersQ);
  if (usersSnap.empty) return 'not_found';
  const toUid = usersSnap.docs[0].id;
  const toDisplayName = usersSnap.docs[0].data().displayName;

  // Check if friendship already exists (either direction)
  const existingQ = query(
    collection(db, 'friendships'),
    where('participants', 'array-contains', fromUid)
  );
  const existingSnap = await getDocs(existingQ);
  const alreadyExists = existingSnap.docs.some(d => d.data().participants.includes(toUid));
  if (alreadyExists) return 'already_friends';

  await addDoc(collection(db, 'friendships'), {
    fromUid,
    fromDisplayName,
    toUid,
    toDisplayName,
    participants: [fromUid, toUid],
    status: 'pending',
    createdAt: new Date()
  });
  return 'sent';
};

export const respondToFriendRequest = async (friendshipId, accept) => {
  const { doc, updateDoc } = await import('firebase/firestore');
  await updateDoc(doc(db, 'friendships', friendshipId), {
    status: accept ? 'accepted' : 'declined',
    respondedAt: new Date()
  });
};

export const getFriendships = async (uid) => {
  const { collection, query, where, getDocs } = await import('firebase/firestore');
  const q = query(collection(db, 'friendships'), where('participants', 'array-contains', uid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getFriendActivity = async (friendUids, limitCount = 10) => {
  if (!friendUids || friendUids.length === 0) return [];
  const { collection, query, where, getDocs, orderBy, limit } = await import('firebase/firestore');
  // Firestore 'in' supports max 10 values
  const batch = friendUids.slice(0, 10);
  const q = query(
    collection(db, 'clips'),
    where('userId', 'in', batch),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ── END FRIENDS SYSTEM ──────────────────────────────────────────────────────

// Add these functions at the end of firebase.js
export const signInUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    // Re-throw original Firebase error to preserve error.code for smart UI messaging
    throw error;
  }
};

export const signUpUser = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      displayName: displayName,
      isPremium: false,
      accountCreated: new Date(),
      songsToday: 0,
      lastResetDate: new Date().toDateString()
    });

    return user;
  } catch (error) {
    // Re-throw original Firebase error to preserve error.code for smart UI messaging
    throw error;
  }
};

export const sendPasswordResetEmail = async (email) => {
  try {
    await firebaseSendPasswordReset(auth, email);
  } catch (error) {
    // Re-throw original error to preserve error.code for UI error mapping
    throw error;
  }
};

// QUEUE PERSISTENCE
export const saveQueueToFirestore = async (userId, queueIds) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      savedQueueIds: queueIds,
      queueUpdatedAt: new Date()
    });
  } catch (e) {
    console.error('Failed to save queue:', e);
  }
};

export const loadQueueFromFirestore = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data().savedQueueIds || [];
    }
    return [];
  } catch (e) {
    console.error('Failed to load queue:', e);
    return [];
  }
};
