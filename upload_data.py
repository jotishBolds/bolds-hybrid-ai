#!/usr/bin/env python3
"""
Upload Sikkim Government Service Rules dataset to Pinecone and Neo4j
"""

import json
import os
import sys
import time
from tqdm import tqdm
from sentence_transformers import SentenceTransformer
import pinecone
import neo4j
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

# -----------------------------
# Configuration
# -----------------------------
DATA_FILE = "public/sikkim-gov-service-rules-dataset.json"
BATCH_SIZE = 32
INDEX_NAME = os.getenv('PINECONE_INDEX_NAME', 'sikkim-service-rule')
VECTOR_DIM = int(os.getenv('PINECONE_VECTOR_DIM', '1024'))
PINECONE_API_KEY = os.getenv('PINECONE_API_KEY')
NEO4J_URI = os.getenv('NEO4J_URI')
NEO4J_USERNAME = os.getenv('NEO4J_USERNAME')
NEO4J_PASSWORD = os.getenv('NEO4J_PASSWORD')

print(f"🚀 Starting data upload...")
print(f"📁 Data file: {DATA_FILE}")
print(f"🔧 Index name: {INDEX_NAME}")
print(f"📊 Vector dimensions: {VECTOR_DIM}")

# -----------------------------
# Initialize clients
# -----------------------------
print("\n📡 Initializing clients...")

# Initialize Pinecone
if not PINECONE_API_KEY:
    print("❌ PINECONE_API_KEY not found in environment variables")
    sys.exit(1)

pinecone.init(api_key=PINECONE_API_KEY, environment="gcp-starter")

# Initialize local embedding model
print("🤖 Loading embedding model: BAAI/bge-large-en-v1.5...")
model = SentenceTransformer('BAAI/bge-large-en-v1.5')  # 1024 dimensional embeddings

# Initialize Neo4j driver
if not all([NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD]):
    print("❌ Neo4j credentials not found in environment variables")
    sys.exit(1)

driver = neo4j.GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USERNAME, NEO4J_PASSWORD))

# -----------------------------
# Create Pinecone index if needed
# -----------------------------
print(f"\n🔍 Checking Pinecone index: {INDEX_NAME}...")
existing_indexes = pinecone.list_indexes()
if INDEX_NAME not in existing_indexes:
    print(f"⚡ Creating Pinecone index: {INDEX_NAME}")
    pinecone.create_index(
        name=INDEX_NAME,
        dimension=VECTOR_DIM,
        metric="cosine",
        pods=1,
        pod_type="s1.x1"
    )
    print("⏳ Waiting for index to be ready...")
    time.sleep(30)  # Wait for index creation
else:
    print(f"✅ Index {INDEX_NAME} already exists")

# Connect to the index
index = pinecone.Index(INDEX_NAME)

# -----------------------------
# Load and process data
# -----------------------------
print(f"\n📖 Loading data from {DATA_FILE}...")
if not os.path.exists(DATA_FILE):
    print(f"❌ Data file not found: {DATA_FILE}")
    sys.exit(1)

with open(DATA_FILE, 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"📊 Loaded {len(data)} records")

# -----------------------------
# Upload to Pinecone
# -----------------------------
print(f"\n🚀 Starting Pinecone upload...")

def create_embedding_text(item):
    """Create text for embedding"""
    text_parts = [
        item.get('name', ''),
        item.get('description', ''),
        item.get('type', ''),
    ]
    return " ".join(filter(None, text_parts))

def upload_to_pinecone():
    """Upload data to Pinecone vector database"""
    vectors_to_upload = []
    
    for i, item in enumerate(tqdm(data, desc="Preparing vectors")):
        # Create text for embedding
        text = create_embedding_text(item)
        
        # Generate embedding
        embedding = model.encode(text).tolist()
        
        # Create metadata
        metadata = {
            'id': item.get('id', str(i)),
            'name': item.get('name', ''),
            'description': item.get('description', ''),
            'type': item.get('type', ''),
            'text': text[:1000]  # Limit text length for metadata
        }
        
        vectors_to_upload.append({
            'id': str(item.get('id', i)),
            'values': embedding,
            'metadata': metadata
        })
        
        # Upload in batches
        if len(vectors_to_upload) >= BATCH_SIZE:
            index.upsert(vectors=vectors_to_upload)
            vectors_to_upload = []
    
    # Upload remaining vectors
    if vectors_to_upload:
        index.upsert(vectors=vectors_to_upload)
    
    print("✅ Pinecone upload completed!")

# -----------------------------
# Upload to Neo4j
# -----------------------------
def upload_to_neo4j():
    """Upload data to Neo4j graph database"""
    print(f"\n🚀 Starting Neo4j upload...")
    
    def clear_database(tx):
        tx.run("MATCH (n) DETACH DELETE n")
    
    def create_node(tx, item):
        query = """
        MERGE (n:ServiceRule {id: $id})
        SET n.name = $name,
            n.description = $description,
            n.type = $type,
            n.created_at = datetime()
        """
        tx.run(query, 
               id=item.get('id', ''),
               name=item.get('name', ''),
               description=item.get('description', ''),
               type=item.get('type', ''))
    
    def create_relationships(tx, item):
        if 'connections' in item:
            for connection in item['connections']:
                query = """
                MATCH (a:ServiceRule {id: $from_id})
                MATCH (b:ServiceRule {id: $to_id})
                MERGE (a)-[:RELATED_TO {type: $relation_type}]->(b)
                """
                tx.run(query,
                       from_id=item.get('id', ''),
                       to_id=connection.get('id', ''),
                       relation_type=connection.get('type', 'RELATED'))
    
    with driver.session() as session:
        # Clear existing data
        print("🗑️ Clearing existing data...")
        session.write_transaction(clear_database)
        
        # Create nodes
        print("📝 Creating nodes...")
        for item in tqdm(data, desc="Creating nodes"):
            session.write_transaction(create_node, item)
        
        # Create relationships
        print("🔗 Creating relationships...")
        for item in tqdm(data, desc="Creating relationships"):
            session.write_transaction(create_relationships, item)
    
    print("✅ Neo4j upload completed!")

# -----------------------------
# Main execution
# -----------------------------
if __name__ == "__main__":
    try:
        # Upload to Pinecone
        upload_to_pinecone()
        
        # Upload to Neo4j
        upload_to_neo4j()
        
        # Verify uploads
        print(f"\n📊 Verification:")
        stats = index.describe_index_stats()
        print(f"✅ Pinecone vectors: {stats['total_vector_count']}")
        
        with driver.session() as session:
            result = session.run("MATCH (n:ServiceRule) RETURN count(n) as count")
            count = result.single()['count']
            print(f"✅ Neo4j nodes: {count}")
        
        print(f"\n🎉 Data upload completed successfully!")
        print(f"📈 {len(data)} records uploaded to both databases")
        
    except Exception as e:
        print(f"❌ Error during upload: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        driver.close()