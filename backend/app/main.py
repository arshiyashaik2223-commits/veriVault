from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import FRONTEND_URL
from .routes import auth, evidence, dashboard

app = FastAPI(
    title="VeriVault API",
    description="AI-powered Personal Digital Evidence Vault",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(evidence.router)
app.include_router(dashboard.router)

@app.get("/")
def root():
    return {"name": "VeriVault API", "status": "online", "message": "Your Evidence. Verified."}

@app.get("/health")
def health():
    return {"status": "healthy"}
