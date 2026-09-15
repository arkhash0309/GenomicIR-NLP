from src.config import load_config
from src.data_loader import load_and_prepare_data
from src.embedder import get_model, embed_documents
from src.search_engine import build_faiss_index, save_index, save_metadata

config = load_config()

# load data and build the content field
df = load_and_prepare_data(config['csv_path'], config['content_fields'])

# Generate the embeddings
model = get_model(config['embedding_model'])
embeddings = embed_documents(model, df['content'].tolist())

# build and save index + metadata
index = build_faiss_index(embeddings)
save_index(index, config['faiss_index_path'])
save_metadata(df, config['metadata_path'])