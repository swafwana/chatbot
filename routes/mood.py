from fastapi import APIRouter, Depends
from sqlalchemy import desc
from sqlalchemy.orm import Session
from datetime import date as date_type

import models
from database import get_db
from schemas import MoodCreate
from services.suggestions import suggestion_for_mood

router = APIRouter(prefix="/api/mood", tags=["mood"])


@router.post("")
def create_mood(payload: MoodCreate, db: Session = Depends(get_db)):
    today = payload.date or date_type.today()

    existing = (
        db.query(models.Mood)
        .filter(
            models.Mood.user_id == payload.user_id,
            models.Mood.date == today
        )
        .first()
    )

    if existing:
        existing.mood = payload.mood
        existing.note = payload.note
        db.commit()
        db.refresh(existing)
        return {"id": existing.id, "mood": existing.mood,
                "date": str(existing.date), "updated": True}

    mood = models.Mood(
        user_id=payload.user_id,
        mood=payload.mood,
        note=payload.note,
        date=today
    )
    db.add(mood)
    db.commit()
    db.refresh(mood)
    return {"id": mood.id, "mood": mood.mood,
            "date": str(mood.date), "updated": False}


@router.get("/latest/{user_id}")
def latest_mood(user_id: str, db: Session = Depends(get_db)):
    latest = (
        db.query(models.Mood)
        .filter(models.Mood.user_id == user_id)
        .order_by(desc(models.Mood.date))
        .first()
    )
    if not latest:
        return {"mood": None, "suggestions": suggestion_for_mood(None)}
    return {"mood": latest.mood, "date": str(latest.date),
            "suggestions": suggestion_for_mood(latest.mood)}


@router.get("/history/{user_id}")
def mood_history(user_id: str, limit: int = 30, db: Session = Depends(get_db)):
    entries = (
        db.query(models.Mood)
        .filter(models.Mood.user_id == user_id)
        .order_by(desc(models.Mood.date))
        .limit(limit)
        .all()
    )
    return [
        {
            "id": row.id,
            "mood": row.mood,
            "note": row.note,
            "date": str(row.date),
            "timestamp": str(row.timestamp)
        }
        for row in entries
    ]