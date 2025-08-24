// js/auth.js

// Referencia a los servicios de Firebase
import { auth, db, googleProvider } from './firebase-init.js';

/**
 * Registra un nuevo usuario con correo y contraseña.
 * @param {string} email - Correo del usuario.
 * @param {string} password - Contraseña del usuario.
 */
export async function registerUser(email, password) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Creamos un documento para el usuario en la colección 'users'
        await db.collection('users').doc(user.uid).set({
            email: user.email,
            name: user.email.split('@')[0], // Nombre por defecto
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('Usuario registrado y datos guardados:', user.uid);
    } catch (error) {
        console.error("Error al registrar usuario:", error);
        alert(error.message);
    }
}

/**
 * Inicia sesión con correo y contraseña.
 * @param {string} email - Correo del usuario.
 * @param {string} password - Contraseña del usuario.
 */
export function loginUser(email, password) {
    return auth.signInWithEmailAndPassword(email, password);
}

/**
 * Inicia sesión con una ventana emergente de Google.
 */
export async function loginWithGoogle() {
    try {
        const result = await auth.signInWithPopup(googleProvider);
        const user = result.user;
        const userRef = db.collection('users').doc(user.uid);
        const doc = await userRef.get();

        // Si el usuario de Google no existe en nuestra BD, lo creamos
        if (!doc.exists) {
            await userRef.set({
                email: user.email,
                name: user.displayName,
                photoURL: user.photoURL,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        console.log('Inicio de sesión con Google exitoso.');
    } catch (error) {
        console.error("Error al iniciar sesión con Google:", error);
        alert(error.message);
    }
}

/**
 * Cierra la sesión del usuario actual.
 */
export function logout() {
    return auth.signOut();
}

/**
 * Observador que se ejecuta cuando cambia el estado de autenticación.
 * @param {function} callback - Función a ejecutar con el usuario (o null si no está logueado).
 */
export function onAuthStateChanged(callback) {
    return auth.onAuthStateChanged(callback);
}
