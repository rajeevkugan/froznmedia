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

  if (reduce) { $('#ice').remove(); $('#front').remove(); }
})();
