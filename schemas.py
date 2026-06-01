from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field

GoalType = Literal["wellbeing", "life", "micro"]
GoalStatus = Literal["active", "completed", "abandoned"]

class ChatInput(BaseModel):
    user_id: str = Field(default="default", min_length=1)
    message: str = Field(min_length=1)
    include_context: bool = False  # your addition ✅
    session_id: Optional[str] = None  

class ChatOutput(BaseModel):
    response: str
    crisis: bool = False

class MoodCreate(BaseModel):
    user_id: str = Field(default="default", min_length=1)
    mood: str = Field(min_length=1)
    score: int = Field(default=3, ge=1, le=5)  # your addition ✅
    note: Optional[str] = None

class JournalCreate(BaseModel):
    user_id: str = Field(default="default", min_length=1)
    title: Optional[str] = None
    content: str = Field(min_length=1)
    mood_selected: Optional[str] = None
    mood_note: Optional[str] = None
    tags: Optional[str] = None
    prompt: Optional[str] = None

class GoalCreate(BaseModel):
    user_id: str = Field(default="default", min_length=1)
    title: str = Field(min_length=1)
    description: Optional[str] = None
    goal_type: GoalType = "wellbeing"

class GoalCheckinUpdate(BaseModel):
    status: GoalStatus = "active"
    progress_note: Optional[str] = None
    last_checkin: datetime = Field(default_factory=datetime.utcnow)

class SessionCreate(BaseModel):
    user_id: str = Field(default="default", min_length=1)
