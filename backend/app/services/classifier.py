from pathlib import Path

CATEGORIES = {
    "Invoice": ["invoice", "bill", "receipt", "purchase", "order"],
    "Warranty": ["warranty", "guarantee"],
    "Certificate": ["certificate", "certification", "degree", "diploma"],
    "Agreement": ["agreement", "contract", "terms", "lease"],
    "Repair": ["repair", "service", "maintenance"],
    "Insurance": ["insurance", "policy", "claim"],
}

def classify_document(filename: str, description: str = "") -> str:
    text = f"{filename} {description}".lower()
    for category, words in CATEGORIES.items():
        if any(word in text for word in words):
            return category
    return "Other"

def extract_metadata(filename: str, description: str = "") -> dict:
    return {
        "category": classify_document(filename, description),
        "extraction_mode": "local-rule-based",
    }
