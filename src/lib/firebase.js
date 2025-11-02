// lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Profanity filter
const profanityList = [
  'fuck', 'shit', 'damn', 'bitch', 'ass', 'hell', 'crap',
  'dick', 'pussy', 'cock', 'bastard', 'whore', 'slut'
];
export const subscribeToTrendingClips = (callback) => {
  return onSnapshot(
    query(collection(db, 'clips'), orderBy('trendingScore', 'desc'), limit(20)),
    (snapshot) => {
      const clips = snapshot.docs.map(doc => doc.data());
      callback(clips);
    }
  );
};

export const getLeaderboard = async (limit = 3) => {
  try {
    const usersSnapshot = await getDocs(
      query(collection(db, 'users'), orderBy('clipsToday', 'desc'), limit(limit))
    );
    
    return usersSnapshot.docs.map((doc, index) => ({
      rank: index + 1,
      name: doc.data().displayName,
      songs: doc.data().clipsToday,
      artist: 'Various' // TODO: Track user's most-used artist
    }));
  } catch (error) {
    console.error('Leaderboard error:', error);
    return [];
  }
};

export const validateDisplayName = (name) => {
  const lowerName = name.toLowerCase();
  
  // Check for profanity
  const hasProfanity = profanityList.some(word => lowerName.includes(word));
  if (hasProfanity) {
    return { valid: false, message: 'Display name contains inappropriate language' };
  }
  
  // Check length
  if (name.length < 3) {
    return { valid: false, message: 'Display name must be at least 3 characters' };
  }
  
  if (name.length > 20) {
    return { valid: false, message: 'Display name must be less than 20 characters' };
  }
  
  // Check valid characters
  const validPattern = /^[a-zA-Z0-9_\s]+$/;
  if (!validPattern.test(name)) {
    return { valid: false, message: 'Display name can only contain letters, numbers, underscores, and spaces' };
  }
  
  return { valid: true };
};

// Auth functions
export const signUpUser = async (email, password, displayName) => {
  // Check if email is from Strathmore
  if (!email.endsWith('@strathmore.edu')) {
    throw new Error('Only Strathmore University students can sign up');
  }

  // Validate display name
  const validation = validateDisplayName(displayName);
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  try {
    // Create user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Send verification email
    await sendEmailVerification(user);

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: email,
      displayName: displayName,
      isPremium: false,
      clipsToday: 0,
      clipsThisWeek: 0,
      accountCreated: new Date(),
      lastClipReset: new Date()
    });

    return user;
  } catch (error) {
    throw error;
  }
};

export const signInUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

// User functions
export const getUserData = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    throw error;
  }
};

export const resetDailyClips = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    const userData = userDoc.data();
    const lastReset = userData.lastClipReset.toDate();
    const now = new Date();
    
    // Reset if last reset was yesterday or earlier
    if (now.getDate() !== lastReset.getDate() || 
        now.getMonth() !== lastReset.getMonth() || 
        now.getFullYear() !== lastReset.getFullYear()) {
      
      await updateDoc(doc(db, 'users', uid), {
        clipsToday: 0,
        lastClipReset: now
      });
    }
  } catch (error) {
    throw error;
  }
};

export const incrementClipCount = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    const userData = userDoc.data();
    
    await updateDoc(doc(db, 'users', uid), {
      clipsToday: userData.clipsToday + 1,
      clipsThisWeek: userData.clipsThisWeek + 1
    });
  } catch (error) {
    throw error;
  }
};

// Clip functions
export const createClip = async (clipData) => {
  try {
    const clipRef = doc(collection(db, 'clips'));
    await setDoc(clipRef, {
      ...clipData,
      id: clipRef.id,
      likes: 0,
      plays: 0,
      shares: 0,
      trendingScore: 0,
      loopCount: 0,
      createdAt: new Date()
    });
    return clipRef.id;
  } catch (error) {
    throw error;
  }
};

export const getTrendingClips = async (limitCount = 20) => {
  try {
    const q = query(
      collection(db, 'clips'),
      orderBy('trendingScore', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  } catch (error) {
    throw error;
  }
};

export const updateTrendingScore = async (clipId) => {
  try {
    const clipDoc = await getDoc(doc(db, 'clips', clipId));
    const clip = clipDoc.data();
    
    const createdAt = clip.createdAt.toDate();
    const ageInHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    
    // Trending score formula
    const score = (clip.likes * 2) + (clip.plays * 1) + (clip.shares * 3) - (ageInHours * 0.5);
    
    await updateDoc(doc(db, 'clips', clipId), {
      trendingScore: score
    });
  } catch (error) {
    throw error;
  }
};

export const incrementClipInteraction = async (clipId, type) => {
  try {
    const clipDoc = await getDoc(doc(db, 'clips', clipId));
    const clip = clipDoc.data();
    
    const updates = {};
    if (type === 'like') updates.likes = clip.likes + 1;
    if (type === 'play') updates.plays = clip.plays + 1;
    if (type === 'share') updates.shares = clip.shares + 1;
    
    await updateDoc(doc(db, 'clips', clipId), updates);
    await updateTrendingScore(clipId);
  } catch (error) {
    throw error;
  }
};

// Playlist functions (Premium only)
export const createPlaylist = async (userId, playlistData) => {
  try {
    const playlistRef = doc(collection(db, 'playlists'));
    await setDoc(playlistRef, {
      ...playlistData,
      id: playlistRef.id,
      userId: userId,
      createdAt: new Date()
    });
    return playlistRef.id;
  } catch (error) {
    throw error;
  }
};

export const getUserPlaylists = async (userId) => {
  try {
    const q = query(
      collection(db, 'playlists'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  } catch (error) {
    throw error;
  }
};

// Payment functions
export const createPayment = async (userId, amount, pesapalRef) => {
  try {
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
  } catch (error) {
    throw error;
  }
};

export const updatePaymentStatus = async (paymentId, status) => {
  try {
    await updateDoc(doc(db, 'payments', paymentId), {
      status: status,
      updatedAt: new Date()
    });

    // If payment successful, update user to premium
    if (status === 'completed') {
      const paymentDoc = await getDoc(doc(db, 'payments', paymentId));
      const payment = paymentDoc.data();
      
      await updateDoc(doc(db, 'users', payment.userId), {
        isPremium: true,
        premiumSince: new Date(),
        premiumExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      });
    }
  } catch (error) {
    throw error;
  }
};