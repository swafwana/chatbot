from sqlalchemy import desc
from sqlalchemy.orm import Session

import models
MOOD_KEYWORDS = ["feel", "feeling", "mood", "anxious", "sad", "happy", "stressed", "overwhelmed", "emotion", "nervous", "angry", "frustrated", "lonely", "depressed"]
GOAL_KEYWORDS = ["goal", "goals", "progress", "achieve", "working on", "habit", "plan", "target"]
JOURNAL_KEYWORDS = ["journal", "wrote", "entry", "remember", "last time", "recently", "before", "yesterday", "last week"]



def build_user_context(db: Session, user_id: str, user_message: str = "",checkin_goal_id: int = None) -> str:
    message_lower = user_message.lower()
    sections = []
    if checkin_goal_id:
        goal = db.query(models.Goal).filter(models.Goal.id == checkin_goal_id).first()
        if goal:
            checkins = db.query(models.GoalCheckin).filter(
                models.GoalCheckin.goal_id == checkin_goal_id
            ).order_by(models.GoalCheckin.created_at.asc()).all()
            
            checkin_history = "\n".join([f"- {c.note}" for c in checkins]) or "No previous check-ins yet."
            
            return (
                f"The user is checking in on this specific goal: {goal.title}\n"
                f"Why they set it: {goal.why or 'not specified'}\n"
                f"Previous check-ins:\n{checkin_history}\n\n"
                f"Focus only on this goal. Do not mention other goals."
            )
   

    if any(word in message_lower for word in MOOD_KEYWORDS):
        latest_mood = (
            db.query(models.Mood)
            .filter(models.Mood.user_id == user_id)
            .order_by(desc(models.Mood.timestamp))
            .first()
        )
        if latest_mood:
            sections.append(f"User mood: {latest_mood.mood}")

    if any(word in message_lower for word in GOAL_KEYWORDS):
        active_goals = (
            db.query(models.Goal)
            .filter(models.Goal.user_id == user_id, models.Goal.status == "active")
            .order_by(desc(models.Goal.created_at))
            .limit(3)
            .all()
        )
        if active_goals:
            goals_text = ", ".join(goal.title for goal in active_goals)
            sections.append(f"Active goals: {goals_text}")

    if any(word in message_lower for word in JOURNAL_KEYWORDS):
        recent_journal = (
            db.query(models.JournalEntry)
            .filter(models.JournalEntry.user_id == user_id)
            .order_by(desc(models.JournalEntry.timestamp))
            .limit(3)
            .all()
        )
        if recent_journal:
            journal_text = " | ".join(entry.content[:120] for entry in recent_journal)
            sections.append(f"Recent journal snippets: {journal_text}")

    return "\n".join(sections)