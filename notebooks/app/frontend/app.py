import os
import requests
from flask import Flask, render_template, jsonify, request

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:3001")

app = Flask(__name__)
app.config["BACKEND_URL"] = BACKEND_URL


@app.context_processor
def inject_globals():
    return {"backend_url": BACKEND_URL}


@app.route("/")
def home():
    stats = {"paperCount": "—", "avgAbstractWords": "—", "withSummary": "—"}
    try:
        r = requests.get(f"{BACKEND_URL}/api/stats", timeout=5)
        if r.ok:
            stats = r.json()
    except requests.RequestException:
        pass
    return render_template("index.html", stats=stats, active="home")


@app.route("/retrieve")
def retrieve_page():
    return render_template("retrieve.html", active="retrieve")


@app.route("/summarize")
def summarize_page():
    return render_template("summarize.html", active="summarize")


@app.route("/qa")
def qa_page():
    return render_template("qa.html", active="qa")


@app.route("/about")
def about_page():
    return render_template("about.html", active="about")


# Light proxy so the frontend page can avoid CORS edge cases if desired
@app.route("/proxy/<path:endpoint>", methods=["GET", "POST"])
def proxy(endpoint):
    url = f"{BACKEND_URL}/api/{endpoint}"
    try:
        if request.method == "GET":
            r = requests.get(url, params=request.args, timeout=30)
        else:
            r = requests.post(url, json=request.get_json(silent=True) or {}, timeout=60)
        return (r.content, r.status_code, {"Content-Type": r.headers.get("Content-Type", "application/json")})
    except requests.RequestException as e:
        return jsonify({"error": str(e)}), 502


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)
