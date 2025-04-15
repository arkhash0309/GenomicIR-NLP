import chromadb
from langchain.vectorstores import Chroma
from langchain.retrievers import BM25Retriever
from rerankers import CohereReranker
import pickle

# Load the papers list from the saved pickle file
with open("papers.pkl", "rb") as f:
    papers = pickle.load(f)

# Load the ChromaDB
chroma_client = chromadb.PersistentClient(path="./genomics_db")
vector_store = Chroma(client=chroma_client)

# BM25 keyword search
bm25_retriever = BM25Retriever.from_documents(papers)
bm25_retriever.k = 3 # return the top 3 results from the keyword search

# Reranker (Cohere Reranker)
cohere_reranker = CohereReranker(model="rerank-english-v2.0")

def hybrid_search(query, top_k=5):
    vector_results = vector_store.similarity_search(query, k=top_k) # Get the top 5 results from the vector search
    keyword_results = bm25_retriever.get_relevant_documents(query) # Get the top 3 results from the keyword search
    combined_results = vector_results + keyword_results # Combine the results from both methods
    reranked_results = cohere_reranker.rerank(query, combined_results, top_k) # Rerank the combined results and return the top_k results
    return reranked_results