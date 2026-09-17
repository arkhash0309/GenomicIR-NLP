import os
import chromadb
import pandas as pd
from langchain.schema import Document
from sentence_transformers import SentenceTransformer
import torch
import pickle

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

df = pd.read_csv('biorxiv_genomics_papers_7070_with_abstracts.csv')

# Initialize the embedding model
embedding_model = SentenceTransformer("BAAI/bge-small-en", device=device)

def get_embeddings(text):
    return embedding_model.encode(text, convert_to_tensor=True).tolist()

# Convert data into Documents
papers = [
    Document(page_content=row['Abstract'], metadata={"Title": row["Title"], "URL": row["Paper URL"]})
    for _, row in df.iterrows()
]

# Save the papers to a file (pickle)
with open("papers.pkl", "wb") as f:
    pickle.dump(papers, f)

# Initialize ChromaDB
chroma_client = chromadb.PersistentClient(path="./genomics_db")
vector_store = Chroma.from_documents(papers, embedding_function=get_embeddings, client=chroma_client)

print("Data ingestion complete. Indexed in ChromaDB.")