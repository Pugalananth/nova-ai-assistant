from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .db import connect_db, close_db
from .auth import router as auth_router
from .chat import router as chat_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await connect_db()
    except Exception as exc:
        print(f"MongoDB connection failed: {exc}")
    yield
    await close_db()

app = FastAPI(title="NOVA AI API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)
app.include_router(chat_router)

@app.get("/")
async def root():
    return {"name": "NOVA AI API", "status": "online"}

@app.get("/health")
async def health():
    return {"status": "ok"}
