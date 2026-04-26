import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAsJwjzpwYqUl4n0qgHhGWGLX0cM7bspEo",
  authDomain: "hackathon-99694.firebaseapp.com",
  projectId: "hackathon-99694",
  storageBucket: "hackathon-99694.firebasestorage.app",
  messagingSenderId: "84485046235",
  appId: "1:84485046235:web:fa87978c99294bc22db1fe",
  measurementId: "G-07CMXF0WES"
};

export const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const auth = getAuth(app);
export const db = getFirestore(app);
