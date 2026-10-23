(() => {
  const CFG = window.FROZN || {};
  const $ = (s) => document.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = (t) => t * t * (3 - 2 * t);

  /* ---------- content ---------- */
  $('#yr').textContent = new Date().getFullYear();

  const rail = $('#igRail');
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
    rail.append(card);
  });

  const trusted = CFG.trusted || [];
  $('#marquee').innerHTML = [...trusted, ...trusted].map((t) => `<span>${t}</span>`).join('');

  $('#svcGrid').innerHTML = (CFG.services || []).map((s) =>
    `<article class="svc reveal"><b>${s.n}</b><h3>${s.t}</h3><p>${s.d}</p></article>`).join('');

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

  // reveal on scroll
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  // icicle fringe along the top of the projects section
  (function fringe() {
    const svg = $('#fringe');
    const W = 1200, H = 90;
    let x = 0, d = `M0,0 `;
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    while (x < W) {
      const w = 14 + rnd() * 34;
      const h = 12 + Math.pow(rnd(), 2.2) * (H - 14);
      d += `L${x},0 L${x + w / 2},${h} L${x + w},0 `;
      x += w;
    }
    d += `L${W},0 Z`;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = `<path d="${d}"/>`;
  })();

  /* ---------- nav ---------- */
  const nav = $('#nav');
  const onScrollNav = () => nav.classList.toggle('is-solid', scrollY > 40);
  addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  /* ---------- icicle shatter ---------- */
  if (reduce) { $("#ice").remove(); $("#front").remove(); return; }

  const hero = $('#top');
  const canvas = $('#ice');
  const front = $('#front');
  const scene = $('.hero__scene');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1, shards = [], cracks = [], impact = { x: 0.5, y: 0.5 };
  let seed = 42;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  function build() {
    seed = 42;
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // tall, narrow triangles = icicle spikes
    const cols = Math.max(8, Math.round(W / 58));
    const rows = 4;
    const cw = W / cols, ch = H / rows;
    const pts = [];
    for (let r = 0; r <= rows; r++) {
      pts[r] = [];
      for (let c = 0; c <= cols; c++) {
        const edge = r === 0 || r === rows || c === 0 || c === cols;
        pts[r][c] = {
          x: c * cw + (c === 0 || c === cols ? 0 : (rnd() - 0.5) * cw * 0.9),
          y: r * ch + (r === 0 || r === rows ? 0 : (rnd() - 0.5) * ch * 0.5) + (r === rows ? 0 : 0),
        };
        if (!edge) { /* interior jitter already applied */ }
      }
    }
    // pull the lowest row's interior points into long spikes
    for (let c = 1; c < cols; c++) pts[rows][c].y += (rnd() - 0.2) * ch * 0.18;

    impact = { x: W * 0.5, y: H * 0.46 };
    const maxD = Math.hypot(Math.max(impact.x, W - impact.x), Math.max(impact.y, H - impact.y));
    shards = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const a = pts[r][c], b = pts[r][c + 1], d = pts[r + 1][c], e = pts[r + 1][c + 1];
        const flip = (r + c) % 2;
        const tris = flip ? [[a, b, d], [b, e, d]] : [[a, b, e], [a, e, d]];
        tris.forEach((t) => {
          const cx = (t[0].x + t[1].x + t[2].x) / 3, cy = (t[0].y + t[1].y + t[2].y) / 3;
          const dist = Math.hypot(cx - impact.x, cy - impact.y) / maxD;
          shards.push({
            t, cx, cy,
            delay: 0.16 + dist * 0.42 + rnd() * 0.06,
            vx: (cx - impact.x) / W * 260 + (rnd() - 0.5) * 80,
            vy: -40 - rnd() * 60,
            g: 1100 + rnd() * 900,
            rot: (rnd() - 0.5) * 5,
            flipS: (rnd() - 0.5) * 6,
            shade: rnd(),
          });
        });
      }
    }

    // radial crack lines from the impact point
    cracks = [];
    const n = 15;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2 + (rnd() - 0.5) * 0.35;
      const len = (0.35 + rnd() * 0.65) * Math.hypot(W, H) * 0.55;
      const segs = [];
      let px = impact.x, py = impact.y, a = ang;
      for (let s = 0; s < 9; s++) {
        a += (rnd() - 0.5) * 0.5;
        const l = len / 9;
        px += Math.cos(a) * l; py += Math.sin(a) * l;
        segs.push([px, py]);
      }
      cracks.push(segs);
    }
  }

  function drawShard(s, p) {
    const t = clamp((p - s.delay) / 0.38);
    const [a, b, c] = s.t;
    ctx.save();
    if (t > 0) {
      const tt = t, sec = tt * 1.6;
      const x = s.vx * tt, y = s.vy * tt + s.g * sec * sec * 0.45;
      ctx.translate(s.cx + x, s.cy + y);
      ctx.rotate(s.rot * tt);
      ctx.scale(Math.cos(s.flipS * tt), 1);
      ctx.translate(-s.cx, -s.cy);
      ctx.globalAlpha = clamp(1 - Math.pow(tt, 2.2));
    }
    ctx.beginPath();
    ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.closePath();
    const g = ctx.createLinearGradient(s.cx, Math.min(a.y, b.y, c.y), s.cx, Math.max(a.y, b.y, c.y));
    const k = s.shade;
    g.addColorStop(0, `rgba(${215 + k * 30},${240 + k * 12},255,0.97)`);
    g.addColorStop(1, `rgba(${110 + k * 50},${190 + k * 30},${235},0.94)`);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.stroke();
    ctx.restore();
  }

  function drawCracks(p) {
    const grow = clamp(p / 0.15);
    if (grow <= 0 || p > 0.2) return;
    ctx.save();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = 'rgba(0,70,110,0.65)';
    ctx.shadowColor = 'rgba(255,255,255,.9)';
    ctx.shadowBlur = 4;
    cracks.forEach((segs) => {
      ctx.beginPath();
      ctx.moveTo(impact.x, impact.y);
      const upto = grow * segs.length;
      for (let i = 0; i < segs.length; i++) {
        if (i + 1 <= upto) ctx.lineTo(segs[i][0], segs[i][1]);
        else if (i < upto) {
          const f = upto - i, pr = i === 0 ? [impact.x, impact.y] : segs[i - 1];
          ctx.lineTo(pr[0] + (segs[i][0] - pr[0]) * f, pr[1] + (segs[i][1] - pr[1]) * f);
        }
      }
      ctx.stroke();
    });
    ctx.restore();
  }

  let ticking = false;
  function render() {
    ticking = false;
    const rect = hero.getBoundingClientRect();
    const total = rect.height - innerHeight;
    const p = clamp(-rect.top / total);
    ctx.clearRect(0, 0, W, H);
    if (p < 0.995) {
      shards.forEach((s) => drawShard(s, p));
      drawCracks(p);
    }
    // logo + hint fade and rise as the ice starts to crack
    const f = clamp(p / 0.2);
    scene.style.opacity = String(ease(clamp((p - 0.12) / 0.3)));
    front.style.opacity = String(1 - ease(f));
    front.style.transform = `translateY(${-f * 40}px) scale(${1 + f * 0.04})`;
  }
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(render); } };
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', () => { build(); render(); });
  build(); render();
})();
