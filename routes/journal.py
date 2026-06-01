from fastapi import APIRouter, Depends
from sqlalchemy import desc
from sqlalchemy.orm import Session
import models
from database import get_db
from schemas import JournalCreate

router = APIRouter(prefix="/api/journal", tags=["journal"])

@router.post("")
async def create_entry(payload: JournalCreate, db: Session = Depends(get_db)):
    entry = models.JournalEntry(
        user_id=payload.user_id,
        title=payload.title,
        content=payload.content,
        mood_selected=payload.mood_selected,
        mood_note=payload.mood_note,
        tags=payload.tags,
        prompt=payload.prompt,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {"id": entry.id, "timestamp": entry.timestamp}

# ✅ MOVE THIS ABOVE the /{user_id} route
@router.get("/entry/{entry_id}")
def read_entry(entry_id: int, db: Session = Depends(get_db)):
    entry = (
        db.query(models.JournalEntry)
        .filter(models.JournalEntry.id == entry_id)
        .first()
    )

    if not entry:
        return {"error": "Entry not found"}

    return {
        "id": entry.id,
        "title": entry.title,
        "content": entry.content,
        "mood": entry.mood_selected,
        "tags": entry.tags,
        "timestamp": entry.timestamp,
        "prompt": entry.prompt
    }

# This should be LAST
@router.get("/{user_id}")
def list_entries(user_id: str, limit: int = 10, db: Session = Depends(get_db)):
    entries = (
        db.query(models.JournalEntry)
        .filter(models.JournalEntry.user_id == user_id)
        .order_by(desc(models.JournalEntry.timestamp))
        .limit(limit)
        .all()
    )
    return [
        {
            "id": row.id,
            "content": row.content,
            "mood": row.mood_selected,
            "tags": row.tags,
            "timestamp": row.timestamp
        }
        for row in entries
    ]