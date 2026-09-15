(function () {
  const form = document.getElementById("retrieveForm");
  const input = document.getElementById("retrieveQuery");
  const kSel = document.getElementById("retrieveK");
  const status = document.getElementById("retrieveStatus");
  const results = document.getElementById("retrieveResults");

  function escapeHTML(s) {
    return (s || "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function render(items, query) {
    if (!items.length) {
      results.innerHTML = `<div class="placeholder">No matches for "${escapeHTML(query)}". Try different keywords.</div>`;
      return;
    }
    results.innerHTML = items.map(p => `
      <article class="result-item">
        <h3 class="result-title">
          <a href="${escapeHTML(p.url)}" target="_blank" rel="noopener">${escapeHTML(p.title)}</a>
          <span class="result-score">BM25 ${p.score}</span>
        </h3>
        <div class="result-meta">
          ${p.authors ? escapeHTML(p.authors) + " · " : ""}${p.date ? escapeHTML(p.date) + " · " : ""}${p.doi ? `<a href="${escapeHTML(p.url)}" target="_blank" rel="noopener" style="color:inherit">${escapeHTML(p.doi)}</a>` : ""}
        </div>
        <div class="result-summary">${escapeHTML(p.summary || p.abstract.slice(0, 320) + "…")}</div>
      </article>
    `).join("");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    status.className = "status";
    status.innerHTML = `<span class="spinner"></span> Searching ${escapeHTML(q)}...`;
    results.innerHTML = "";
    try {
      const data = await API.get("/api/retrieve", { q, k: kSel.value });
      status.textContent = `Found ${data.results.length} result${data.results.length === 1 ? "" : "s"}`;
      render(data.results, q);
    } catch (err) {
      status.className = "status error";
      status.textContent = "Error: " + err.message;
    }
  });
})();
