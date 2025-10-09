// js/firebase-init.js
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";
import { firebaseConfig } from "./firebase-config.js";

// 🔹 Evitar inicializar más de una vez
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log("✅ Firebase inicializado correctamente:", {
    apiKey: firebaseConfig.apiKey,
    projectId: firebaseConfig.projectId
  });
} else {
  app = getApps()[0];
  console.log("♻️ Reutilizando app Firebase existente");
}

// 🔹 Inicializamos y exportamos Storage
const storage = getStorage(app);

export { app, storage };
