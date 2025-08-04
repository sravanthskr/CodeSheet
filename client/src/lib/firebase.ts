import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAkEthV64oQrb0q31ORiY14dN0PKnRBQEA",
  authDomain: "coding-sheet-all.firebaseapp.com",
  projectId: "coding-sheet-all",
  storageBucket: "coding-sheet-all.firebasestorage.app",
  messagingSenderId: "369170667206",
  appId: "1:369170667206:web:4b13225648b5de4422a9c7",
  measurementId: "G-7GK6S4W9T0"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;