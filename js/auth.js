// js/auth.js

// Importa los métodos de Firebase Auth
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged as firebaseOnAuthStateChanged,
    sendPasswordResetEmail as firebaseSendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithRedirect,
    getRedirectResult
} from "firebase/auth";

import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { app } from './firebase-init.js';

// Inicializamos Auth y Firestore
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

/**
 * Registra un nuevo usuario con correo y contraseña.
 */
export async function registerUser(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            name: user.email.split('@')[0],
            createdAt: serverTimestamp()
        });

        console.log('✅ Usuario registrado:', user.uid);
    } catch (error) {
        console.error("❌ Error al registrar:", error);
        alert(error.message);
    }
}

/**
 * Inicia sesión con correo y contraseña.
 */
export function loginUser(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Inicia sesión con Google (redirección).
 */
export async function loginWithGoogle() {
    try {
        // Redirige al login de Google
        await signInWithRedirect(auth, googleProvider);
    } catch (error) {
        console.error("❌ Error al iniciar sesión con Google:", error);
        alert(error.message);
    }
}

/**
 * Maneja el resultado después de la redirección de Google.
 * Llama a esta función en tu main.js cuando cargue la app.
 */
export async function handleGoogleRedirect() {
    try {
        const result = await getRedirectResult(auth);
        if (result) {
            const user = result.user;
            const userRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(userRef);

            if (!docSnap.exists()) {
                await setDoc(userRef, {
                    email: user.email,
                    name: user.displayName,
                    photoURL: user.photoURL,
                    createdAt: serverTimestamp()
                });
            }

            console.log("✅ Login con Google exitoso:", user.displayName);
        }
    } catch (error) {
        if (error.code !== "auth/no-auth-event") {
            console.error("❌ Error procesando redirección:", error);
        }
    }
}

/**
 * Cierra la sesión.
 */
export function logout() {
    return signOut(auth);
}

/**
 * Observador del estado de autenticación.
 */
export function onAuthStateChanged(callback) {
    return firebaseOnAuthStateChanged(auth, callback);
}

/**
 * Restablecer contraseña.
 */
export function sendPasswordResetEmail(email) {
    return firebaseSendPasswordResetEmail(auth, email);
}
