import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your Firebase config (copy from Firebase console)
const firebaseConfig = {
  apiKey: "AIzaSy.....",
  authDomain: "billing-app-323f6.firebaseapp.com",
  projectId: "billing-app-323f6",
  storageBucket: "billing-app-323f6.appspot.com",
  messagingSenderId: "258936960912",
  appId: "1:258936960912:web:d4276e4eaba6eacab6e515"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);