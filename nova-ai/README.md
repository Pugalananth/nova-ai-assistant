# NOVA AI — Neon PostgreSQL edition

NOVA AI is a Claude-inspired starter assistant with a React/TypeScript frontend, FastAPI backend, NVIDIA hosted chat API, and Neon PostgreSQL persistence.

## Local development

### Backend (Windows PowerShell)
```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```
Set `NVIDIA_API_KEY`, `NVIDIA_MODEL`, `DATABASE_URL`, and a strong `JWT_SECRET` in `backend/.env`.

For Neon, use a SQLAlchemy async URL:
`postgresql+asyncpg://USER:PASSWORD@HOST/DBNAME?ssl=require`
Use the host, database, username and newly rotated password from Neon. Remove any `channel_binding` query parameter if the async driver reports it as unsupported.

Start:
```powershell
uvicorn app.main:app --reload --port 8000
```

### Frontend
```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```
Set `VITE_API_URL=http://localhost:8000` in `frontend/.env`.

## Neon
Create a free project at https://console.neon.tech/. In Connect, copy the connection details. If credentials have been exposed, reset the database role password before use. The backend creates the users, conversations, and messages tables at startup.

## Render deployment
Backend Web Service:
- Root directory: `backend`
- Build: `pip install -r requirements.txt`
- Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Environment variables: `NVIDIA_API_KEY`, `NVIDIA_MODEL`, `NVIDIA_BASE_URL`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRE_MINUTES=10080`, `FRONTEND_ORIGIN`

Frontend Static Site:
- Root directory: `frontend`
- Build: `npm install && npm run build`
- Publish directory: `dist`
- Environment variable: `VITE_API_URL` = backend URL.

After deploying frontend, set backend `FRONTEND_ORIGIN` to the exact frontend URL and redeploy backend.

## Security and scope
Never commit `.env` files or expose secrets in browser code or GitHub. This starter includes registration/login, hashed passwords, per-user conversation history, deletion, and streaming chat. PDF parsing, web search, OAuth integrations, MCP execution, and sandboxed code execution are not implemented yet. Add rate limiting, email verification, password reset, monitoring, and a security review before public production use.
