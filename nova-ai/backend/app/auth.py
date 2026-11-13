from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from . import db as database
from .schemas import RegisterRequest, LoginRequest
from .security import hash_password, verify_password, create_access_token, decode_access_token

router = APIRouter(prefix="/api/auth", tags=["authentication"])
bearer = HTTPBearer(auto_error=False)

async def current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    if not credentials or not database.db:
        raise HTTPException(status_code=401, detail="Authentication required")
    user_id = decode_access_token(credentials.credentials)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = await database.db.users.find_one({"_id": user_id}, {"password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.post("/register")
async def register(body: RegisterRequest):
    if not database.db:
        raise HTTPException(503, "Database is not configured")
    email = body.email.lower()
    if await database.db.users.find_one({"email": email}):
        raise HTTPException(409, "An account with this email already exists")
    from uuid import uuid4
    user = {"_id": str(uuid4()), "email": email, "password_hash": hash_password(body.password)}
    await database.db.users.insert_one(user)
    return {"access_token": create_access_token(user["_id"]), "token_type": "bearer", "email": email}

@router.post("/login")
async def login(body: LoginRequest):
    if not database.db:
        raise HTTPException(503, "Database is not configured")
    user = await database.db.users.find_one({"email": body.email.lower()})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(401, "Incorrect email or password")
    return {"access_token": create_access_token(user["_id"]), "token_type": "bearer", "email": user["email"]}

@router.get("/me")
async def me(user=Depends(current_user)):
    return {"email": user["email"]}
