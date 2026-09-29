// Service worker do artesaná. — bump CACHE a cada deploy.
const CACHE = 'artesana-v1.3.0';
const FONTES = 'artesana-fonts';

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/variables.css', './css/global.css', './css/components.css', './css/modules.css', './css/print.css',
  './js/app.js', './js/router.js', './js/store.js', './js/ui.js', './js/onboarding.js', './js/site.js',
  './js/lib/progresso.js', './js/lib/whatsapp.js', './js/lib/inci.js', './js/lib/rotulo.js', './js/lib/perfil.js', './js/lib/feedback.js', './js/lib/rotulo-anvisa.js',
  './js/data/ingredientes.js', './js/data/datas.js', './js/data/roadmap.js', './js/data/tutoriais.js',
  './js/modules/login.js', './js/modules/home.js', './js/modules/social.js', './js/modules/rotulos.js', './js/modules/rotulo-completo.js',
  './js/modules/fotos.js', './js/modules/mais.js', './js/modules/identidade.js', './js/modules/feedback.js',
  './js/modules/inpi.js', './js/modules/perfil.js', './js/modules/planos.js', './js/modules/config.js',
  './js/modules/whatsapp.js', './js/modules/meta.js', './js/modules/tutorial.js', './js/modules/detalhe.js',
  './vendor/qrcode.min.js',
  '../assets/brand/icon-192.png', '../assets/brand/icon-512.png', '../assets/brand/icon-maskable-512.png',
  '../assets/brand/apple-touch-icon.png', '../assets/brand/wordmark.svg', '../assets/brand/wordmark-cream.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // um arquivo faltando não pode derrubar a instalação inteira
      Promise.allSettled(PRECACHE.map((url) => cache.add(url).catch((e) => console.warn('precache falhou', url, e)))),
    ).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE && k !== FONTES).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Google Fonts: stale-while-revalidate
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONTES).then(async (cache) => {
        const hit = await cache.match(req);
        const rede = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => hit);
        return hit || rede;
      }),
    );
    return;
  }

  if (url.origin !== location.origin) return;

  // navegação (index.html): network-first, cai pro cache offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((res) => {
        const copia = res.clone();
        caches.open(CACHE).then((c) => c.put('./index.html', copia));
        return res;
      }).catch(() => caches.match('./index.html')),
    );
    return;
  }

  // resto: cache-first
  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok && (url.pathname.includes('/app/') || url.pathname.includes('/assets/'))) {
        const copia = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copia));
      }
      return res;
    })),
  );
});
