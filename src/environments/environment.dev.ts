import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBtz81hA0nOltjydF-Lclk0IUyB-imoPy4",
    authDomain: "supachat-575b6.firebaseapp.com",
    projectId: "supachat-575b6",
    storageBucket: "supachat-575b6.appspot.com",
    messagingSenderId: "358212689162",
    appId: "1:358212689162:web:9ee47621c2ce18b2352ef3",
    measurementId: "G-2359K79FFH"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);