// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDXbuxT8Vw6Nxgts2gljV7q3h-nEHxlu4s',
  authDomain: 'kurinjiapartmentsprod.firebaseapp.com',
  projectId: 'kurinjiapartmentsprod',
  storageBucket: 'kurinjiapartmentsprod.firebasestorage.app',
  messagingSenderId: '752778628980',
  appId: '1:752778628980:web:d4d388d6e2c8a262ee6621',
  measurementId: 'G-YET8KC6YV6',
};
// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

export { db, auth, messaging, app };
