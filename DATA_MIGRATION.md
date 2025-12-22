# 🔄 Data Migration Guide

## Overview

This guide helps you migrate data from the Python backend to your Next.js chatbot.

---

## Prerequisites

- ✅ Python backend folder (`../backend/`) with data files
- ✅ Pinecone account with index created
- ✅ Neo4j database (AuraDB or local)
- ✅ Both databases should already have data from Python setup

---

## Option 1: Use Existing Data (Recommended)

If you already loaded data using the Python scripts:

### Step 1: Verify Data Exists

**Check Pinecone:**

```bash
# The Python script should have already uploaded vectors
# Verify in Pinecone console: https://app.pinecone.io/
```

**Check Neo4j:**

```bash
# Verify in Neo4j Browser: https://console.neo4j.io/
# Run this Cypher query:
MATCH (n) RETURN count(n) as total_nodes
```

### Step 2: Use Same Credentials

Your `.env.local` should point to the **same** databases:

```env
# Same Neo4j instance
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=same_password_as_python

# Same Pinecone index
PINECONE_API_KEY=same_api_key_as_python
PINECONE_HOST=same_host_as_python
PINECONE_INDEX_NAME=vietnam-travel
```

### Step 3: That's It!

The Next.js app will use the existing data automatically.

---

## Option 2: Fresh Data Load

If you need to load data fresh:

### Using Python Scripts (Easiest)

1. **Navigate to Python backend:**

   ```bash
   cd ../backend
   ```

2. **Install Python dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Python:**
   Copy `.env` or create `config.py` with your credentials

4. **Load to Pinecone:**

   ```bash
   python pinecone_upload.py
   ```

   This uploads embeddings for all places in `vietnam_travel_dataset.json`

5. **Load to Neo4j:**

   ```bash
   python load_to_neo4j.py
   ```

   This creates nodes and relationships in the graph

6. **Verify:**
   ```bash
   python test_connections.py
   ```

---

## Option 3: Create Data Loading API (Advanced)

You can create Next.js API routes to load data:

### Example: `/api/load-data/route.ts`

```typescript
import { NextResponse } from "next/server";
import { pineconeService } from "@/app/lib/pinecone";
import { embeddingService } from "@/app/lib/embedding";
import fs from "fs";
import path from "path";

export async function POST() {
  try {
    // Read dataset
    const dataPath = path.join(
      process.cwd(),
      "public",
      "vietnam_travel_dataset.json"
    );
    const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

    // Generate embeddings and upload
    // ... implementation here

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
```

---

## Data Format

### Vietnam Travel Dataset

Location: `public/vietnam_travel_dataset.json`

Expected structure:

```json
[
  {
    "id": "unique_id",
    "name": "Place Name",
    "type": "hotel|restaurant|attraction",
    "city": "City Name",
    "description": "Description text"
  }
]
```

### Pinecone Vectors

- **Dimensions**: 1024 (BGE-large-en-v1.5)
- **Metric**: Cosine similarity
- **Metadata**: id, name, type, city, description

### Neo4j Graph

- **Nodes**: Places with properties (id, name, type, city)
- **Relationships**: LOCATED_IN, NEAR, etc.

---

## Verification

### Check Pinecone

```bash
# Open browser to Pinecone console
# https://app.pinecone.io/
# Look for "vietnam-travel" index
# Verify vector count > 0
```

### Check Neo4j

```cypher
// Open Neo4j Browser
// https://console.neo4j.io/

// Count nodes
MATCH (n) RETURN count(n) as total_nodes;

// Sample nodes
MATCH (n) RETURN n LIMIT 10;

// Check relationships
MATCH ()-[r]->() RETURN type(r), count(r) LIMIT 10;
```

### Test via API

```bash
# Start Next.js server
npm run dev

# Check health
curl http://localhost:3000/api/health

# Test chat
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What hotels are in Hanoi?"}'
```

---

## Troubleshooting

### "No data found" error

- Verify Pinecone index has vectors
- Check Neo4j has nodes
- Ensure credentials in `.env.local` are correct

### "Index not found"

- Create Pinecone index with correct name
- Ensure dimensions = 1024
- Verify index is ready (not initializing)

### "Connection failed"

- Check database URLs are correct
- Verify API keys are valid
- Test connection from Python scripts first

### Wrong vector dimensions

- Pinecone index must be 1024 dimensions
- Python uses: `BAAI/bge-large-en-v1.5`
- Next.js uses: `Xenova/bge-large-en-v1.5`
- Both produce 1024-dim vectors

---

## Quick Reference

| Task            | Python Command               | Next.js Equivalent |
| --------------- | ---------------------------- | ------------------ |
| Load Pinecone   | `python pinecone_upload.py`  | Use same index     |
| Load Neo4j      | `python load_to_neo4j.py`    | Use same database  |
| Test Connection | `python test_connections.py` | `GET /api/health`  |
| Chat            | `python hybrid_chat.py`      | `POST /api/chat`   |

---

## Best Practices

1. ✅ Use the **same databases** for Python and Next.js
2. ✅ Load data once using Python (faster)
3. ✅ Point Next.js to existing data via `.env.local`
4. ✅ Test connections before using chat
5. ✅ Keep `vietnam_travel_dataset.json` synced

---

## Summary

**Recommended Approach:**

1. Load data using Python scripts (one-time)
2. Configure Next.js `.env.local` with same credentials
3. Next.js app uses existing data automatically
4. No additional data loading needed!

**That's it! Your data is ready to use. 🎉**
