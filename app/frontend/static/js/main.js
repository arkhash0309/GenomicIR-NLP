// Shared helpers + small visual flourishes.

window.API = (function () {
  const base = window.BACKEND_URL || "";
  async function get(path, params) {
    const url = new URL(base + path);
    if (params) Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v));
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  }
  async function post(path, body) {
    const r = await fetch(base + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body || {}),
    });
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      throw new Error("HTTP " + r.status + " " + text);
    }
    return r.json();
  }
  return { get, post };
})();

// Animate stat counters on the home page
(function animateStats() {
  const stats = document.querySelectorAll(".stat-value[data-count]");
  stats.forEach((el) => {
    const target = parseInt((el.dataset.count || "").toString().replace(/[^0-9]/g, ""), 10);
    if (!target || target < 5) return;
    const dur = 1200;
    const start = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(target * eased).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target.toLocaleString();
    }
    requestAnimationFrame(tick);
  });
})();
