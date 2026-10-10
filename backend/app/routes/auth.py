from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field
from ..db import users
from ..auth import hash_password, verify_password, create_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/register")
def register(data: RegisterRequest):
    email = data.email.lower()
    if users.find_one({"email": email}):
        raise HTTPException(409, "An account with this email already exists")
    result = users.insert_one({
        "name": data.name.strip(),
        "email": email,
        "password_hash": hash_password(data.password),
    })
    return {"token": create_token(str(result.inserted_id)), "name": data.name.strip()}

@router.post("/login")
def login(data: LoginRequest):
    user = users.find_one({"email": data.email.lower()})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(401, "Invalid email or password")
    return {"token": create_token(str(user["_id"])), "name": user["name"]}
