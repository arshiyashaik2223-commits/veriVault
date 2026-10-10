from fastapi import APIRouter, Depends
from ..auth import current_user
from ..db import evidence

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats")
def stats(user=Depends(current_user)):
    docs = list(evidence.find({"owner_id": user["_id"]}))
    verified = sum(x.get("status") == "VERIFIED" for x in docs)
    tampered = sum(x.get("status") == "TAMPERED" for x in docs)
    categories = {}
    for x in docs:
        c = x.get("category", "Other")
        categories[c] = categories.get(c, 0) + 1
    return {
        "documents": len(docs),
        "verified": verified,
        "tampered": tampered,
        "categories": categories,
        "verification_rate": round((verified / len(docs)) * 100, 1) if docs else 100,
    }
