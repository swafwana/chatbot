from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc
from sqlalchemy.orm import Session
from datetime import datetime

import models
from database import get_db
from schemas import GoalCreate, GoalUpdate, GoalCheckinCreate
from services.ai_client import generate_checkin_summary

router = APIRouter(prefix="/api/goals", tags=["goals"])


@router.post("")
def create_goal(payload: GoalCreate, db: Session = Depends(get_db)):
    goal = models.Goal(
        user_id=payload.user_id,
        title=payload.title,
        why=payload.why,
        status="active"
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return {"id": goal.id, "title": goal.title, "status": goal.status}


@router.get("/{user_id}")
def list_goals(user_id: str, db: Session = Depends(get_db)):
    goals = (
        db.query(models.Goal)
        .filter(models.Goal.user_id == user_id)
        .order_by(desc(models.Goal.created_at))
        .all()
    )
    result = []
    for goal in goals:
        checkins = (
            db.query(models.GoalCheckin)
            .filter(models.GoalCheckin.goal_id == goal.id)
            .order_by(models.GoalCheckin.created_at.asc())
            .all()
        )
        result.append({
            "id": goal.id,
            "title": goal.title,
            "why": goal.why,
            "status": goal.status,
            "closing_note": goal.closing_note,
            "created_at": str(goal.created_at),
            "checkins": [
                {"id": c.id, "note": c.note, "created_at": str(c.created_at)}
                for c in checkins
            ]
        })
    return result


@router.patch("/{goal_id}")
def update_goal(goal_id: int, payload: GoalUpdate, db: Session = Depends(get_db)):
    goal = db.query(models.Goal).filter(models.Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    if payload.title is not None:
        goal.title = payload.title
    if payload.why is not None:
        goal.why = payload.why
    if payload.status is not None:
        goal.status = payload.status
    if payload.closing_note is not None:
        goal.closing_note = payload.closing_note
    db.commit()
    db.refresh(goal)
    return {"id": goal.id, "status": goal.status}


@router.post("/{goal_id}/checkins")
def add_checkin(goal_id: int, payload: GoalCheckinCreate, db: Session = Depends(get_db)):
    goal = db.query(models.Goal).filter(models.Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    checkin = models.GoalCheckin(
        goal_id=goal_id,
        note=payload.note
    )
    db.add(checkin)
    db.commit()
    db.refresh(checkin)
    return {"id": checkin.id, "goal_id": goal_id, "created_at": str(checkin.created_at)}


@router.delete("/{goal_id}")
def delete_goal(goal_id: int, db: Session = Depends(get_db)):
    goal = db.query(models.Goal).filter(models.Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.query(models.GoalCheckin).filter(models.GoalCheckin.goal_id == goal_id).delete()
    db.delete(goal)
    db.commit()
    return {"deleted": True, "id": goal_id}


@router.post("/{goal_id}/checkins/summarize")
def summarize_and_save_checkin(goal_id: int, db: Session = Depends(get_db), session_id: str = None):
    goal = db.query(models.Goal).filter(models.Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    messages = (
        db.query(models.Message)
        .filter(models.Message.session_id == session_id)
        .order_by(models.Message.timestamp.asc())
        .all()
    )
    
    conversation = "\n".join([f"{m.role}: {m.content}" for m in messages])
    summary = generate_checkin_summary(goal.title, conversation)
    
    checkin = models.GoalCheckin(goal_id=goal_id, note=summary)
    db.add(checkin)
    db.commit()
    db.refresh(checkin)
    return {"id": checkin.id, "note": summary, "created_at": str(checkin.created_at)}