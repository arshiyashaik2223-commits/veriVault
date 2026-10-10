
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from bson import ObjectId
from bson.errors import InvalidId

from ..auth import current_user
from ..config import UPLOAD_DIR
from ..db import evidence
from ..services.hash_service import sha256_file
from ..services.classifier import extract_metadata
from ..utils.serializers import serialize_evidence

router = APIRouter(prefix="/api/evidence", tags=["Evidence"])

ALLOWED = {".pdf", ".png", ".jpg", ".jpeg", ".webp", ".txt", ".doc", ".docx"}
MAX_SIZE = 15 * 1024 * 1024


@router.post("/upload")
async def upload_evidence(
    file: UploadFile = File(...),
    description: str = Form(""),
    warranty_until: str = Form(""),
    tags: str = Form(""),
    user=Depends(current_user),
):
    ext = Path(file.filename or "").suffix.lower()

    if ext not in ALLOWED:
        raise HTTPException(
            400,
            f"Unsupported file type. Allowed: {', '.join(sorted(ALLOWED))}"
        )

    safe_name = f"{uuid4().hex}{ext}"
    path = UPLOAD_DIR / safe_name
    size = 0

    try:
        with path.open("wb") as out:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)

                if size > MAX_SIZE:
                    raise HTTPException(413, "File is larger than 15 MB")

                out.write(chunk)

        sha = sha256_file(path)
        metadata = extract_metadata(file.filename or "", description)
        now = datetime.now(timezone.utc)

        doc = {
            "owner_id": user["_id"],
            "filename": file.filename,
            "stored_name": safe_name,
            "content_type": file.content_type or "application/octet-stream",
            "file_size": size,
            "description": description,
            "category": metadata["category"],
            "sha256": sha,
            "created_at": now,
            "verified_at": now,
            "status": "VERIFIED",
            "warranty_until": warranty_until or None,
            "tags": [x.strip() for x in tags.split(",") if x.strip()],
        }

        result = evidence.insert_one(doc)
        doc["_id"] = result.inserted_id

        return serialize_evidence(doc)

    except Exception:
        path.unlink(missing_ok=True)
        raise


@router.get("")
def list_evidence(
    q: str = "",
    category: str = "",
    user=Depends(current_user),
):
    query = {"owner_id": user["_id"]}

    if category and category != "All":
        query["category"] = category

    if q:
        query["$or"] = [
            {"filename": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"tags": {"$regex": q, "$options": "i"}},
        ]

    return [
        serialize_evidence(doc)
        for doc in evidence.find(query).sort("created_at", -1)
    ]


@router.get("/{evidence_id}/verify")
def verify_evidence(
    evidence_id: str,
    user=Depends(current_user),
):
    try:
        object_id = ObjectId(evidence_id)
    except InvalidId:
        raise HTTPException(400, "Invalid evidence ID")

    doc = evidence.find_one({
        "_id": object_id,
        "owner_id": user["_id"],
    })

    if not doc:
        raise HTTPException(404, "Evidence not found")

    path = UPLOAD_DIR / doc["stored_name"]

    if not path.is_file():
        return {
            "verified": False,
            "status": "FILE_MISSING",
            "message": "Stored evidence file is missing",
        }

    current_hash = sha256_file(path)
    verified = current_hash == doc["sha256"]
    now = datetime.now(timezone.utc)

    evidence.update_one(
        {"_id": doc["_id"]},
        {
            "$set": {
                "verified_at": now,
                "status": "VERIFIED" if verified else "TAMPERED",
            }
        },
    )

    return {
        "verified": verified,
        "status": "VERIFIED" if verified else "TAMPERED",
        "original_sha256": doc["sha256"],
        "current_sha256": current_hash,
        "verified_at": now.isoformat(),
    }


@router.get("/{evidence_id}/file")
def get_evidence_file(
    evidence_id: str,
    user=Depends(current_user),
):
    try:
        object_id = ObjectId(evidence_id)
    except InvalidId:
        raise HTTPException(400, "Invalid evidence ID")

    doc = evidence.find_one({
        "_id": object_id,
        "owner_id": user["_id"],
    })

    if not doc:
        raise HTTPException(404, "Evidence not found")

    path = (UPLOAD_DIR / doc["stored_name"]).resolve()

    # Ensure the resolved file stays inside the upload directory.
    upload_root = UPLOAD_DIR.resolve()

    if not path.is_relative_to(upload_root):
        raise HTTPException(400, "Invalid stored file path")

    if not path.is_file():
        raise HTTPException(404, "Stored evidence file is missing")

    return FileResponse(
        path=path,
        media_type=doc.get("content_type") or "application/octet-stream",
        filename=Path(doc["filename"]).name,
        content_disposition_type="inline",
    )


@router.delete("/{evidence_id}")
def delete_evidence(
    evidence_id: str,
    user=Depends(current_user),
):
    try:
        object_id = ObjectId(evidence_id)
    except InvalidId:
        raise HTTPException(400, "Invalid evidence ID")

    doc = evidence.find_one({
        "_id": object_id,
        "owner_id": user["_id"],
    })

    if not doc:
        raise HTTPException(404, "Evidence not found")

    (UPLOAD_DIR / doc["stored_name"]).unlink(missing_ok=True)
    evidence.delete_one({"_id": doc["_id"]})

    return {"message": "Evidence deleted"}