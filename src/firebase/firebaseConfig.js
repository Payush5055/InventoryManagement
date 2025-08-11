// src/firebase/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getAnalytics } from "firebase/analytics"; // optional, browser-only

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

// Initialize services you actually use
export const auth = getAuth(app);
export const db = getFirestore(app);

// Optional: only enable analytics in the browser (not SSR/build time)
// let analytics;
// if (typeof window !== "undefined") {
//   analytics = getAnalytics(app);
// }
// export { analytics };
