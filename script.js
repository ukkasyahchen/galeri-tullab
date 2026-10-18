document.addEventListener('DOMContentLoaded', () => {
  const DATA = window.CALLIGRAPHY || [];

  const $ = id => document.getElementById(id);
  const gallery = $('gallery');
  const q = $('q'), qx = $('qx'), sorts = $('sorts');
  const empty = $('empty'), emptyQ = $('empty-q'), emptyReset = $('empty-reset');

  const lb = $('lb'), lbBd = $('lb-bd'), lbImg = $('lb-img'), lbNo = $('lb-no'),
        lbName = $('lb-name'), lbX = $('lb-x'), lbP = $('lb-p'), lbN = $('lb-n'),
        lbDl = $('lb-dl'), lbMeta = $('lb-meta');

  let sort = 'n';
  let query = '';
  let idx = 0;

  /* ── helpers ─────────────────────────────────────────── */
  const pad = n => String(n).padStart(2, '0');

  function matches(item, qq){
    if(!qq) return true;
    const s = qq.trim().toLowerCase();
    if(!s) return true;
    // number search
    const num = String(item.n);
    if(/[0-9]/.test(s) && num.includes(s.replace(/[^0-9]/g,''))) return true;
    if(pad(item.n).includes(s)) return true;
    if(item.name.toLowerCase().includes(s)) return true;
    // match against original filename (contains latin? mostly arabic) — also try raw
    if((item.orig||'').toLowerCase().includes(s)) return true;
    return false;
  }

  function current(){
    let list = DATA.filter(d => matches(d, query));
    if(sort === 'name') list = list.slice().sort((a,b)=>a.name.localeCompare(b.name,'ar'));
    else if(sort === 'w') list = list.slice().sort((a,b)=>b.w-a.w);
    else list = list.slice().sort((a,b)=>a.n-b.n);
    return list;
  }

  /* ── gallery render ──────────────────────────────────── */
  const tileOf = new Map();
  const io = new IntersectionObserver(es=>{
    es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  },{rootMargin:'0px 0px -40px 0px',threshold:.05});

  function build(){
    gallery.innerHTML='';
    tileOf.clear();
    DATA.forEach((d,i)=>{
      const t = document.createElement('article');
      t.className='tile';
      t.tabIndex=0;
      t.setAttribute('role','button');
      t.setAttribute('aria-label','Pratinjau '+d.name);
      t.style.setProperty('--d', Math.min(i,9)*40+'ms');
      t.innerHTML=`
        <div class="tile__mat">
          <img class="tile__img" src="${d.src}" alt="Kaligrafi ${d.name}" loading="lazy" decoding="async">
          <span class="tile__no">#${pad(d.n)}</span>
          <button class="tile__dl" type="button" aria-label="Unduh ${d.name}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
        </div>`;
      t.querySelector('.tile__dl').addEventListener('click',e=>{e.stopPropagation();download(d);});
      const open=()=>{ const l=current(); const i2=l.indexOf(d); if(i2>-1) openLb(i2); };
      t.addEventListener('click',open);
      t.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){e.preventDefault();open();} });
      gallery.appendChild(t);
      tileOf.set(d,t);
      io.observe(t);
    });
  }

  function apply(){
    const list = current();
    const set = new Set(list);
    // reorder DOM to match sorted list, hide non-matching
    list.forEach(d=>{ const t=tileOf.get(d); if(t) gallery.appendChild(t); });
    DATA.forEach(d=>{
      const t=tileOf.get(d);
      if(t) t.classList.toggle('is-hidden', !set.has(d));
    });
    const qq=query.trim();
    const isEmpty=list.length===0;
    empty.hidden=!isEmpty;
    gallery.style.display=isEmpty?'none':'';
    if(isEmpty) emptyQ.textContent=qq?`“${qq}”`:'';
    qx.hidden=!query;
    const meta=$('stat-count');
    if(meta) meta.textContent=qq?`${list.length} dari ${DATA.length} nama`:`${DATA.length} nama · PNG transparan`;
  }

  function rerender(){ build(); apply(); }

  /* ── search / sort ───────────────────────────────────── */
  q.addEventListener('input',()=>{ query=q.value; apply(); });
  q.addEventListener('keydown',e=>{ if(e.key==='Escape'){ q.value=''; query=''; apply(); q.blur(); } });
  qx.addEventListener('click',()=>{ q.value=''; query=''; apply(); q.focus(); });
  emptyReset.addEventListener('click',()=>{ q.value=''; query=''; sort='n'; setSortBtns(); rerender(); });

  function setSortBtns(){
    sorts.querySelectorAll('.sorts__b').forEach(b=>{
      const on=b.dataset.sort===sort;
      b.classList.toggle('active',on);
      b.setAttribute('aria-selected',on?'true':'false');
    });
  }
  sorts.addEventListener('click',e=>{
    const b=e.target.closest('.sorts__b'); if(!b) return;
    sort=b.dataset.sort; setSortBtns(); apply();
  });

  /* ── download (original, uncompressed) ───────────────── */
  function download(d){
    const a=document.createElement('a');
    a.href=d.src;
    a.download=d.orig||(`${pad(d.n)}.png`);
    document.body.appendChild(a); a.click(); a.remove();
  }

  /* ── lightbox ────────────────────────────────────────── */
  function list(){ return current(); }
  function openLb(i){ idx=i; update(); lb.classList.add('active'); document.body.style.overflow='hidden'; lbX.focus(); }
  function closeLb(){ lb.classList.remove('active'); document.body.style.overflow=''; }
  function update(){
    const l=list(); const d=l[idx];
    if(!d) return closeLb();
    lbImg.src=d.src; lbImg.alt='Kaligrafi '+d.name;
    lbNo.textContent='#'+pad(d.n);
    lbName.textContent=d.name;
    lbMeta.textContent=`PNG · ${d.w} × ${d.h} px · latar transparan`;
    lbDl.onclick=()=>download(d);
  }
  function next(){ const l=list(); if(!l.length)return; idx=(idx+1)%l.length; update(); }
  function prev(){ const l=list(); if(!l.length)return; idx=(idx-1+l.length)%l.length; update(); }
  lbX.addEventListener('click',closeLb);
  lbBd.addEventListener('click',closeLb);
  lbN.addEventListener('click',next);
  lbP.addEventListener('click',prev);
  document.addEventListener('keydown',e=>{
    if(!lb.classList.contains('active'))return;
    if(e.key==='Escape')closeLb();
    if(e.key==='ArrowRight')next();
    if(e.key==='ArrowLeft')prev();
  });

  /* ── stats ───────────────────────────────────────────── */
  $('stat-count').textContent=DATA.length;

  /* ── init ────────────────────────────────────────────── */
  setSortBtns();
  rerender();
});
