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
  logo.src = '/assets/logo-blue.png';
  Promise.all([logo.decode ? logo.decode().catch(() => {}) : Promise.resolve(), fontsReady]).then(() => {
    const cv = $('#loaderCanvas');
    if (!cv || !logo.naturalWidth) { setTimeout(startReveal, 800); return; }
    dustIntro(cv);
  });

  // Intro: a bolt of light sweeps across and the logo assembles from glowing particles
  // (like the FROZN outro film), holds, then vanishes in pixie dust.
  function dustIntro(cv) {
    const ctx = cv.getContext('2d');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const VW = innerWidth, VH = innerHeight;
    cv.width = VW * dpr; cv.height = VH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    loader.classList.add('has-canvas');

    const LW = Math.min(403, VW * 0.78), LH = LW * logo.naturalHeight / logo.naturalWidth;
    const lx = (VW - LW) / 2, ly = (VH - LH) / 2, cyl = VH / 2;
    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

    // sample the logo's pixels -> particle targets
    const off = document.createElement('canvas');
    off.width = Math.ceil(LW); off.height = Math.ceil(LH);
    const octx = off.getContext('2d', { willReadFrequently: true });
    octx.drawImage(logo, 0, 0, LW, LH);
    const px = octx.getImageData(0, 0, off.width, off.height).data;
    const STEP = VW < 700 ? 3 : 2, SOFT = 60, WIPE = 1900, tD = 3000;
    const ps = [];
    for (let y = 0; y < off.height; y += STEP) for (let x = 0; x < off.width; x += STEP) {
      const i = (y * off.width + x) * 4;
      if (px[i + 3] < 110) continue;
      const nx = x / LW;
      ps.push({
        tx: lx + x, ty: ly + y, nx, ph: rnd() * 6.28, size: 0.7 + rnd() * 1.1,
        ox: -(60 + rnd() * 160), oy: (cyl - (ly + y)) * (0.8 + rnd() * 0.2) + (rnd() - .5) * 30,
        delay: (260 + nx * LW) / (LW + 300) * 1250 + rnd() * 140, dur: 650 + rnd() * 450,
        ts: tD + ((nx * LW + SOFT * 1.5) / (LW + 2 * SOFT)) * WIPE + rnd() * 160,
        vx: 30 + rnd() * 150, vy: 10 + rnd() * 120, life: 1.5 + rnd() * 1.8, tw: 3 + rnd() * 5,
        r: px[i], g: px[i + 1], b: px[i + 2],
      });
    }
    const sprite = (rgb) => { const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d');
      const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(.18, `rgba(${rgb},.85)`); gr.addColorStop(.45, `rgba(${rgb},.18)`); gr.addColorStop(1, `rgba(${rgb},0)`);
      g.fillStyle = gr; g.fillRect(0, 0, 32, 32); return c; };
    const cyan = sprite('90,200,255'), white = sprite('255,255,255');
    const sparkles = Array.from({ length: 36 }, () => ({ x: lx + rnd() * LW, y: ly + rnd() * LH, ph: rnd() * 6.28, f: 1.5 + rnd() * 3 }));

    const tmp = document.createElement('canvas'); tmp.width = off.width; tmp.height = off.height;
    const tctx = tmp.getContext('2d');

    let t0 = null, revealed2 = false;
    const frame = (now) => {
      if (t0 === null) t0 = now;
      const SPEED_IN = tD / 1200, SPEED_OUT = (WIPE + 3600) / 3000; // build-up takes 1.2s, the dust vanish takes 3s
      const tr = now - t0, TDR = tD / SPEED_IN;                    // real ms
      const t = tr < TDR ? tr * SPEED_IN : tD + (tr - TDR) * SPEED_OUT; // design ms
      ctx.clearRect(0, 0, VW, VH);

      // solid logo: fades in once the particles have landed, then erodes left-to-right into dust
      const inA = smooth((t - 1500) / 900);
      const front = -SOFT + ((t - tD) / WIPE) * (LW + 2 * SOFT);
      if (inA > 0 && front < LW + SOFT) {
        tctx.globalCompositeOperation = 'source-over';
        tctx.clearRect(0, 0, tmp.width, tmp.height);
        tctx.drawImage(logo, 0, 0, LW, LH);
        if (t > tD) {
          tctx.globalCompositeOperation = 'destination-out';
          const g = tctx.createLinearGradient(front - SOFT, 0, front, 0);
          g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
          tctx.fillStyle = g; tctx.fillRect(0, 0, tmp.width, tmp.height);
        }
        ctx.save();
        ctx.globalAlpha = inA;
        ctx.shadowColor = 'rgba(70,180,255,.9)'; ctx.shadowBlur = 14 * (1 - clamp((t - tD) / 800));
        ctx.drawImage(tmp, lx, ly, LW, LH);
        ctx.shadowBlur = 0; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = inA * 0.38; // lift the gradient so it glows like the film
        ctx.drawImage(tmp, lx, ly, LW, LH);
        ctx.restore();
      }

      ctx.globalCompositeOperation = 'lighter';

      // the sweeping bolt / lens flare
      const headX = lx - 260 + (t / 1250) * (LW + 300);
      const fi = t < 1250 ? Math.min(1, t / 150) : clamp(1 - (t - 1250) / 450);
      if (fi > 0) {
        ctx.globalAlpha = fi;
        const gx = ctx.createLinearGradient(headX - 520, 0, headX + 260, 0);
        gx.addColorStop(0, 'rgba(70,140,255,0)'); gx.addColorStop(.7, 'rgba(110,190,255,.55)'); gx.addColorStop(.92, 'rgba(255,255,255,.95)'); gx.addColorStop(1, 'rgba(110,190,255,0)');
        ctx.fillStyle = gx; ctx.fillRect(headX - 520, cyl - 0.75, 780, 1.5);
        ctx.drawImage(white, headX - 46, cyl - 46, 92, 92);
        ctx.globalAlpha = fi * 0.55; ctx.drawImage(cyan, headX - 130, cyl - 70, 260, 140); ctx.globalAlpha = fi;
      }

      // assembling particles
      for (const p of ps) {
        const a = clamp((t - p.delay) / p.dur);
        if (a <= 0 || t >= p.ts) continue;
        const e = 1 - Math.pow(1 - a, 3);
        const x = p.tx + p.ox * (1 - e) + Math.sin(a * 9 + p.ph) * 9 * (1 - a);
        const y = p.ty + p.oy * (1 - e) + Math.cos(a * 7 + p.ph) * 9 * (1 - a);
        const settle = 1 - inA;
        const tw = 0.7 + 0.3 * Math.sin(t / 90 * p.tw / 4 + p.ph);
        ctx.globalAlpha = Math.min(1, (0.16 + 0.34 * (1 - a)) * Math.max(settle, a < 1 ? 1 : 0)) * tw;
        const s = p.size * 1.7;
        ctx.drawImage(cyan, x - s, y - s, s * 2, s * 2);
        ctx.fillStyle = a < 0.6 ? '#ffffff' : '#9fe0ff'; ctx.fillRect(x - 0.6, y - 0.6, 1.2, 1.2);
        if (a < 0.4) { ctx.globalAlpha *= 0.7; const w = s * 0.5; ctx.drawImage(white, x - w, y - w, w * 2, w * 2); }
      }

      // ambient twinkles while the logo holds
      if (t > 1700 && t < tD + 400) {
        for (const s of sparkles) {
          const v = Math.max(0, Math.sin(t / 1000 * s.f + s.ph)); if (v < .6) continue;
          ctx.globalAlpha = (v - .6) * 2.2 * inA; ctx.drawImage(white, s.x - 5, s.y - 5, 10, 10);
        }
      }

      // pixie dust: particles lift off, drift up and right, twinkle and fade
      if (t >= tD) {
        for (const p of ps) {
          if (t < p.ts) continue;
          const u = (t - p.ts) / 1000;
          if (u > p.life) continue;
          const k = u / p.life;
          const x = p.tx + p.vx * u + Math.sin(u * 3 + p.ph) * 8 * u;
          const y = p.ty - p.vy * u + Math.sin(u * 2.3 + p.ph * 2) * 6 * u - 8 * u * u;
          const tw = 0.55 + 0.45 * Math.sin(u * p.tw * 3 + p.ph);
          ctx.globalAlpha = Math.pow(1 - k, 1.3) * tw;
          const s = p.size * (2.3 - 1.1 * k);
          ctx.drawImage(k < 0.35 ? cyan : white, x - s, y - s, s * 2, s * 2);
          ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 0.6, y - 0.6, 1.2, 1.2);
        }
      }

      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      if (!revealed2 && t > tD + 250) { revealed2 = true; startReveal(); }
      if (t < tD + WIPE + 3600) requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, VW, VH);
    };
    requestAnimationFrame(frame);
  }

  /* ---------- faint looping YouTube hero background (stops 5s before the end, then loops) ---------- */
  (function heroVideo() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (matchMedia('(max-width: 760px) and (hover: none)').matches) return; // phones: skip (autoplay is unreliable and YouTube's own pause icon shows through)
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
  const tick = () => nav.classList.toggle('on-light', lights.some((el) => { const r = el.getBoundingClientRect(); return r.top < 40 && r.bottom > 80; }));
  const bar = () => nav.classList.toggle('scrolled', scrollY > 120);
  addEventListener('scroll', () => { tick(); bar(); }, { passive: true }); tick(); bar();

})();
