import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCuf35rext1GcljeXOCp5OSuxiELhcJcJM",
  authDomain: "sk-roster.firebaseapp.com",
  projectId: "sk-roster",
  storageBucket: "sk-roster.firebasestorage.app",
  messagingSenderId: "963557284970",
  appId: "1:963557284970:web:7bf0a162b7b382c23d3e13"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
