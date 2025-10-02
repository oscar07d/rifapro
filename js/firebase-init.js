// js/firebase-init.js
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { firebaseConfig } from "./firebase-config.js";

// Evitar inicializar más de una vez
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log("Firebase inicializado:", firebaseConfig.apiKey ? { apiKey: firebaseConfig.apiKey, projectId: firebaseConfig.projectId } : "sin apiKey");
} else {
  // si por alguna razón ya existe una app, la reutilizamos
  app = getApps()[0];
  console.log("Reutilizando app existente");
}

export { app };
