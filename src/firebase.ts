// src/services/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Thay getAnalytics bằng getFirestore để lưu database

const firebaseConfig = {
  apiKey: "AIzaSyAL2ErIMoAoEX1N4g-Ln0BnhcGNU3N8pMU",
  authDomain: "wealthier-396f3.firebaseapp.com",
  projectId: "wealthier-396f3",
  storageBucket: "wealthier-396f3.firebasestorage.app",
  messagingSenderId: "488588788764",
  appId: "1:488588788764:web:f1f27354cd25a3c07bcbd9",
  measurementId: "G-E70YY1Q3KJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo Firestore Database để lưu dữ liệu tài chính
export const db = getFirestore(app);