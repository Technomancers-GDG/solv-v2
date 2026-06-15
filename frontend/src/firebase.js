import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

const apiKey = (import.meta.env.VITE_FIREBASE_API_KEY || "").trim();
const hasFirebaseConfig = !!(apiKey && apiKey !== "YOUR_API_KEY");

let app = null;
let auth = null;
let googleProvider = null;

if (hasFirebaseConfig) {
  try {
    const firebaseConfig = {
      apiKey: apiKey,
      authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "").trim(),
      projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID || "").trim(),
      storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "").trim(),
      messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "").trim(),
      appId: (import.meta.env.VITE_FIREBASE_APP_ID || "").trim(),
    };
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

export { auth, googleProvider };

export async function signInWithGoogle() {
  if (!hasFirebaseConfig || !auth) {
    console.warn("Firebase is disabled or not configured. Falling back to Demo login.");
    const demoUser = {
      uid: "mock-google-uid-123",
      displayName: "Demo Google User",
      email: "demo.google@logisight.io",
      photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=demo",
    };
    localStorage.setItem("logisight-demo-user", JSON.stringify(demoUser));
    return { user: demoUser, idToken: "mock-id-token" };
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
  localStorage.removeItem("logisight-demo-user");
  if (!hasFirebaseConfig || !auth) {
    return Promise.resolve();
  }
  return signOut(auth);
}

export function onAuthChange(callback) {
  if (!hasFirebaseConfig || !auth) {
    // Check if demo user is stored in localStorage
    const savedUser = localStorage.getItem("logisight-demo-user");
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        callback(user);
      } catch (e) {
        callback(null);
      }
    } else {
      callback(null);
    }
    // Return unsubscribe function
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
