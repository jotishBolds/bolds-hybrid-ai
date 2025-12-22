# 🚀 Complete Setup Guide - Vietnam Travel Assistant

## Overview

This Next.js application implements a complete Hybrid RAG (Retrieval-Augmented Generation) chatbot with:

- **Embedding Generation**: In-browser using HuggingFace Transformers
- **Vector Search**: Pinecone for semantic similarity
- **Graph Database**: Neo4j for entity relationships
- **LLM**: HuggingFace Inference API (Mistral-7B) or OpenAI

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ Node.js 18+ installed
- ✅ Pinecone account (free tier available)
- ✅ Neo4j database (AuraDB free tier or local)
- ✅ HuggingFace account with API token

## 🔧 Step-by-Step Setup

### 1. Database Setup

#### Pinecone Setup

1. Go to [pinecone.io](https://www.pinecone.io/) and create account
2. Create a new Serverless index:
   - Name: `vietnam-travel`
   - Dimensions: `1024`
   - Metric: `cosine`
   - Cloud Provider: AWS (or your preference)
   - Region: `us-east-1` (or closest)
3. Copy your API key and index host URL

#### Neo4j Setup

1. Go to [neo4j.com/aura](https://neo4j.com/aura/) and create account
2. Create a free AuraDB instance
3. Save your credentials (URI, username, password)
4. Wait for instance to be ready

#### HuggingFace Setup

1. Go to [huggingface.co](https://huggingface.co/)
2. Create account or login
3. Go to Settings → Access Tokens
4. Create a new token with "Read" permissions
5. Copy the token

### 2. Environment Configuration

Edit `.env.local` with your credentials:

```env
# Neo4j Configuration
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password_here

# Pinecone Configuration
PINECONE_API_KEY=pcsk_xxxxx
PINECONE_HOST=vietnam-travel-xxxxx.svc.aped-xxxx-xxxx.pinecone.io
PINECONE_INDEX_NAME=vietnam-travel
PINECONE_VECTOR_DIM=1024
PINECONE_TOP_K=5

# LLM Provider
LLM_PROVIDER=huggingface
HUGGINGFACE_API_KEY=hf_xxxxx

# Next.js
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

### 3. Data Loading (Optional - Initial Setup)

If you need to populate Pinecone and Neo4j with data, you can:

1. Use the Python scripts from the `backend` folder:

   ```bash
   cd ../backend
   python pinecone_upload.py
   python load_to_neo4j.py
   ```

2. Or create a data loading API endpoint in Next.js (advanced)

### 4. Run the Application

```bash
# Install dependencies (if not already done)
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Test the Chatbot

Click the floating chat bubble in the bottom-left and try:

- "What are the best hotels in Hanoi?"
- "Tell me about restaurants in Ho Chi Minh City"
- "What attractions should I visit in Da Nang?"

## 🏗️ Architecture Details

### Request Flow

```
User Query → Embedding Service → Pinecone Search → Neo4j Context → LLM Summarize → LLM Answer → User
```

1. **User sends message** via FloatingChatBubble
2. **ChatBot component** calls `/api/chat` endpoint
3. **Chat Engine**:
   - Generates embedding using BGE-large-en-v1.5 model
   - Queries Pinecone for top-5 similar documents
   - Fetches Neo4j relationships for matched documents
   - Builds context from vector + graph results
   - Summarizes context using LLM
   - Generates final answer using LLM with context
4. **Response returned** with answer and source documents
5. **UI displays** message and sources

### File Organization

```
app/
├── api/                    # Backend API Routes
│   ├── chat/route.ts      # Main chat endpoint
│   └── health/route.ts    # Health check
├── components/            # React Components
│   ├── ChatBot.tsx        # Main chat interface
│   ├── ChatInput.tsx      # Message input
│   ├── MessageList.tsx    # Message display
│   ├── SourceList.tsx     # Source documents
│   └── FloatingChatBubble.tsx  # Floating widget
└── lib/                   # Core Services
    ├── chat-engine.ts     # RAG orchestration
    ├── embedding.ts       # Vector generation
    ├── pinecone.ts        # Vector database
    ├── neo4j.ts          # Graph database
    ├── llm.ts            # LLM service
    ├── config.ts         # Configuration
    ├── types.ts          # TypeScript types
    ├── api.ts            # Client API
    └── utils.ts          # Utilities
```

## 🔍 API Documentation

### POST /api/chat

**Request:**

```json
{
  "message": "What are the best hotels in Hanoi?",
  "session_id": "optional-session-id"
}
```

**Response:**

```json
{
  "response": "Here are some excellent hotels in Hanoi...",
  "session_id": "abc-123",
  "sources": [
    {
      "id": "hotel_1",
      "name": "Sofitel Legend Metropole",
      "type": "hotel",
      "city": "Hanoi",
      "score": 0.89
    }
  ]
}
```

### GET /api/health

**Response:**

```json
{
  "status": "healthy",
  "services": {
    "embedding_model": true,
    "pinecone": true,
    "neo4j": true,
    "llm": true,
    "llm_provider": "huggingface"
  }
}
```

## 🎨 Component Usage

### Using the Floating Chat Bubble

```tsx
import { FloatingChatBubble } from '@/app/components/FloatingChatBubble';

// Default: bottom-left
<FloatingChatBubble />

// Custom position
<FloatingChatBubble position="bottom-right" />

// Start expanded
<FloatingChatBubble defaultExpanded={true} />
```

### Using ChatBot Inline

```tsx
import { ChatBot } from "@/app/components/ChatBot";

<div className="h-screen">
  <ChatBot />
</div>;
```

## 🐛 Troubleshooting

### "Configuration errors" on startup

- Check all environment variables in `.env.local`
- Verify API keys are valid
- Ensure Neo4j and Pinecone are accessible

### Embedding model not loading

- First load downloads ~1GB model
- Check browser console for progress
- Ensure stable internet connection
- May take 1-2 minutes on first load

### "Failed to query Pinecone"

- Verify PINECONE_HOST includes full URL
- Check PINECONE_INDEX_NAME matches your index
- Ensure index dimensions are 1024
- Verify API key has correct permissions

### "Neo4j connection failed"

- Check NEO4J_URI format: `neo4j+s://xxx.databases.neo4j.io`
- Verify password is correct
- Ensure database is running (check AuraDB console)
- Check firewall/network settings

### LLM responses are slow

- HuggingFace Inference API has rate limits
- Consider using OpenAI instead (faster)
- Check your API quota/limits

### Chat bubble not appearing

- Check browser console for errors
- Verify component is imported in page.tsx
- Check z-index conflicts with other elements

## 🚀 Production Deployment

### Environment Variables

Set all env vars in your hosting platform:

- Vercel: Project Settings → Environment Variables
- Netlify: Site Settings → Environment Variables
- AWS/Azure: Configure in deployment settings

### Build Command

```bash
npm run build
```

### Start Command

```bash
npm run start
```

### Recommended Hosting

- **Vercel**: Best for Next.js (auto-deployment)
- **Netlify**: Good alternative
- **AWS Amplify**: Enterprise option
- **Docker**: Self-hosted option

## 📊 Performance Tips

1. **Caching**: Embedding service caches results (100 entries)
2. **Session Management**: Reuse session_id for conversation context
3. **Rate Limiting**: Implement on `/api/chat` endpoint
4. **CDN**: Use for static assets
5. **Monitoring**: Add logging and error tracking

## 🔐 Security Best Practices

1. Never commit `.env.local` to git
2. Use environment variables for all secrets
3. Implement rate limiting on API routes
4. Add CORS restrictions in production
5. Sanitize user inputs before processing
6. Use HTTPS in production

## 📝 Next Steps

- [ ] Add user authentication
- [ ] Implement conversation history storage
- [ ] Add more data sources
- [ ] Implement feedback mechanism
- [ ] Add analytics tracking
- [ ] Create admin dashboard
- [ ] Add multilingual support

## 🤝 Support

For issues or questions:

1. Check this guide first
2. Review code comments in files
3. Check browser/server console logs
4. Verify all services are healthy via `/api/health`

## 📄 License

MIT License - See LICENSE file
