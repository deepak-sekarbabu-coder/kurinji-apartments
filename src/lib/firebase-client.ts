import { getApp, getApps, initializeApp } from 'firebase/app';

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
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
