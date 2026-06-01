import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth"; // Added connectAuthEmulator
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Connect to the local emulators when in Development mode
if (import.meta.env.DEV) {
  // Get the current URL host (either 'localhost' or '127.0.0.1')
  const host = window.location.hostname;
  
  if (!(db as any)._emulatorInitialized) {
    connectFirestoreEmulator(db, host, 8080);
    (db as any)._emulatorInitialized = true;
    console.log(`Connected to local Firestore emulator on ${host}`);
  }

  if (!(auth as any)._emulatorInitialized) {
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
    (auth as any)._emulatorInitialized = true;
    console.log(`Connected to local Auth emulator on ${host}`);
  }
}