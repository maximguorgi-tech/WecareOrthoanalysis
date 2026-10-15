// Dental Scan Viewer: offline support. The app page is fetched fresh when online (so updates arrive at once)
// and served from the cache when offline; libraries, fonts and icons are served from the cache first.
const VERSION='dsv-2026-10-15a';
const SHELL=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/STLLoader.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/PLYLoader.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/OBJLoader.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/utils/BufferGeometryUtils.js'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(VERSION).then(c=>Promise.all(SHELL.map(u=>c.add(new Request(u,{mode:u.startsWith('http')?'no-cors':'same-origin'})).catch(()=>{}))))
    .then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(req.mode==='navigate'||(url.origin===location.origin&&/\/(index\.html)?$/.test(url.pathname))){
    e.respondWith(fetch(req).then(r=>{ const copy=r.clone(); caches.open(VERSION).then(c=>c.put('./index.html',copy)); return r; })
      .catch(()=>caches.match('./index.html')));
    return;
  }
  const cacheable=url.origin===location.origin||/(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(url.hostname);
  if(!cacheable) return;
  e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{ if(r&&(r.ok||r.type==='opaque')){ const copy=r.clone(); caches.open(VERSION).then(c=>c.put(req,copy)); } return r; })));
});
