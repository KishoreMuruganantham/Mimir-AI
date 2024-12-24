import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';


const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  databaseURL:"https://example-fastapi-f5a95-default-rtdb.firebaseio.com/",
  storageBucket: "example-fastapi-f5a95.appspot.com",
  messagingSenderId: "1024331035169",
  appId: "1:1024331035169:web:42773da2833da4e5a92960"
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app); 
