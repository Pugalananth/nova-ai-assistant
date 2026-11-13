from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from .db import get_db, User
from .schemas import RegisterRequest, LoginRequest
from .security import hash_password, verify_password, create_access_token, decode_access_token

router = APIRouter(prefix="/api/auth", tags=["authentication"])
bearer = HTTPBearer(auto_error=False)

async def current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer),
                       session: AsyncSession = Depends(get_db)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    user_id = decode_access_token(credentials.credentials)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.post("/register")
async def register(body: RegisterRequest, session: AsyncSession = Depends(get_db)):
    email = body.email.lower()
    existing = await session.scalar(select(User).where(User.email == email))
    if existing:
        raise HTTPException(409, "An account with this email already exists")
    user = User(id=str(uuid4()), email=email, password_hash=hash_password(body.password))
    session.add(user)
    await session.commit()
    return {"access_token": create_access_token(user.id), "token_type": "bearer", "email": email}

@router.post("/login")
async def login(body: LoginRequest, session: AsyncSession = Depends(get_db)):
    user = await session.scalar(select(User).where(User.email == body.email.lower()))
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Incorrect email or password")
    return {"access_token": create_access_token(user.id), "token_type": "bearer", "email": user.email}

@router.get("/me")
async def me(user=Depends(current_user)):
    return {"email": user.email}
