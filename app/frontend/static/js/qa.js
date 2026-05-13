(function () {
  const chat = document.getElementById("chat");
  const form = document.getElementById("qaForm");
  const input = document.getElementById("qaInput");

  function escapeHTML(s) {
    return (s || "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function bubble(role, html) {
    const div = document.createElement("div");
    div.className = "msg " + role;
    const avatar = role === "user" ? "YOU" : "DNA";
    div.innerHTML = `<div class="avatar">${avatar}</div><div class="bubble">${html}</div>`;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
    return div;
  }

  bubble("bot", `Hi — I'm your genomics literature assistant. Ask me anything about the indexed papers. <em>e.g.</em> "What techniques are used to study chromatin accessibility?"`);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    bubble("user", escapeHTML(q));
    input.value = "";
    const pending = bubble("bot", `<span class="spinner"></span> Searching abstracts...`);

    try {
      const data = await API.post("/api/qa", { question: q });
      let html = escapeHTML(data.answer);
      if (data.sources && data.sources.length) {
        html += `<div class="sources">${data.sources.map(s => `
          <div class="src">
            <a href="${escapeHTML(s.url)}" target="_blank" rel="noopener">${escapeHTML(s.title)}</a>
            ${s.snippet ? `<div class="snip">${escapeHTML(s.snippet)}</div>` : ""}
          </div>`).join("")}</div>`;
      }
      pending.querySelector(".bubble").innerHTML = html;
    } catch (err) {
      pending.querySelector(".bubble").innerHTML = `<span style="color:var(--magenta)">Error: ${escapeHTML(err.message)}</span>`;
    }
  });
})();
