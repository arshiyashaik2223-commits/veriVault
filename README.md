# VeriVault — Full-Stack Starter

**Secure What Matters. Prove It Always.**

VeriVault is a full-stack starter for an AI-powered Personal Digital Evidence Vault.

## Included

- React + Vite frontend
- FastAPI backend
- MongoDB persistence
- JWT authentication
- Evidence upload
- SHA-256 cryptographic fingerprints
- Tamper verification
- Automatic local document classification
- Evidence timeline
- Search/filter dashboard
- Warranty/renewal reminder fields
- Permission-ready evidence model
- `.env.example` — no secrets included
- Docker Compose for MongoDB + backend

## Important security note

This is a hackathon-ready starter, not a production security certification. For production, add object storage, antivirus scanning, stronger secret management, HTTPS, rate limiting, audit logs, encrypted-at-rest storage, and a production-grade identity provider.

## 1. Start MongoDB

Option A — Docker:

```bash
docker compose up -d mongodb
```

Option B — local MongoDB:

Make sure MongoDB is running on `mongodb://localhost:27017`.

## 2. Backend

Windows:

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy ..\.env.example .env
uvicorn app.main:app --reload --port 8000
```

macOS/Linux:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

## 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open: http://localhost:5173

## 4. Optional external AI

The application works with local classification by default. To connect an AI provider, configure the AI variables in `.env` and extend `backend/app/services/classifier.py`.

No API key is hardcoded in this repository.

## Evidence integrity

On upload, VeriVault reads the file bytes and creates a SHA-256 hash. The original hash is stored with the evidence record. Verification recomputes the current file hash and compares it with the recorded fingerprint.

Architecture:

DOCUMENT → AI/LOCAL EXTRACTION → METADATA → SHA-256 HASH → TIMESTAMP → EVIDENCE VAULT → VERIFICATION
