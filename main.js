(() => {
  const CFG = window.FROZN || {};
  const $ = (s) => document.querySelector(s);
  const body = document.body;

  /* ---------- intro: logo centred, then the panel lifts and the headline rises ---------- */
  const loader = $('#loader');
  const startReveal = () => {
    loader.classList.add('is-done');
    body.classList.remove('is-loading');
    setTimeout(() => body.classList.add('is-ready'), 350);
    setTimeout(() => loader.remove(), 1400);
  };
  const minShow = new Promise((r) => setTimeout(r, 1500));
  const fontsReady = (document.fonts && document.fonts.ready) || Promise.resolve();
  Promise.all([minShow, fontsReady, new Promise((r) => (document.readyState === 'complete' ? r() : addEventListener('load', r)))]).then(startReveal);
  setTimeout(startReveal, 4000); // never trap the visitor behind the loader

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
