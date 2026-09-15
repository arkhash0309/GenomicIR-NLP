// Animated DNA double helix in the page background.
(function () {
  const canvas = document.getElementById("helixCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let w = 0, h = 0, dpr = window.devicePixelRatio || 1;

  function resize() {
    w = canvas.clientWidth = window.innerWidth;
    h = canvas.clientHeight = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  // Build a few helices placed across the viewport
  const HELICES = [
    { x: 0.18, amp: 60, freq: 0.018, speed: 0.0006, hue: 170 },
    { x: 0.82, amp: 70, freq: 0.016, speed: -0.0008, hue: 240 },
    { x: 0.50, amp: 50, freq: 0.022, speed: 0.0005, hue: 320 },
  ];

  let t = 0;

  function drawHelix(cfg) {
    const cx = cfg.x * w;
    const phase = t * cfg.speed * 1000;
    const step = 16;
    const points1 = [], points2 = [];
    for (let y = -40; y < h + 40; y += step) {
      const a = Math.sin(y * cfg.freq + phase);
      const a2 = Math.sin(y * cfg.freq + phase + Math.PI);
      points1.push([cx + a * cfg.amp, y, a]);
      points2.push([cx + a2 * cfg.amp, y, a2]);
    }

    // strands
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = `hsla(${cfg.hue}, 80%, 65%, 0.55)`;
    ctx.beginPath();
    points1.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.stroke();

    ctx.strokeStyle = `hsla(${cfg.hue + 60}, 80%, 70%, 0.5)`;
    ctx.beginPath();
    points2.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.stroke();

    // rungs (base pairs)
    for (let i = 0; i < points1.length; i += 2) {
      const [x1, y1, depth1] = points1[i];
      const [x2, y2] = points2[i];
      const alpha = 0.18 + 0.25 * (1 - Math.abs(depth1));
      ctx.strokeStyle = `hsla(${cfg.hue + 30}, 70%, 70%, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // nucleotide nodes
      ctx.fillStyle = `hsla(${cfg.hue}, 80%, 70%, ${0.6 + 0.3 * depth1})`;
      ctx.beginPath();
      ctx.arc(x1, y1, 2 + depth1 * 1.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `hsla(${cfg.hue + 60}, 80%, 75%, ${0.6 - 0.3 * depth1})`;
      ctx.beginPath();
      ctx.arc(x2, y2, 2 - depth1 * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop(now) {
    t = now;
    ctx.clearRect(0, 0, w, h);
    HELICES.forEach(drawHelix);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
