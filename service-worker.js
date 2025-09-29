const CACHE_NAME = "rifapro-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",

  // CSS
  "/css/style.css",

  // JS
  "/js/auth.js",
  "/js/components.js",
  "/js/firebase-config.js",
  "/js/firebase-init.js",
  "/js/main.js",

  // LOGOS principales
  "/assets/default-avatar.png",
  "/assets/logo_oscar07d.svg",
  "/assets/logo_rifapro_b.svg",
  "/assets/logo_rifapro_bn.svg",

  // ICONOS PWA
  "/assets/icons/icon-48px.png",
  "/assets/icons/icon-72px.png",
  "/assets/icons/icon-96px.png",
  "/assets/icons/icon-144px.png",
  "/assets/icons/icon-192px.png",
  "/assets/icons/icon-256px.png",
  "/assets/icons/icon-384px.png",
  "/assets/icons/icon-512px.png",

  // BANCOS PNG
  "/assets/banks/png-banks/av-villas.png",
  "/assets/banks/png-banks/bancolombia.png",
  "/assets/banks/png-banks/bbva.png",
  "/assets/banks/png-banks/bogota.png",
  "/assets/banks/png-banks/bre-b.png",
  "/assets/banks/png-banks/caja-social.png",
  "/assets/banks/png-banks/daviplata.png",
  "/assets/banks/png-banks/dvivienda.png",
  "/assets/banks/png-banks/efectivo.png",
  "/assets/banks/png-banks/falabella.png",
  "/assets/banks/png-banks/finandina.png",
  "/assets/banks/png-banks/itau.png",
  "/assets/banks/png-banks/lulo.png",
  "/assets/banks/png-banks/movii.png",
  "/assets/banks/png-banks/nequi.png",
  "/assets/banks/png-banks/nu.png",
  "/assets/banks/png-banks/pibank_2.png",
  "/assets/banks/png-banks/powwi.png",
  "/assets/banks/png-banks/uala.png",

  // BANCOS SVG
  "/assets/banks/av-villas.svg",
  "/assets/banks/bancolombia.svg",
  "/assets/banks/bbva.svg",
  "/assets/banks/bogota.svg",
  "/assets/banks/bre-b.svg",
  "/assets/banks/caja-social.svg",
  "/assets/banks/daviplata.svg",
  "/assets/banks/davivienda.svg",
  "/assets/banks/efectivo.svg",
  "/assets/banks/falabella.svg",
  "/assets/banks/finandina.svg",
  "/assets/banks/itau.svg",
  "/assets/banks/lulo.svg",
  "/assets/banks/movii.svg",
  "/assets/banks/nequi.svg",
  "/assets/banks/nu.svg",
  "/assets/banks/pibank.svg",
  "/assets/banks/powwi.svg",
  "/assets/banks/uala.svg"
];

// Instalar Service Worker y guardar en caché
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Activar Service Worker y limpiar cachés viejas
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
});

// Interceptar peticiones y responder desde caché
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
// JavaScript Document