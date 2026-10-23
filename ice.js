// 3D icicle shatter: real glass-like shards (Three.js) driven by scroll, with
// sub-frame motion blur (several time samples per frame averaged together).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const out = document.getElementById('ice');
if (!reduce && out) init();

function init() {
  const $ = (s) => document.querySelector(s);
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = (t) => t * t * (3 - 2 * t);
  const hero = $('#top'), front = $('#front'), scene2d = $('.hero__scene');
  const ctx = out.getContext('2d');

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, premultipliedAlpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.add(new THREE.AmbientLight(0xcfe9ff, 0.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-400, 600, 700); scene.add(key);
  const rim = new THREE.DirectionalLight(0x4fc3f7, 1.6); rim.position.set(500, -300, -200); scene.add(rim);

  const camera = new THREE.PerspectiveCamera(35, 1, 10, 6000);
  const mats = [0xcdeeff, 0xa8dcf6, 0xe2f6ff, 0x8fcdee].map((c) => new THREE.MeshPhysicalMaterial({
    color: c, roughness: 0.08, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.05,
    envMapIntensity: 1.5, ior: 1.31, transparent: true, opacity: 0.93, flatShading: true,
    side: THREE.DoubleSide,
  }));

  let W = 0, H = 0, shards = [], cracks = [], impact = { x: 0, y: 0 };
  const group = new THREE.Group(); scene.add(group);
  let seed = 42;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  function build() {
    seed = 42;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = out.clientWidth; H = out.clientHeight;
    out.width = W * dpr; out.height = H * dpr;
    renderer.setPixelRatio(dpr); renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.position.z = (H / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    camera.updateProjectionMatrix();

    shards.forEach((s) => { group.remove(s.mesh); s.mesh.geometry.dispose(); });
    shards = [];

    const cols = Math.max(8, Math.round(W / 58)), rows = 4;
    const cw = W / cols, ch = H / rows;
    const pts = [];
    for (let r = 0; r <= rows; r++) {
      pts[r] = [];
      for (let c = 0; c <= cols; c++) {
        pts[r][c] = {
          x: c * cw + (c === 0 || c === cols ? 0 : (rnd() - 0.5) * cw * 0.9),
          y: r * ch + (r === 0 || r === rows ? 0 : (rnd() - 0.5) * ch * 0.5),
        };
      }
    }
    impact = { x: W * 0.5, y: H * 0.46 };
    const maxD = Math.hypot(Math.max(impact.x, W - impact.x), Math.max(impact.y, H - impact.y));

    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const a = pts[r][c], b = pts[r][c + 1], d = pts[r + 1][c], e = pts[r + 1][c + 1];
      const tris = (r + c) % 2 ? [[a, b, d], [b, e, d]] : [[a, b, e], [a, e, d]];
      tris.forEach((t) => {
        const cx = (t[0].x + t[1].x + t[2].x) / 3, cy = (t[0].y + t[1].y + t[2].y) / 3;
        const shape = new THREE.Shape();
        t.forEach((p, i) => { const x = p.x - cx, y = -(p.y - cy); i ? shape.lineTo(x, y) : shape.moveTo(x, y); });
        shape.closePath();
        const depth = 8 + rnd() * 16;
        const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 1.6, bevelSize: 1.2, bevelOffset: -1.4, bevelSegments: 1, steps: 1 });
        geo.translate(0, 0, -depth / 2);
        const mesh = new THREE.Mesh(geo, mats[(rnd() * mats.length) | 0]);
        mesh.position.set(cx - W / 2, H / 2 - cy, 0);
        group.add(mesh);
        const dist = Math.hypot(cx - impact.x, cy - impact.y) / maxD;
        shards.push({
          mesh, cx, cy,
          delay: 0.16 + dist * 0.42 + rnd() * 0.06,
          vx: (cx - impact.x) / W * 340 + (rnd() - 0.5) * 120,
          vy: 30 + rnd() * 60,
          vz: 250 + (1 - dist) * 700 + rnd() * 250,
          g: 1100 + rnd() * 900,
          rx: (rnd() - 0.5) * 11, ry: (rnd() - 0.5) * 11, rz: (rnd() - 0.5) * 7,
        });
      });
    }

    // radial cracks drawn on the 2D layer before the pane breaks
    cracks = [];
    const n = 15;
    for (let i = 0; i < n; i++) {
      let a = (i / n) * Math.PI * 2 + (rnd() - 0.5) * 0.35, px = impact.x, py = impact.y;
      const len = (0.35 + rnd() * 0.65) * Math.hypot(W, H) * 0.55, segs = [];
      for (let s = 0; s < 9; s++) { a += (rnd() - 0.5) * 0.5; px += Math.cos(a) * len / 9; py += Math.sin(a) * len / 9; segs.push([px, py]); }
      cracks.push(segs);
    }
  }

  function pose(p) {
    for (const s of shards) {
      const t = clamp((p - s.delay) / 0.42), m = s.mesh;
      if (t >= 1) { m.visible = false; continue; }
      m.visible = true;
      if (t <= 0) {
        // tiny pre-fracture rattle so the pane feels under stress
        const k = clamp((p - (s.delay - 0.06)) / 0.06);
        m.position.set(s.cx - W / 2 + Math.sin(p * 900 + s.cx) * k * 1.6, H / 2 - s.cy, 0);
        m.rotation.set(0, 0, 0); m.scale.setScalar(1);
        continue;
      }
      const T = t * 1.6;
      m.position.set(s.cx - W / 2 + s.vx * t, H / 2 - s.cy - (s.vy * t + s.g * T * T * 0.45), s.vz * t * t * 1.6);
      m.rotation.set(s.rx * t, s.ry * t, s.rz * t);
      m.scale.setScalar(1 - Math.pow(t, 4) * 0.8);
    }
  }

  function drawCracks(p) {
    const grow = clamp(p / 0.15);
    if (grow <= 0 || p > 0.2) return;
    ctx.save();
    ctx.lineWidth = 1.4; ctx.strokeStyle = 'rgba(0,70,110,0.65)';
    ctx.shadowColor = 'rgba(255,255,255,.9)'; ctx.shadowBlur = 4;
    cracks.forEach((segs) => {
      ctx.beginPath(); ctx.moveTo(impact.x, impact.y);
      const upto = grow * segs.length;
      for (let i = 0; i < segs.length; i++) {
        if (i + 1 <= upto) ctx.lineTo(segs[i][0], segs[i][1]);
        else if (i < upto) { const f = upto - i, pr = i === 0 ? [impact.x, impact.y] : segs[i - 1]; ctx.lineTo(pr[0] + (segs[i][0] - pr[0]) * f, pr[1] + (segs[i][1] - pr[1]) * f); }
      }
      ctx.stroke();
    });
    ctx.restore();
  }

  let lastP = 0, vel = 0, ticking = false;
  function frame() {
    ticking = false;
    const rect = hero.getBoundingClientRect();
    const p = clamp(-rect.top / (rect.height - innerHeight));
    vel = vel * 0.6 + (p - lastP) * 0.4; lastP = p;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, out.width, out.height);
    if (p < 0.995) {
      // motion blur: average several sub-frames trailing back in time by the scroll speed
      const span = clamp(Math.abs(vel) * 5, 0, 0.07);
      const K = span > 0.0012 ? 9 : 1;
      for (let i = 0; i < K; i++) {
        pose(clamp(p - (K > 1 ? span * i / (K - 1) : 0)));
        renderer.render(scene, camera);
        ctx.globalAlpha = 1 / (i + 1);
        ctx.drawImage(renderer.domElement, 0, 0, out.width, out.height);
      }
      ctx.globalAlpha = 1;
      ctx.setTransform(out.width / W, 0, 0, out.height / H, 0, 0);
      drawCracks(p);
    }

    // hero copy: logo fades as the ice cracks, tagline emerges, impact shake
    const f = clamp(p / 0.2);
    scene2d.style.opacity = String(ease(clamp((p - 0.12) / 0.3)));
    front.style.opacity = String(1 - ease(f));
    front.style.transform = `translateY(${-f * 40}px) scale(${1 + f * 0.04})`;
    const shake = Math.max(0, 1 - Math.abs(p - 0.2) / 0.05);
    scene2d.style.transform = shake ? `translate(${(Math.random() - 0.5) * 10 * shake}px, ${(Math.random() - 0.5) * 10 * shake}px)` : '';

    if (Math.abs(vel) > 0.0002) request();
  }
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', () => { build(); request(); });
  build(); frame();
}
