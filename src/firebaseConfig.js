import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBrYJjbxpy4CrbB93DAuROit-efKd1P7oc",
    authDomain: "cnsbadminton2026update.firebaseapp.com",
    projectId: "cnsbadminton2026update",
    storageBucket: "cnsbadminton2026update.firebasestorage.app",
    messagingSenderId: "499336471820",
    appId: "1:499336471820:web:b2853f2bf03c4135bd5529",
    measurementId: "G-LQD11CHPEL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;