# config.py - Configuration management with environment variables
import os
from dotenv import load_dotenv

# Load environment variables from .env.local file
load_dotenv('.env.local')

# --- Neo4j Credentials ---
NEO4J_URI = os.getenv("NEO4J_URI", "neo4j+s://your-neo4j-uri.databases.neo4j.io")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "")

# --- Pinecone Credentials ---
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "")
PINECONE_HOST = os.getenv("PINECONE_HOST", "")

# --- LLM Configuration ---
# Choose LLM provider: "openai" or "huggingface"
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "huggingface")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY", "")

# --- Project Settings ---
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "sikkim-service-rule")
PINECONE_VECTOR_DIM = int(os.getenv("PINECONE_VECTOR_DIM", "1024"))
PINECONE_TOP_K = int(os.getenv("PINECONE_TOP_K", "5"))

# --- API Server Configuration ---
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

# Validate required environment variables
def validate_config():
    """Validate that all required configuration variables are set."""
    errors = []
    
    if not PINECONE_API_KEY or PINECONE_API_KEY == "":
        errors.append("PINECONE_API_KEY is not set")
    
    if not NEO4J_PASSWORD or NEO4J_PASSWORD == "":
        errors.append("NEO4J_PASSWORD is not set")
    
    # Validate LLM provider credentials
    if LLM_PROVIDER == "openai" and (not OPENAI_API_KEY or OPENAI_API_KEY == ""):
        errors.append("OPENAI_API_KEY is not set (LLM_PROVIDER=openai)")
    elif LLM_PROVIDER == "huggingface" and (not HUGGINGFACE_API_KEY or HUGGINGFACE_API_KEY == ""):
        errors.append("HUGGINGFACE_API_KEY is not set (LLM_PROVIDER=huggingface)")
    
    if "your-neo4j-uri" in NEO4J_URI:
        errors.append("NEO4J_URI is not properly configured")
    
    if errors:
        error_msg = "Configuration errors:\n" + "\n".join(f"  - {e}" for e in errors)
        raise ValueError(error_msg)
    
    return True
