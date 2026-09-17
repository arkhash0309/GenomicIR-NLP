import sys
import os
import streamlit as st

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import streamlit as st
from src.config import load_config
from src.search_engine import load_index, load_metadata, search
from src.embedder import get_model

st.set_page_config(page_title="Semantic Paper Search", layout="wide")
st.title("🔍 Semantic Search for Research Papers")

# Load config and model
config = load_config()
model = get_model(config["embedding_model"])
index = load_index(config["faiss_index_path"])
metadata = load_metadata(config["metadata_path"])

# Search UI
query = st.text_input("Enter your research query:")
if query:
    results = search(index, model, metadata, query, top_k=config["top_k"])
    for paper in results:
        st.markdown(f"### [{paper['title']}]({paper['url']})")
        st.markdown(f"**Authors:** {paper['authors']}")
        st.markdown(f"**DOI:** {paper['doi']}")
        st.markdown(f"**Date:** {paper['date']}")
        st.markdown("**Abstract:**")
        st.markdown(paper['abstract'] or "_No abstract available_")
        st.markdown("**Summary:**")
        st.markdown(paper['summary'] or "_No summary available_")
        st.markdown("---")