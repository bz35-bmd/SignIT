// LiquidInkBackground - v18-contrast - vanilla boot (works on file://)
const LiquidInk = window.LiquidInk;

const C = 'v18-contrast';
const palette = ['#04285B', '#0560E3', '#4ECCEC', '#23E294'];
const U = { bloomIntensity: 1, densityDissipation: 1.1, splatRadius: 0.16 };

function initLiquidInk() {
  const root = document.getElementById('liquid-ink-root');
  if (!root || root.dataset.inkVersion) return;
  root.dataset.inkVersion = C;
  console.info('[ink] ' + C);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const coarse = window.matchMedia('(pointer: coarse)').matches;
  let sim = null;
  try {
    sim = new LiquidInk(root);
    sim.setConfig({
      transparent: true,
      colorful: false,
      colorPalette: palette,
      hover: false,
      simResolution: 128,
      dyeResolution: coarse ? 512 : 1024,
      densityDissipation: U.densityDissipation,
      velocityDissipation: 0.2,
      pressure: 0.8,
      curl: 30,
      splatRadius: U.splatRadius,
      splatForce: 6000,
      brightness: 0.9,
      shading: true,
      bloom: true,
      bloomIntensity: U.bloomIntensity,
      bloomThreshold: 0.3,
      sunrays: true,
      sunraysWeight: 0.7,
    });
    sim.start();
    window.__liquidInk = sim;
  } catch (e) {
    console.error('[ink] init failed', e);
    return;
  }

  const fit = () => {
    root.style.width = '100%';
    root.style.height = '100%';
    const canvas = root.querySelector('canvas');
    if (canvas) { canvas.style.width = '100%'; canvas.style.height = '100%'; canvas.style.display = 'block'; }
  };
  fit();
  setTimeout(fit, 120);
  setTimeout(fit, 600);

  // Load splats
  const h = setTimeout(() => { try { sim.multipleSplats(12); } catch (e) {} }, 150);
  const n = setTimeout(() => { try { sim.multipleSplats(8); } catch (e) {} }, 2200);

  // Auto splats every 3.5s
  const l = 6000;
  const clamp = v => Math.max(-250, Math.min(250, v));
  const toCanvasX = px => {
    const canvas = root.querySelector('canvas');
    return !canvas || !canvas.clientWidth ? px : px * (canvas.width / canvas.clientWidth);
  };
  const splat = (clientX, clientY, dx, dy) => {
    try { sim.splatAtLocation(toCanvasX(clientX), clientY, clamp(dx / window.innerWidth * l), clamp(dy / window.innerHeight * l)); } catch (e) {}
  };

  let last = { x: 0, y: 0, has: false };
  let lastMove = 0;
  const onMove = ev => {
    const now = performance.now();
    if (!last.has) { last.x = ev.clientX; last.y = ev.clientY; last.has = true; return; }
    const dx = ev.clientX - last.x;
    const dy = ev.clientY - last.y;
    if (now - lastMove < 24 || dx * dx + dy * dy < 4) return;
    last.x = ev.clientX; last.y = ev.clientY; lastMove = now;
    splat(ev.clientX, ev.clientY, dx, dy);
  };
  const onClick = ev => {
    splat(ev.clientX, ev.clientY, 0, -18);
    splat(ev.clientX, ev.clientY, 14, 10);
  };
  const auto = setInterval(() => {
    if (document.hidden) return;
    const x = window.innerWidth * (0.1 + Math.random() * 0.8);
    const y = window.innerHeight * (0.15 + Math.random() * 0.75);
    const n = coarse ? 2 : 3;
    for (let k = 0; k < n; k++) {
      splat(x + (Math.random() - 0.5) * 80, y + (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 26, (Math.random() - 0.5) * 26);
    }
  }, coarse ? 3200 : 2200);
  const onVis = () => { try { document.hidden ? sim.stop() : sim.start(); } catch (e) {} };

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onClick, { passive: true });
  document.addEventListener('visibilitychange', onVis);

  window.__liquidInkCleanup = () => {
    clearTimeout(h); clearTimeout(n); clearInterval(auto);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerdown', onClick);
    document.removeEventListener('visibilitychange', onVis);
    try { sim.stop(); } catch (e) {}
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLiquidInk);
} else {
  initLiquidInk();
}
