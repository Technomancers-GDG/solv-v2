import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY || "").trim(),
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "").trim(),
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID || "").trim(),
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "").trim(),
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "").trim(),
  appId: (import.meta.env.VITE_FIREBASE_APP_ID || "").trim(),
};

const firebaseEnabled = Boolean(firebaseConfig.apiKey);
const useDemoAuth = import.meta.env.VITE_USE_DEMO_AUTH === "true";

let app = null;
let auth = null;
let googleProvider = null;

if (firebaseEnabled) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
} else if (!useDemoAuth) {
  console.info("Firebase not configured — auth features disabled");
}

export { auth, googleProvider };

const DEMO_UID = "demo-uid-001";
const DEMO_EMAIL = "demo@logisight.io";
const DEMO_NAME = "Demo User";

function base64urlEncode(data) {
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  const binary = String.fromCharCode(...bytes);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function createFakeJwt() {
  const header = { alg: "RS256", typ: "JWT", kid: "demo" };
  const payload = {
    uid: DEMO_UID,
    email: DEMO_EMAIL,
    name: DEMO_NAME,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400,
  };
  return `${base64urlEncode(header)}.${base64urlEncode(payload)}.demo`;
}

const fakeJwtToken = createFakeJwt();

let demoUser = null;
let demoListeners = [];

class MockUser {
  constructor() {
    this.uid = DEMO_UID;
    this.email = DEMO_EMAIL;
    this.displayName = DEMO_NAME;
    this.emailVerified = true;
    this.isAnonymous = false;
    this.metadata = { creationTime: null, lastSignInTime: null };
  }
  getIdToken(forceRefresh) {
    return Promise.resolve(fakeJwtToken);
  }
  toJSON() {
    return { uid: this.uid, email: this.email, displayName: this.displayName };
  }
}

function notifyDemoListeners(user) {
  demoListeners.forEach((cb) => {
    try {
      cb(user);
    } catch (e) {
      console.error("Demo auth listener error:", e);
    }
  });
}

function isDemoMode() {
  return useDemoAuth && !firebaseEnabled;
}

function getDemoUser() {
  if (!demoUser) demoUser = new MockUser();
  return demoUser;
}

export async function signInWithGoogle() {
  if (isDemoMode()) {
    const user = getDemoUser();
    notifyDemoListeners(user);
    return { user, idToken: fakeJwtToken, mode: "demo" };
  }
  if (!auth) throw new Error("Firebase is not configured");
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();
    return { user: result.user, idToken, mode: "popup" };
  } catch (error) {
    const message = String(error?.message || error || "");
    const code = String(error?.code || "");
    const shouldRedirect =
      code === "auth/popup-blocked" ||
      code === "auth/popup-closed-by-user" ||
      code === "auth/cancelled-popup-request" ||
      /cross-origin-opener-policy|window\.closed/i.test(message);

    if (shouldRedirect) {
      await signInWithRedirect(auth, googleProvider);
      return { mode: "redirect" };
    }

    console.error("Google Sign-In error:", error);
    throw error;
  }
}

export async function logout() {
  if (isDemoMode()) {
    demoListeners = [];
    notifyDemoListeners(null);
    return;
  }
  if (!auth) return;
  return signOut(auth);
}

export function onAuthChange(callback) {
  if (isDemoMode()) {
    demoListeners.push(callback);
    callback(getDemoUser());
    return () => {
      demoListeners = demoListeners.filter((cb) => cb !== callback);
    };
  }
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
