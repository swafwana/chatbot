from sqlalchemy import desc
from sqlalchemy.orm import Session

import models
MOOD_KEYWORDS = ["feel", "feeling", "mood", "anxious", "sad", "happy", "stressed", "overwhelmed", "emotion", "nervous", "angry", "frustrated", "lonely", "depressed"]
GOAL_KEYWORDS = ["goal", "goals", "progress", "achieve", "working on", "habit", "plan", "target"]
JOURNAL_KEYWORDS = ["journal", "wrote", "entry", "remember", "last time", "recently", "before", "yesterday", "last week"]



def build_user_context(db: Session, user_id: str, user_message: str = "") -> str:
    message_lower = user_message.lower()
    sections = []

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