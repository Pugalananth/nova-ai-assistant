from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings

client = None
db = None

async def connect_db():
    global client, db
    if settings.mongodb_uri:
        client = AsyncIOMotorClient(settings.mongodb_uri, serverSelectionTimeoutMS=5000)
        db = client[settings.database_name]
        await db.command("ping")
        await db.users.create_index("email", unique=True)
        await db.conversations.create_index([("user_id", 1), ("updated_at", -1)])
    else:
        print("WARNING: MONGODB_URI is empty; database features are unavailable.")

async def close_db():
    global client
    if client:
        client.close()
