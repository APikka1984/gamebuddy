// src/firebase.js
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyArMD2rPIMUjvxDo1lRBM_mBDQSUbe8rUg",
  authDomain: "gamezone-311a2.firebaseapp.com",
  projectId: "gamezone-311a2",
  storageBucket: "gamezone-311a2.firebasestorage.app",
  messagingSenderId: "296760842722",
  appId: "1:296760842722:web:9d615b56203891958181bb",
  measurementId: "G-TMLNGDDFLS"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("Auth persistence error:", err);
});

export const db = getFirestore(app);
export const storage = getStorage(app);

// Google Auth
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};
