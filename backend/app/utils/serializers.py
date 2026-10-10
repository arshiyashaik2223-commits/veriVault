from bson import ObjectId

def serialize_evidence(doc):
    return {
        "id": str(doc["_id"]),
        "owner_id": str(doc["owner_id"]),
        "filename": doc["filename"],
        "category": doc.get("category", "Other"),
        "description": doc.get("description", ""),
        "file_size": doc.get("file_size", 0),
        "sha256": doc["sha256"],
        "created_at": doc["created_at"].isoformat(),
        "verified_at": doc.get("verified_at").isoformat() if doc.get("verified_at") else None,
        "status": doc.get("status", "VERIFIED"),
        "warranty_until": doc.get("warranty_until"),
        "tags": doc.get("tags", []),
    }
