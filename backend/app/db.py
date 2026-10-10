from pymongo import MongoClient
from .config import MONGO_URI, MONGO_DB

client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
db = client[MONGO_DB]

users = db["users"]
evidence = db["evidence"]

users.create_index("email", unique=True)
evidence.create_index([("owner_id", 1), ("created_at", -1)])
evidence.create_index([("owner_id", 1), ("category", 1)])
