// src/lib/firebase-server.js
// Server-side Firebase functions for API routes
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase for server-side
let app;
let db;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

db = getFirestore(app);

// PAYMENTS (Server-side only)
export const createPayment = async (userId, amount, pesapalRef) => {
  try {
    const { collection } = await import('firebase/firestore');
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
    console.error('Create payment error:', error);
    throw error;
  }
};

export const updatePaymentStatus = async (paymentId, status) => {
  try {
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
  } catch (error) {
    console.error('Update payment status error:', error);
    throw error;
  }
};