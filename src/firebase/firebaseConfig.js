// src/firebase/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// IMPORTANT: Ensure these environment variables are set in your .env (CRA) or import your config directly.
// REACT_APP_ prefix is required for Create React App to expose env vars to the browser.
// Prefer using environment variables in production, but this shows the corrected values.
const firebaseConfig = {
  apiKey: "AIzaSyAambYyqbJHWM6uABJ5RSDEc26shiWRPzk",
  authDomain: "inventory-management-a06af.firebaseapp.com",
  projectId: "inventory-management-a06af",
  storageBucket: "inventory-management-a06af.appspot.com", // <-- FIXED
  messagingSenderId: "72597384781",
  appId: "1:72597384781:web:a61612fb937de8d1547604",
  measurementId: "G-JCGQ87NME7" // optional
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Google provider + helper
const provider = new GoogleAuthProvider();
// Optionally configure scopes if needed:
// provider.addScope("email");
// provider.addScope("profile");

export async function signInWithGooglePopup() {
  return await signInWithPopup(auth, provider);
}
