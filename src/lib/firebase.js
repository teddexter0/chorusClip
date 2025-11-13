// lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth'; 
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

// LEADERBOARD
export const getLeaderboard = async (limitCount = 3) => {
  try {
    const usersSnapshot = await getDocs(
      query(collection(db, 'users'), orderBy('clipsToday', 'desc'), limit(limitCount))
    );
    
    // For each user, find their most posted artist
    const leaderboardPromises = usersSnapshot.docs.map(async (userDoc, index) => {
      const userData = userDoc.data();
      
      // Get all clips by this user
      const userClipsQuery = query(
        collection(db, 'clips'),
        where('userId', '==', userDoc.id)
      );
      const clipsSnapshot = await getDocs(userClipsQuery);
      
      // Count artists
      const artistCounts = {};
      clipsSnapshot.docs.forEach(clipDoc => {
        const artist = clipDoc.data().artist || 'Unknown';
        artistCounts[artist] = (artistCounts[artist] || 0) + 1;
      });
      
      // Find top artist
      let topArtist = 'Various';
      let maxCount = 0;
      Object.entries(artistCounts).forEach(([artist, count]) => {
        if (count > maxCount) {
          maxCount = count;
          topArtist = artist;
        }
      });
      
      return {
        rank: index + 1,
        name: userData.displayName || 'Anonymous',
        songs: userData.clipsToday || 0,
        artist: topArtist
      };
    });
    
    return await Promise.all(leaderboardPromises);
  } catch (error) {
    console.error('Leaderboard error:', error);
    return [];
  }
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

export const getTrendingClipsByPlays = async (limitCount = 5) => {
  try {
    const q = query(
      collection(db, 'clips'), 
      orderBy('plays', 'desc'), 
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Trending clips error:', error);
    return [];
  }
};

export const getTopArtists = async (limitCount = 5) => {
  try {
    const clipsSnapshot = await getDocs(collection(db, 'clips'));
    
    // Count clips per artist
    const artistCounts = {};
    clipsSnapshot.docs.forEach(doc => {
      const artist = doc.data().artist || 'Unknown';
      artistCounts[artist] = (artistCounts[artist] || 0) + 1;
    });
    
    // Sort by count
    const sortedArtists = Object.entries(artistCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limitCount)
      .map(([artist, count]) => ({ artist, clips: count }));
    
    return sortedArtists;
  } catch (error) {
    console.error('Top artists error:', error);
    return [];
  }
};

// Add these functions at the end of firebase.js
export const signInUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw new Error(error.message);
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
    throw new Error(error.message);
  }
};

export const sendPasswordResetEmail = async (email) => {
  try {
    await firebaseSendPasswordReset(auth, email);
  } catch (error) {
    throw new Error(error.message);
  }
};