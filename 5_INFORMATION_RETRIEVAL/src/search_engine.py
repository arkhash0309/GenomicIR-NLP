import numpy as np
import pandas as pd
import faiss

def build_faiss_index(embeddings):
    dim = embeddings.shape[1]
    index = faiss.IndexFlatL2(dim)  # L2 distance index
    index.add(np.array(embeddings))
    return index

def save_index(index, path):
    faiss.write_index(index, path)

def load_index(path):
    return faiss.read_index(path)

def save_metadata(df, path):
    df.to_pickle(path)

def load_metadata(path):
    return pd.read_pickle(path)

def search(index, model, df, query, top_k=5):
    query_vec = model.encode([query])
    distances, indices = index.search(np.array(query_vec), top_k)

    results = []
    for idx in indices[0]:
        row = df.iloc[idx]
        results.append({
            "title": row.get('Title'),
            "authors": row.get('Authors'),
            "doi": row.get('DOI'),
            "url": row.get('Paper URL'),
            "date": row.get('Date'),
            "abstract": row.get('Abstract'),
            "summary": row.get('Summary'),
        })
    return results