// /lab/lab.js
(function(){
  const grid = document.getElementById('grid');
  const emptyEl = document.getElementById('empty');
  const searchEl = document.getElementById('search');
  const sortEl = document.getElementById('sort');
  const tagWrap = document.getElementById('tag-chips');
  const yearEl = document.getElementById('year');

  const STORAGE_KEY = 'lab_filters_v1';
  let all = [];
  let activeTags = new Set();
  let q = '';
  let sort = 'updated-desc';

  init();

  async function init(){
    yearEl.textContent = String(new Date().getFullYear());
    restoreFilters();

    all = await loadProjects();

    buildTagChips(collectTags(all));
    render();

    // events
    searchEl.value = q;
    searchEl.addEventListener('input', (e)=>{ q = e.target.value.trim().toLowerCase(); persist(); render(); });
    sortEl.value = sort;
    sortEl.addEventListener('change',(e)=>{ sort = e.target.value; persist(); render(); });
    
    // Cursor trail effect
    initCursorTrail();
  }
  
  function initCursorTrail(){
    const trail = document.querySelector('.cursor-trail');
    if (!trail) return;
    
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    
    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;
    let isMoving = false;
    
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      isMoving = true;
    });
    
    function updateTrail() {
      if (isMoving) {
        // Smooth lerp for trail effect
        currentX += (mouseX - currentX) * 0.15;
        currentY += (mouseY - currentY) * 0.15;
        
        trail.style.left = currentX + 'px';
        trail.style.top = currentY + 'px';
        
        // Stop updating if position is close enough
        if (Math.abs(mouseX - currentX) < 0.5 && Math.abs(mouseY - currentY) < 0.5) {
          isMoving = false;
        }
      }
      
      requestAnimationFrame(updateTrail);
    }
    
    updateTrail();
  }

  function restoreFilters(){
    try{
      const s = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (s){ q = s.q || ''; sort = s.sort || 'updated-desc'; activeTags = new Set(s.tags || []); }
    }catch{}
  }
  function persist(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify({ q, sort, tags: Array.from(activeTags) })); }catch{}
  }

  async function loadProjects(){
    try{
      const res = await fetch('projects.json', {cache:'no-store'});
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }catch{
      // Fallback seed so the page still works if JSON is missing.
      return [{
        slug:'tictactoe',
        name:'Tic Tac Toe',
        description:'Neon-themed, AI opponent, keyboard-friendly.',
        tags:['game','ai','web'],
        updated:'2025-09-22',
        path:'tictactoe/'
      }];
    }
  }

  function collectTags(items){
    const set = new Set();
    items.forEach(p => (p.tags||[]).forEach(t => set.add(t)));
    return Array.from(set).sort((a,b)=>a.localeCompare(b));
  }

  function buildTagChips(tags){
    tagWrap.innerHTML = '';
    if (tags.length === 0) return;
    // "All" chip
    const allChip = makeChip('all', 'All');
    allChip.classList.toggle('active', activeTags.size === 0);
    allChip.addEventListener('click', () => { activeTags.clear(); activateOnly(allChip); persist(); render(); });
    tagWrap.appendChild(allChip);

    tags.forEach(tag=>{
      const chip = makeChip(tag, tag);
      chip.classList.toggle('active', activeTags.has(tag));
      chip.addEventListener('click', ()=>{
        // toggle this tag; if empty => show All
        if (activeTags.has(tag)) activeTags.delete(tag); else activeTags.add(tag);
        activateState();
        persist(); render();
      });
      tagWrap.appendChild(chip);
    });

    function activateState(){
      [...tagWrap.children].forEach(el => el.classList.remove('active'));
      if (activeTags.size === 0) tagWrap.firstChild.classList.add('active');
      else {
        [...tagWrap.children].forEach(el => { if (activeTags.has(el.dataset.key)) el.classList.add('active'); });
      }
    }
    function activateOnly(el){ [...tagWrap.children].forEach(n => n.classList.remove('active')); el.classList.add('active'); }
  }

  function makeChip(key, text){
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.key = key;
    b.textContent = text;
    b.setAttribute('aria-pressed','false');
    return b;
  }

  function render(){
    const filtered = filter(all, q, activeTags);
    const sorted = sortItems(filtered, sort);

    grid.innerHTML = '';
    if (sorted.length === 0){
      emptyEl.hidden = false;
      return;
    }
    emptyEl.hidden = true;

    for (const p of sorted){
      grid.appendChild(card(p));
    }
  }

  function filter(items, q, tags){
    const hasQ = q.length > 0;
    return items.filter(p=>{
      if (tags.size && !(p.tags||[]).some(t => tags.has(t))) return false;
      if (!hasQ) return true;
      const hay = `${p.name} ${p.description} ${(p.tags||[]).join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }

  function sortItems(items, mode){
    const arr = [...items];
    if (mode === 'updated-desc') arr.sort((a,b)=>new Date(b.updated)-new Date(a.updated));
    else if (mode === 'updated-asc') arr.sort((a,b)=>new Date(a.updated)-new Date(b.updated));
    else if (mode === 'name-asc') arr.sort((a,b)=>a.name.localeCompare(b.name));
    else if (mode === 'name-desc') arr.sort((a,b)=>b.name.localeCompare(a.name));
    return arr;
  }

  function card(p){
    const a = document.createElement('article');
    a.className = 'card';
    a.setAttribute('role','listitem');

    const inner = document.createElement('div');
    inner.className = 'card-inner';

    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    const mono = document.createElement('div');
    mono.className = 'monogram';
    mono.textContent = monogram(p.name);
    thumb.appendChild(mono);

    const body = document.createElement('div');
    body.className = 'card-body';
    const h3 = document.createElement('h3'); h3.textContent = p.name;
    const desc = document.createElement('p'); desc.textContent = p.description || '';
    const meta = document.createElement('div'); meta.className = 'meta';
    const time = document.createElement('span');
    time.textContent = formatDate(p.updated);
    const tags = document.createElement('div'); tags.className = 'tags';
    (p.tags||[]).forEach(t=>{ const x=document.createElement('span'); x.className='tag'; x.textContent=t; tags.appendChild(x); });
    meta.append(tags,time);

    const actions = document.createElement('div');
    actions.className = 'actions';
    const open = document.createElement('a');
    open.href = safePath(p.path);
    open.className = 'btn';
    open.target = '_self';
    open.rel = 'noopener';
    open.textContent = 'Open';
    const src = document.createElement('a');
    src.href = safePath(p.path);
    src.className = 'btn secondary';
    src.textContent = 'New Tab';
    src.target = '_blank';
    src.rel = 'noopener';

    actions.append(open, src);
    body.append(h3, desc, meta, actions);

    inner.append(thumb, body);
    a.append(inner);
    return a;
  }

  function monogram(name){
    const parts = String(name||'').trim().split(/\s+/);
    const letters = (parts[0]?.[0]||'L') + (parts[1]?.[0]||'');
    return letters.toUpperCase();
  }
  function formatDate(s){
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return 'Unknown date';
    return `Updated ${d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})}`;
  }
  function safePath(p){
    // why: avoid accidental absolute paths; keep relative inside /lab/
    if (!p) return '#';
    return p.startsWith('http') ? p : (p.startsWith('/') ? p : `${p}`);
  }
})();
