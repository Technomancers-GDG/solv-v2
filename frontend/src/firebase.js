import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  // TODO: Replace with your Firebase project config from Firebase Console
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY || "").trim(),
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "").trim(),
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID || "").trim(),
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "").trim(),
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "").trim(),
  appId: (import.meta.env.VITE_FIREBASE_APP_ID || "").trim(),
};

const hasFirebaseConfig = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId,
);

export const auth = hasFirebaseConfig ? getAuth(initializeApp(firebaseConfig)) : null;
export const googleProvider = new GoogleAuthProvider();

const DEMO_USER = { uid: "demo", email: "demo@solv.app", displayName: "Demo User", photoURL: null };

export async function signInWithGoogle() {
  if (!auth) {
    return { user: DEMO_USER, idToken: null };
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();
    return { user: result.user, idToken };
  } catch (error) {
    console.error("Google Sign-In error:", error);
    throw error;
  }
}

export async function logout() {
  if (!auth) {
    return;
  }

  return signOut(auth);
}

export function onAuthChange(callback) {
  if (!auth) {
    callback(DEMO_USER);
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
}
