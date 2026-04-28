// Service Worker mínimo para cumplir requisitos de PWA
self.addEventListener('install', (event) => {
  console.log('Service Worker instalado');
});

self.addEventListener('fetch', (event) => {
  // No hacemos nada especial con el cache por ahora, 
  // dejamos que las peticiones sigan su curso normal al servidor.
});
