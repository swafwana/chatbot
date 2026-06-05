from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc
from sqlalchemy.orm import Session
from datetime import datetime

import models
from database import get_db
from schemas import GoalCreate, GoalCheckinUpdate

router = APIRouter(prefix="/api/goals", tags=["goals"])


@router.post("")
def create_goal(payload: GoalCreate, db: Session = Depends(get_db)):
    active_count = (
        db.query(models.Goal)
        .filter(
            models.Goal.user_id == payload.user_id,
            models.Goal.state != "completed"
        )
        .count()
    )
    if active_count >= 5:
        raise HTTPException(
            status_code=400,
            detail="You already have 5 active goals. Complete or pause one before adding a new one."
        )

    goal = models.Goal(
        user_id=payload.user_id,
        title=payload.title,
        description=payload.description,
        goal_type=payload.goal_type,
        why=payload.why,
        state="in_progress"
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return {"id": goal.id, "title": goal.title, "state": goal.state}


@router.get("/{user_id}")
def list_goals(user_id: str, db: Session = Depends(get_db)):
    goals = (
        db.query(models.Goal)
        .filter(models.Goal.user_id == user_id)
        .order_by(desc(models.Goal.created_at))
        .all()
    )
    return [
        {
            "id": row.id,
            "title": row.title,
            "description": row.description,
            "goal_type": row.goal_type,
            "state": row.state,
            "why": row.why,
            "created_at": str(row.created_at),
            "last_checkin": str(row.last_checkin) if row.last_checkin else None,
            "checkin_note": row.checkin_note
        }
        for row in goals
    ]


@router.patch("/{goal_id}/checkin")
def checkin_goal(goal_id: int, payload: GoalCheckinUpdate, db: Session = Depends(get_db)):
    goal = db.query(models.Goal).filter(models.Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    goal.state = payload.state
    goal.checkin_note = payload.checkin_note
    goal.last_checkin = datetime.utcnow()
    db.commit()
    db.refresh(goal)
    return {"id": goal.id, "state": goal.state, "last_checkin": str(goal.last_checkin)}


@router.patch("/{goal_id}/state")
def update_state(goal_id: int, payload: GoalCheckinUpdate, db: Session = Depends(get_db)):
    goal = db.query(models.Goal).filter(models.Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_call=404, detail="Goal not found")

    goal.state = payload.state
    db.commit()
    db.refresh(goal)
    return {"id": goal.id, "state": goal.state}


@router.delete("/{goal_id}")
def delete_goal(goal_id: int, db: Session = Depends(get_db)):
    goal = db.query(models.Goal).filter(models.Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    db.delete(goal)
    db.commit()
    return {"deleted": True, "id": goal_id}