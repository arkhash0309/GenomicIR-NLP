from langchain.chat_models import BaseChatModel
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from retrieval import hybrid_search
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from langchain.llms import HuggingFaceLLM

# Check if CUDA (GPU) is available
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

# Load the LLaMa model
model_name = "meta-llama/Llama-2-7b-chat-hf"

# Load the model and the tokenizer
model = AutoModelForCausalLM.from_pretrained(model_name, device_map="auto", dtype=torch.float16)
tokenizer = AutoTokenizer.from_pretrained(model_name)

# Wrap the model in Langchain's LLM class
class LLaMaModel(HuggingFaceLLM):
    def __init__(self, model, tokenizer, device):
        self.model = model
        self.tokenizer = tokenizer
        self.device = device
        super().__init__()

    def _call(self, prompt: str, stop=None):
        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.device)
        output = self.model_generate(**inputs, max_length=4096)
        return self.tokenizer.decode(output[0], skip_special_tokens=True)

# Initialize LLaMa LLM
llama_llm = LLaMaModel(model, tokenizer, device)

# Token limiting
TOKEN_LIMIT = 4096 # prevent exceeding the input limit of the LLM model

def truncate_text(text, max_tokens=TOKEN_LIMIT):
    return " ".join(text.split()[:max_tokens])

# Conversational Memory
memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

# Response Generation
retrieval_chain = ConversationalRetrievalChain.from_llm(
    llama_llm, retriever=hybrid_search, memory=memory
)

def ask_question(query):
    results = hybrid_search(query, top_k=5)
    context = "\n".join([doc.page_content for doc in results])
    truncated_context = truncate_text(context)
    response = retrieval_chain.run(input_documents=truncated_context, question=query)
    return response