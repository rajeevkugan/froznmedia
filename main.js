(() => {
  const CFG = window.FROZN || {};
  const $ = (s) => document.querySelector(s);
  const body = document.body;

  // always open on the first section (no browser scroll-restore, no stray #hash jump)
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  const toTop = () => scrollTo({ top: 0, left: 0, behavior: 'instant' });
  toTop();

  /* ---------- intro: logo centred, cracks, shatters into glass shards, panel lifts ---------- */
  const loader = $('#loader');
  let revealed = false;
  const startReveal = () => {
    if (revealed) return; revealed = true;
    toTop();
    loader.classList.add('is-clear');          // blue panel melts away; the page rises underneath
    body.classList.remove('is-loading');
    body.classList.add('is-ready');
    setTimeout(() => loader.remove(), 6000);
  };
  setTimeout(startReveal, 9000); // never trap the visitor behind the loader

  const fontsReady = (document.fonts && document.fonts.ready) || Promise.resolve();
  const logo = new Image();
  logo.src = '/assets/logo-white.png';
  Promise.all([logo.decode ? logo.decode().catch(() => {}) : Promise.resolve(), fontsReady]).then(() => {
    const cv = $('#loaderCanvas');
    if (!cv || !logo.naturalWidth) { setTimeout(startReveal, 800); return; }
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
          rot: (rnd() - .5) * 9, flip: (rnd() - .5) * 9, zv: 0.82 + Math.max(0, 1 - dist / LW) * 0.15 + rnd() * 0.03, delay: Math.min(.18, dist / LW * .2) });
      });
    }

    const BREAK = 1100, SLOW = 4200, FLY_T = 1.1; // explosion plays in slow motion over SLOW ms
    let t0 = null, lifted = false;
    const drawShard = (s, T, u) => {
      const tt = Math.max(0, T - s.delay);
      const scl = Math.min(16, 1 / (1 - s.zv * Math.pow(u, 1.3)));          // flies toward the viewer: grows until it hits the screen
      ctx.save();
      ctx.translate(VW / 2 + (lx + s.cx - VW / 2 + s.vx * tt) * scl, VH / 2 + (ly + s.cy - VH / 2 + s.vy * tt + s.g * tt * tt) * scl);
      ctx.rotate(s.rot * tt);
      ctx.scale(Math.cos(s.flip * tt) * scl, scl);
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
          ctx.globalAlpha = (k === 0 ? 1 : 0.22 * (1 - k / K)) * (1 - Math.pow(Math.max(0, (u - 0.82) / 0.18), 1.6));
          shards.forEach((s) => drawShard(s, Math.max(0, T - k * 0.01), Math.max(0, u - k * 0.004)));
        }
        ctx.globalAlpha = 1;
      }
      if (!lifted && t > BREAK + 350) { lifted = true; startReveal(); }
      if (t < BREAK + SLOW + 400) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }


  /* ---------- faint looping YouTube hero background (stops 5s before the end, then loops) ---------- */
  (function heroVideo() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const VIDEO_ID = 'QtgwJ-2qoLM', CUT_END = 5;
    const wrap = $('#heroVideo');
    window.onYouTubeIframeAPIReady = () => {
      let player, timer, ready = false, visible = true;
      player = new YT.Player('ytBg', {
        videoId: VIDEO_ID,
        playerVars: { autoplay: 1, mute: 1, controls: 0, disablekb: 1, fs: 0, modestbranding: 1, playsinline: 1, rel: 0, iv_load_policy: 3, cc_load_policy: 0, origin: location.origin },
        events: {
          onReady: (e) => { ready = true; e.target.mute(); e.target.playVideo(); },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) {
              wrap.classList.add('is-on');
              clearInterval(timer);
              timer = setInterval(() => {
                const d = player.getDuration();
                if (d > CUT_END + 1 && player.getCurrentTime() >= d - CUT_END) player.seekTo(0, true);
              }, 200);
            } else if (e.data === YT.PlayerState.ENDED) { player.seekTo(0, true); player.playVideo(); }
          },
        },
      });
      // save battery/data: pause while the hero is off-screen
      new IntersectionObserver(([en]) => {
        visible = en.isIntersecting;
        wrap.classList.toggle('is-off', !visible);
        if (!ready) return;
        visible ? player.playVideo() : player.pauseVideo();
      }, { threshold: 0.05 }).observe($('#top'));
    };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
  })();

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
  const reels = CFG.reels || [];
  if (reels.length) {
    // real reel files: muted, looping previews that play only while on screen
    grid.classList.add('reels');
    reels.forEach((r) => {
      const a = document.createElement(r.link ? 'a' : 'div');
      a.className = 'reel';
      if (r.link) { a.href = r.link; a.target = '_blank'; a.rel = 'noopener'; }
      const v = document.createElement('video');
      Object.assign(v, { src: r.src, muted: true, loop: true, playsInline: true, preload: 'metadata' });
      v.muted = true; v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
      if (r.poster) v.poster = r.poster;
      a.append(v);
      if (r.title) a.insertAdjacentHTML('beforeend', `<span class="reel__cap">${r.title}</span>`);
      grid.append(a);
    });
    const vio = new IntersectionObserver((es) => es.forEach((e) => {
      const v = e.target.querySelector('video');
      if (e.isIntersecting) v.play().catch(() => {}); else v.pause();
    }), { threshold: 0.4 });
    grid.querySelectorAll('.reel').forEach((el) => vio.observe(el));
  } else {
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
  }

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
