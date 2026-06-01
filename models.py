from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from database import Base
from sqlalchemy.sql import func

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, default="default", index=True)
    role = Column(String)
    content = Column(Text)
    crisis_flag = Column(Integer, default=0)
    timestamp = Column(DateTime, default=datetime.utcnow)
class Mood(Base):
    __tablename__ = "moods"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)

    mood = Column(String)
    score = Column(Integer, default=3)
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
    user_id = Column(String, default="default", index=True)  # add this
    title = Column(String)
    description = Column(Text)
    goal_type = Column(String)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    last_checkin = Column(DateTime, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    prompt = Column(String, nullable=True) 