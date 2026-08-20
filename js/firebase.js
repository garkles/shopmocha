import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";

import { getAuth } from
    "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

import { getFirestore } from
    "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyAXqJpKWroKGxS-KZTCeNVK2fTEqJ0dg2M",
  authDomain: "shoplist-f3831.firebaseapp.com",
  projectId: "shoplist-f3831",
  storageBucket: "shoplist-f3831.firebasestorage.app",
  messagingSenderId: "225339261264",
  appId: "1:225339261264:web:c68c2b6a857fc158316c55",
  measurementId: "G-GK4H68PGDX"
};


const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


export {
    auth,
    db
};