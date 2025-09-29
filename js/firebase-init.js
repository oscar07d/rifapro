// js/firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";

// ⚠️ Ojo: storageBucket debe terminar en .appspot.com, no .app
const firebaseConfig = {
  apiKey: "AIzaSyCWsjPbPZ2F9kU5fv-A9KCjKMFstjZgJKc",
  authDomain: "rifapro-6d8e9.firebaseapp.com",
  projectId: "rifapro-6d8e9",
  storageBucket: "rifapro-6d8e9.appspot.com",
  messagingSenderId: "551676822561",
  appId: "1:551676822561:web:d3c8baa2c3ac1fddf80f60",
  measurementId: "G-Q5T3K9ZRNF"
};

// Inicializa Firebase y expórtala
const app = initializeApp(firebaseConfig);
export { app };
