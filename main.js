(() => {
  const CFG = window.FROZN || {};
  const $ = (s) => document.querySelector(s);
  const body = document.body;

  /* ---------- intro: logo centred, cracks, shatters into glass shards, panel lifts ---------- */
  const loader = $('#loader');
  let revealed = false;
  const startReveal = () => {
    if (revealed) return; revealed = true;
    loader.classList.add('is-done');
    body.classList.remove('is-loading');
    setTimeout(() => body.classList.add('is-ready'), 350);
    setTimeout(() => loader.remove(), 1600);
  };
  setTimeout(startReveal, 9000); // never trap the visitor behind the loader

  const fontsReady = (document.fonts && document.fonts.ready) || Promise.resolve();
  const logo = new Image();
  logo.src = '/assets/logo-white.png';
  Promise.all([logo.decode ? logo.decode().catch(() => {}) : Promise.resolve(), fontsReady]).then(() => {
    const cv = $('#loaderCanvas');
    if (!cv || !logo.naturalWidth) { setTimeout(startReveal, 1200); return; }
    shatterIntro(cv);
  });

  function shatterIntro(cv) {
    const ctx = cv.getContext('2d');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const VW = innerWidth, VH = innerHeight;
    cv.width = VW * dpr; cv.height = VH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    loader.classList.add('has-canvas');

    const LW = Math.min(403, VW * 0.78), LH = LW * logo.naturalHeight / logo.naturalWidth;
    const lx = (VW - LW) / 2, ly = (VH - LH) / 2;
    let seed = 11;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

    // triangulate the logo into glass shards
    const cols = 9, rows = 4, pts = [];
    for (let r = 0; r <= rows; r++) { pts[r] = []; for (let c = 0; c <= cols; c++) pts[r][c] = {
      x: c / cols * LW + (c && c < cols ? (rnd() - .5) * LW / cols * .8 : 0),
      y: r / rows * LH + (r && r < rows ? (rnd() - .5) * LH / rows * .8 : 0) }; }
    const ix = LW * 0.5, iy = LH * 0.38; // impact = the diamond mark
    const shards = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const a = pts[r][c], b = pts[r][c + 1], d = pts[r + 1][c], e = pts[r + 1][c + 1];
      ((r + c) % 2 ? [[a, b, d], [b, e, d]] : [[a, b, e], [a, e, d]]).forEach((t) => {
        const cx = (t[0].x + t[1].x + t[2].x) / 3, cy = (t[0].y + t[1].y + t[2].y) / 3;
        const dx = cx - ix, dy = cy - iy, dist = Math.hypot(dx, dy) || 1;
        const k = 1 + (1 - Math.min(1, dist / LW)) * 1.4;
        shards.push({ t, cx, cy, vx: dx / dist * (160 + rnd() * 260) * k + (rnd() - .5) * 80, vy: dy / dist * (120 + rnd() * 220) * k - 60 * rnd(), g: 500 + rnd() * 700,
          rot: (rnd() - .5) * 9, flip: (rnd() - .5) * 9, pop: 1 + rnd() * 1.4, delay: Math.min(.18, dist / LW * .2) });
      });
    }

    const BREAK = 1100, SLOW = 3500, FLY_T = 1.1; // explosion plays in slow motion over SLOW ms
    let t0 = null, lifted = false;
    const drawShard = (s, T) => {
      const tt = Math.max(0, T - s.delay);
      ctx.save();
      ctx.translate(lx + s.cx + s.vx * tt, ly + s.cy + s.vy * tt + s.g * tt * tt);
      ctx.rotate(s.rot * tt);
      ctx.scale(Math.cos(s.flip * tt) * (1 + (s.pop - 1) * tt), 1 + (s.pop - 1) * tt);
      ctx.beginPath();
      s.t.forEach((p, i) => (i ? ctx.lineTo(p.x - s.cx, p.y - s.cy) : ctx.moveTo(p.x - s.cx, p.y - s.cy)));
      ctx.closePath(); ctx.clip();
      ctx.drawImage(logo, -s.cx, -s.cy, LW, LH);
      ctx.restore();
    };
    const frame = (now) => {
      if (t0 === null) t0 = now;
      const t = now - t0;
      ctx.clearRect(0, 0, VW, VH);
      if (t < BREAK) {
        // intact logo, breathing; shards start to shiver just before the break
        const pulse = 1 + Math.sin(t / 180) * 0.012;
        ctx.save(); ctx.translate(VW / 2, VH / 2); ctx.scale(pulse, pulse); ctx.translate(-VW / 2, -VH / 2);
        if (t < BREAK - 380) ctx.drawImage(logo, lx, ly, LW, LH);
        else {
          const sh = (t - (BREAK - 380)) / 380;
          shards.forEach((s) => { ctx.save(); ctx.translate((rnd() - .5) * 3.2 * sh, (rnd() - .5) * 3.2 * sh); ctx.beginPath();
            s.t.forEach((p, i) => (i ? ctx.lineTo(lx + p.x, ly + p.y) : ctx.moveTo(lx + p.x, ly + p.y))); ctx.closePath(); ctx.clip();
            ctx.drawImage(logo, lx, ly, LW, LH); ctx.restore(); });
          // hairline cracks
          ctx.strokeStyle = `rgba(3,28,44,${0.55 * sh})`; ctx.lineWidth = 1;
          shards.forEach((s) => { ctx.beginPath(); s.t.forEach((p, i) => (i ? ctx.lineTo(lx + p.x, ly + p.y) : ctx.moveTo(lx + p.x, ly + p.y))); ctx.closePath(); ctx.stroke(); });
        }
        ctx.restore();
      } else {
        const u = Math.min(1, (t - BREAK) / SLOW), T = FLY_T * (1 - Math.pow(1 - u, 1.6));
        // motion blur: several trailing time samples of every shard
        const K = 6;
        for (let k = K - 1; k >= 0; k--) {
          ctx.globalAlpha = (k === 0 ? 1 : 0.22 * (1 - k / K)) * Math.max(0, 1 - Math.pow(Math.min(1, T / FLY_T), 2.4));
          shards.forEach((s) => drawShard(s, Math.max(0, T - k * 0.01)));
        }
        ctx.globalAlpha = 1;
      }
      if (!lifted && t > BREAK + 2500) { lifted = true; startReveal(); }
      if (t < BREAK + SLOW + 400) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  /* ---------- menu ---------- */
  const menu = $('#menu'), btn = $('#menuBtn');
  const setMenu = (open) => {
    menu.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.querySelector('span').textContent = open ? 'Close' : 'Menu';
    body.style.overflow = open ? 'hidden' : '';
  };
  btn.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- content ---------- */
  $('#yr').textContent = new Date().getFullYear();

  const grid = $('#igGrid');
  (CFG.instagram || []).forEach((p) => {
    const card = document.createElement('div');
    card.className = 'ig';
    const f = document.createElement('iframe');
    f.loading = 'lazy';
    f.title = 'Instagram post from @froznmedia';
    f.src = `https://www.instagram.com/${p.type}/${p.code}/embed/`;
    f.allowFullscreen = true;
    f.addEventListener('load', () => card.classList.add('loaded'));
    card.append(f);
    grid.append(card);
  });

  const trusted = CFG.trusted || [];
  $('#marquee').innerHTML = [...trusted, ...trusted].map((t) => `<span>${t}</span>`).join('');

  $('#svcList').innerHTML = (CFG.services || []).map((s) =>
    `<li class="svc reveal"><b>${s.n}</b><h3>${s.t}</h3><p>${s.d}</p></li>`).join('');

  const films = CFG.youtube || [];
  if (films.length) {
    $('#films').hidden = false;
    $('#filmsGrid').innerHTML = films.map((v) =>
      `<div class="yt reveal" style="background-image:url(https://i.ytimg.com/vi/${v.id}/hqdefault.jpg)" data-id="${v.id}"><button aria-label="Play ${v.title || 'film'}"></button><span>${v.title || ''}</span></div>`).join('');
    $('#filmsGrid').addEventListener('click', (e) => {
      const box = e.target.closest('.yt');
      if (!box || box.classList.contains('is-playing')) return;
      box.classList.add('is-playing');
      box.insertAdjacentHTML('beforeend', `<iframe src="https://www.youtube-nocookie.com/embed/${box.dataset.id}?autoplay=1&rel=0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`);
    });
  }

  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  // nav switches to dark-on-light over the pale sections
  const nav = $('.nav'), lights = [...document.querySelectorAll('.projects, .services')];
  const tick = () => nav.classList.toggle('on-light', lights.some((el) => { const r = el.getBoundingClientRect(); return r.top < 40 && r.bottom > 40; }));
  addEventListener('scroll', tick, { passive: true }); tick();

  // floating reel card lives over the hero, then steps aside
  const card = $('#reelCard');
  new IntersectionObserver(([e]) => card.classList.toggle('is-hidden', !e.isIntersecting), { threshold: 0.15 }).observe($('#top'));
})();
