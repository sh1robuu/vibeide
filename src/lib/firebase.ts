import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCGSXHt5T9AAF-wCj9o0zCCIUEgJolpTEw",
  authDomain: "vibeide-c1ea4.firebaseapp.com",
  projectId: "vibeide-c1ea4",
  storageBucket: "vibeide-c1ea4.firebasestorage.app",
  messagingSenderId: "810780250163",
  appId: "1:810780250163:web:0094ef3e744efd600a9346",
  measurementId: "G-8T8B51VL9V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics and get a reference to the service
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Initialize Firebase Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, analytics, db, auth, googleProvider };
