from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc
from sqlalchemy.orm import Session
import models
from database import get_db
from schemas import JournalCreate
from services.auth import get_current_user

router = APIRouter(prefix="/api/journal", tags=["journal"])

@router.post("")
async def create_entry(
    payload: JournalCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    entry = models.JournalEntry(
        user_id=current_user.email,  # trust the token, not payload.user_id
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
def read_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    entry = (
        db.query(models.JournalEntry)
        .filter(models.JournalEntry.id == entry_id)
        .first()
    )

    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    # This previously had no ownership check at all — any authenticated
    # request could read any entry by guessing/incrementing the id.
    if entry.user_id != current_user.email:
        raise HTTPException(status_code=403, detail="Not authorized to view this entry")

    return {
        "id": entry.id,
        "title": entry.title,
        "content": entry.content,
        "mood": entry.mood_selected,
        "tags": entry.tags,
        "timestamp": entry.timestamp,
        "prompt": entry.prompt
    }

@router.get("/insights/{user_id}")
def journal_insights(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if user_id != current_user.email:
        raise HTTPException(status_code=403, detail="Not authorized to view this user's data")

    entries = (
        db.query(models.JournalEntry)
        .filter(models.JournalEntry.user_id == user_id)
        .order_by(desc(models.JournalEntry.timestamp))
        .limit(7)
        .all()
    )
    if not entries:
        return {
            "total_entries": 0,
            "most_common_mood": None,
            "pattern": "Start journaling to see insights.",
        }

    moods = [e.mood_selected for e in entries if e.mood_selected]
    tags_raw = [t.strip() for e in entries if e.tags for t in e.tags.split(",")]

    mood_counts = {}
    for m in moods:
        mood_counts[m] = mood_counts.get(m, 0) + 1
    most_common_mood = max(mood_counts, key=mood_counts.get) if mood_counts else None

    tag_counts = {}
    for t in tags_raw:
        tag_counts[t] = tag_counts.get(t, 0) + 1
    top_tags = sorted(tag_counts, key=tag_counts.get, reverse=True)[:3]

    pattern = None
    if most_common_mood and top_tags:
        pattern = "You've been feeling {} lately, often around {}.".format(
            most_common_mood, ", ".join(top_tags)
        )
    elif most_common_mood:
        pattern = "Your most common mood this week is {}.".format(most_common_mood)
    else:
        pattern = "Log a few entries with moods to see your pattern."

    return {
        "total_entries": len(entries),
        "most_common_mood": most_common_mood,
        "top_tags": top_tags,
        "pattern": pattern,
    }

# This should be LAST
@router.get("/{user_id}")
def list_entries(
    user_id: str,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if user_id != current_user.email:
        raise HTTPException(status_code=403, detail="Not authorized to view this user's data")

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