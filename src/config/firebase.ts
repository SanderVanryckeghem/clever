import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';

// Firebase configuration
// Note: These values are safe to expose in client-side code.
// Security is handled by Firebase Security Rules, not by hiding config.
// Make sure to set up proper Security Rules in Firebase Console.
const firebaseConfig = {
  apiKey: "AIzaSyC39kbzRMZFWb9cy0B-D2KGYyYgahHuFO0",
  authDomain: "clever-f2af8.firebaseapp.com",
  databaseURL: "https://clever-f2af8-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "clever-f2af8",
  storageBucket: "clever-f2af8.firebasestorage.app",
  messagingSenderId: "861420487488",
  appId: "1:861420487488:web:36bca3d439053040a2f0a5",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
export const database = getDatabase(app);

// Initialize Auth
export const auth = getAuth(app);

// Sign in anonymously and return the user
export const signInAnonymouslyAndGetUser = async (): Promise<User> => {
  const result = await signInAnonymously(auth);
  return result.user;
};

// Get current user or sign in
export const ensureAuthenticated = (): Promise<User> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        try {
          const newUser = await signInAnonymouslyAndGetUser();
          resolve(newUser);
        } catch (error) {
          reject(error);
        }
      }
    });
  });
};

// Generate a 6-character room code
export const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoiding confusing characters like O/0, I/1
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export default app;
