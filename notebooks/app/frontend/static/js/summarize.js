(function () {
  const form = document.getElementById("summarizeForm");
  const text = document.getElementById("summarizeText");
  const nInput = document.getElementById("summarizeN");
  const status = document.getElementById("summarizeStatus");
  const card = document.getElementById("summarizeResult");
  const out = document.getElementById("summaryText");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = { text: text.value.trim(), sentences: parseInt(nInput.value, 10) || 3 };
    if (!body.text) return;
    status.className = "status";
    status.innerHTML = `<span class="spinner"></span> Summarizing...`;
    card.classList.add("hidden");
    try {
      const data = await API.post("/api/summarize", body);
      out.textContent = data.summary;
      card.classList.remove("hidden");
      status.textContent = "Done.";
    } catch (err) {
      status.className = "status error";
      status.textContent = "Error: " + err.message;
    }
  });
})();
