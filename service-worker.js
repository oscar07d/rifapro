const CACHE_NAME = "rifapro-cache-v1";
const urlsToCache = [
  "/rifapro/",
  "/rifapro/index.html",

  // CSS
  "/rifapro/css/style.css",

  // JS
  "/rifapro/js/auth.js",
  "/rifapro/js/components.js",
  "/rifapro/js/firebase-config.js",
  "/rifapro/js/firebase-init.js",
  "/rifapro/js/main.js",

  // LOGOS principales
  "/rifapro/assets/default-avatar.png",
  "/rifapro/assets/logo_oscar07d.svg",
  "/rifapro/assets/logo_rifapro_b.svg",
  "/rifapro/assets/logo_rifapro_bn.svg",

  // ICONOS PWA
  "/rifapro/assets/icons/icon-48px.png",
  "/rifapro/assets/icons/icon-72px.png",
  "/rifapro/assets/icons/icon-96px.png",
  "/rifapro/assets/icons/icon-144px.png",
  "/rifapro/assets/icons/icon-192px.png",
  "/rifapro/assets/icons/icon-256px.png",
  "/rifapro/assets/icons/icon-384px.png",
  "/rifapro/assets/icons/icon-512px.png",

  // BANCOS PNG
  "/rifapro/assets/banks/png-banks/av-villas.png",
  "/rifapro/assets/banks/png-banks/bancolombia.png",
  "/rifapro/assets/banks/png-banks/bbva.png",
  "/rifapro/assets/banks/png-banks/bogota.png",
  "/rifapro/assets/banks/png-banks/bre-b.png",
  "/rifapro/assets/banks/png-banks/caja-social.png",
  "/rifapro/assets/banks/png-banks/daviplata.png",
  "/rifapro/assets/banks/png-banks/dvivienda.png",
  "/rifapro/assets/banks/png-banks/efectivo.png",
  "/rifapro/assets/banks/png-banks/falabella.png",
  "/rifapro/assets/banks/png-banks/finandina.png",
  "/rifapro/assets/banks/png-banks/itau.png",
  "/rifapro/assets/banks/png-banks/lulo.png",
  "/rifapro/assets/banks/png-banks/movii.png",
  "/rifapro/assets/banks/png-banks/nequi.png",
  "/rifapro/assets/banks/png-banks/nu.png",
  "/rifapro/assets/banks/png-banks/pibank_2.png",
  "/rifapro/assets/banks/png-banks/powwi.png",
  "/rifapro/assets/banks/png-banks/uala.png",

  // BANCOS SVG
  "/rifapro/assets/banks/av-villas.svg",
  "/rifapro/assets/banks/bancolombia.svg",
  "/rifapro/assets/banks/bbva.svg",
  "/rifapro/assets/banks/bogota.svg",
  "/rifapro/assets/banks/bre-b.svg",
  "/rifapro/assets/banks/caja-social.svg",
  "/rifapro/assets/banks/daviplata.svg",
  "/rifapro/assets/banks/davivienda.svg",
  "/rifapro/assets/banks/efectivo.svg",
  "/rifapro/assets/banks/falabella.svg",
  "/rifapro/assets/banks/finandina.svg",
  "/rifapro/assets/banks/itau.svg",
  "/rifapro/assets/banks/lulo.svg",
  "/rifapro/assets/banks/movii.svg",
  "/rifapro/assets/banks/nequi.svg",
  "/rifapro/assets/banks/nu.svg",
  "/rifapro/assets/banks/pibank.svg",
  "/rifapro/assets/banks/powwi.svg",
  "/rifapro/assets/banks/uala.svg"
];

// Detectar si estamos en modo PWA (instalado)
function isInStandaloneMode() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

// Instala el Service Worker y guarda los archivos en caché
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("Cache abierto, guardando archivos...");
            return cache.addAll(urlsToCache);
        })
    );
});

// Activa el Service Worker y limpia cachés viejos
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) =>
            Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log("Borrando caché antiguo:", cacheName);
                        return caches.delete(cacheName);
                    }
                })
            )
        )
    );
});

// Intercepta las peticiones y sirve desde la caché si es posible
self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Si encontramos el archivo en caché, lo devolvemos. Si no, lo buscamos en la red.
            return response || fetch(event.request);
        })
    );
});
