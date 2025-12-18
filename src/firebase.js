// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyArMD2rPIMUjvxDo1lRBM_mBDQSUbe8rUg",
  authDomain: "gamezone-311a2.firebaseapp.com",
  projectId: "gamezone-311a2",
  storageBucket: "gamezone-311a2.firebasestorage.app",
  messagingSenderId: "296760842722",
  appId: "1:296760842722:web:9d615b56203891958181bb",
  measurementId: "G-TMLNGDDFLS",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const database = getDatabase(
  app,
  "https://gamezone-311a2-default-rtdb.asia-southeast1.firebasedatabase.app/"
);
export const googleProvider = new GoogleAuthProvider();

setPersistence(auth, browserLocalPersistence);

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
