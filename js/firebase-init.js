// public/js/firebase-init.js

import { firebaseConfig } from './firebase-config.js';

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);

// Inicializa y exporta los servicios que usaremos
const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();

export { auth, db, googleProvider };
