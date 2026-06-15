// Firebase is disabled in this project.
// This is a mock implementation for the frontend to continue working without Firebase.

export const auth = {};
export const googleProvider = {};

export async function signInWithGoogle() {
  console.log("Mock Google Sign-In triggered");
  const mockUser = {
    uid: "mock-uid-123",
    email: "demo@example.com",
    displayName: "Demo User",
    photoURL: "https://ui-avatars.com/api/?name=Demo+User",
    getIdToken: async () => {
      // Create a mock JWT token. The backend _decode_unverified_firebase_token expects 
      // header.payload.signature and decodes the payload from base64.
      // Payload: {"uid":"mock-uid-123","email":"demo@example.com","name":"Demo User"}
      return "mock.eyJ1aWQiOiJtb2NrLXVpZC0xMjMiLCJlbWFpbCI6ImRlbW9AZXhhbXBsZS5jb20iLCJuYW1lIjoiRGVtbyBVc2VyIn0=.mock";
    }
  };

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Trigger auth state change listeners
  authListeners.forEach(listener => listener(mockUser));

  return { 
    user: mockUser, 
    idToken: await mockUser.getIdToken(), 
    mode: "popup" 
  };
}

const authListeners = [];

export async function logout() {
  console.log("Mock Logout triggered");
  authListeners.forEach(listener => listener(null));
}

export function onAuthChange(callback) {
  authListeners.push(callback);
  // Initially notify with null (not logged in) or you could simulate logged in
  setTimeout(() => callback(null), 100);
  return () => {
    const idx = authListeners.indexOf(callback);
    if (idx > -1) authListeners.splice(idx, 1);
  };
}
