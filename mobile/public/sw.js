const CACHE='aster-v8';
self.addEventListener('install',()=>{self.skipWaiting();});
self.addEventListener('activate',(e)=>{
  e.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',(e)=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.origin!==location.origin)return;
  if(e.request.mode==='navigate'){
    e.respondWith((async()=>{
      try{
        const res=await fetch(e.request);
        if(res.ok){const c=await caches.open(CACHE);c.put(e.request,res.clone());}
        return res;
      }catch(err){
        const hit=await caches.match(e.request);
        if(hit)return hit;
        const idx=await caches.match('/');
        if(idx)return idx;
        throw err;
      }
    })());
    return;
  }
  e.respondWith((async()=>{
    const c=await caches.open(CACHE);
    const hit=await caches.match(e.request);
    const net=async()=>{
      const res=await fetch(e.request);
      if(res&&res.ok&&res.type==='basic')c.put(e.request,res.clone());
      return res;
    };
    if(hit){net().catch(()=>{});return hit;}
    return net();
  })());
});