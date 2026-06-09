from sqlalchemy import Column, Integer, String, Text, DateTime, Date
from datetime import datetime, date as date_type
from database import Base
from sqlalchemy.sql import func

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, default="default", index=True)
    role = Column(String)
    content = Column(Text)
    crisis_flag = Column(Integer, default=0)
    timestamp = Column(DateTime, default=datetime.utcnow)
    session_id = Column(String, nullable=True, index=True)
class Mood(Base):
    __tablename__ = "moods"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)

    mood = Column(String)
    note = Column(Text, nullable=True)

    date = Column(Date, default=date_type.today)
    timestamp = Column(DateTime, default=datetime.utcnow)
class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, default="default", index=True)
    title = Column(String, nullable=True)
    content = Column(Text, nullable=False)
    mood_selected = Column(String, nullable=True)
    mood_note = Column(String, nullable=True)
    ai_reflection = Column(Text, nullable=True)
    ai_mood_suggestion = Column(String, nullable=True)
    tags = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    prompt = Column(String, nullable=True)
class Goal(Base):
    __tablename__ = "goals"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, default="default", index=True)
    title = Column(String, nullable=False)
    why = Column(Text, nullable=True)
    status = Column(String, default="active")
    closing_note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class GoalCheckin(Base):
    __tablename__ = "goal_checkins"
    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, nullable=False, index=True)
    note = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)