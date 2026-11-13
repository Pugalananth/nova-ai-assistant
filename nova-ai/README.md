# NOVA AI — NVIDIA-powered assistant

A deployable starter for a Claude-inspired AI assistant. It includes:
- React + TypeScript + Vite frontend
- FastAPI backend with NVIDIA's OpenAI-compatible chat-completions API
- Streaming chat responses (SSE)
- MongoDB persistence for registered users and conversation history
- JWT email/password authentication
- Model selector, new chats, history, markdown-like code display, responsive layout
- Render deployment configuration and environment-variable templates

> This is an extensible assistant foundation, not a clone of Claude's proprietary models or product. App integrations (GitHub, Gmail, Drive, MCP servers, web search) require separate credentials, OAuth permissions, and implementation. Do not expose API keys in frontend code.

## Requirements
- Node.js 20+
- Python 3.11+
- MongoDB Atlas free cluster (or local MongoDB)
- NVIDIA API key and an available model ID from https://build.nvidia.com/

## Local development

### 1. Backend
```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env   # Windows; on macOS/Linux use: cp .env.example .env
```
Edit `backend/.env`:
- `NVIDIA_API_KEY`: your key
- `NVIDIA_MODEL`: exact model ID shown in NVIDIA API Catalog (default is an example)
- `MONGODB_URI`: your MongoDB Atlas connection string
- `JWT_SECRET`: replace with a long random secret

Start API:
```bash
uvicorn app.main:app --reload --port 8000
```
API docs: http://localhost:8000/docs

### 2. Frontend
Open another terminal:
```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```
Open the Vite URL shown in terminal (normally http://localhost:5173).

## NVIDIA model configuration
NVIDIA hosted LLM APIs use:
- Base URL: `https://integrate.api.nvidia.com/v1`
- Chat endpoint: `/chat/completions`
- API key in `Authorization: Bearer ...`

The model identifier must be available to your NVIDIA API key. Check the NVIDIA API Catalog and set `NVIDIA_MODEL` accordingly. Some models have different feature limits; vision, tools, and context lengths are model-dependent.

## Free deployment (subject to provider limits)

### A. MongoDB Atlas
1. Create a free M0 cluster at https://www.mongodb.com/atlas.
2. Create a database user and allow your deployment provider's outbound IPs. For a hobby deployment, Atlas may require `0.0.0.0/0`; use a strong DB password and restrict access where possible.
3. Copy the Python driver connection string into `MONGODB_URI`.

### B. Backend on Render
1. Push this project to a GitHub repository.
2. In Render, create **New > Web Service**, connect the repository.
3. Set Root Directory to `backend`.
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables:
   - `NVIDIA_API_KEY`
   - `NVIDIA_MODEL`
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `FRONTEND_ORIGIN` = your deployed frontend URL
   - `DATABASE_NAME` = `nova_ai`
7. Choose the Free instance if offered. Copy the backend URL.

### C. Frontend on Render Static Site
1. Create **New > Static Site**, connect the same repository.
2. Root Directory: `frontend`
3. Build command: `npm install && npm run build`
4. Publish directory: `dist`
5. Add environment variable `VITE_API_URL` = your backend URL (no trailing slash).
6. Deploy. Then update backend `FRONTEND_ORIGIN` to the exact frontend URL and redeploy backend.

### Free-tier caveats
- Free compute can sleep, restart, have low RAM, quotas, or cold starts. Render documents that free web services spin down after 15 minutes idle and can take about a minute to wake.
- NVIDIA API access, model availability, rate limits, and any credits are governed by NVIDIA's current terms/account.
- MongoDB Atlas free cluster storage/availability limits can change. Review current Atlas pricing and limits.
- “Free deployment” does not guarantee unlimited free inference, bandwidth, uptime, or storage.

## Security checklist before public launch
- Use unique strong `JWT_SECRET` and database password.
- Keep NVIDIA key only in backend environment variables.
- Configure CORS to your exact frontend origin.
- Add rate limiting, abuse monitoring, email verification, password reset, and usage controls before opening registration publicly.
- Do not commit `.env` files.
- Review provider terms and applicable privacy requirements.

## Current scope / extension points
- Authentication and per-user chat ownership are included.
- Chat history is stored in MongoDB.
- Streaming is supported.
- This initial release does not yet execute arbitrary tools, connect OAuth apps, parse uploaded PDFs, or provide a secure code-execution sandbox. Those should be implemented as separately permissioned modules.
