from sentence_transformers import SentenceTransformer
import torch

# # check if GPU is available and set the device accordingly
# if torch.cuda.is_available():
#     device = torch.device('cuda')
# else:
#     device = torch.device('cpu')

def get_model(name):
    return SentenceTransformer(name)

def embed_documents(model, documents):
    """
    Embed a list of documents using the provided model.
    
    Args:
        model: The SentenceTransformer model to use for embedding.
        documents: List of documents (strings) to embed.
        
    Returns:
        List of embeddings for the documents.
    """
    return model.encode(documents, show_progress_bar=True)