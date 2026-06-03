from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models
from database import get_db
from schemas import ChatInput, ChatOutput, SessionCreate
from services.ai_client import generate_chat_reply
from services.context import build_user_context
from services.crisis import SAFE_RESPONSE, keyword_crisis_detected
from uuid import uuid4
from services.history import build_chat_history

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatOutput)
def chat(data: ChatInput, db: Session = Depends(get_db)):

    # 1. build history first
    history = build_chat_history(db, data.user_id, data.session_id)

    # 2. save user message
    db.add(models.Message(user_id=data.user_id, role="user", content=data.message, session_id=data.session_id))
    db.commit()

    # 3. crisis check
    if keyword_crisis_detected(data.message):
        db.add(models.Message(
            user_id=data.user_id,
            role="bot",
            content=SAFE_RESPONSE,
            crisis_flag=True,
            session_id=data.session_id
        ))
        db.commit()
        return ChatOutput(response=SAFE_RESPONSE, crisis=True)

    # 4. build context
    context = build_user_context(db, data.user_id, user_message=data.message)
    print(history)

    # 5. generate reply
    reply = generate_chat_reply(data.message, context, history)

    # 6. save bot reply
    db.add(models.Message(user_id=data.user_id, role="bot", content=reply, session_id=data.session_id))
    db.commit()

    return ChatOutput(response=reply, crisis=False)
@router.post("/chat/session")
def create_session(data: SessionCreate, db: Session = Depends(get_db)):
    return {"session_id": str(uuid4())}

@router.get("/chat/sessions")
def get_sessions(user_id: str = "default", db: Session = Depends(get_db)):
    sessions = db.query(models.Message)\
        .filter(models.Message.user_id == user_id,
                models.Message.session_id != None,
                models.Message.role == "user")\
        .order_by(models.Message.timestamp.desc()).all()
    seen = {}
    for m in sessions:
        if m.session_id not in seen:
            seen[m.session_id] = {"session_id": m.session_id, "preview": m.content[:60], "timestamp": str(m.timestamp)}
    return list(seen.values())

@router.get("/chat/history")
def get_history(user_id: str = "default", session_id: str = None, db: Session = Depends(get_db)):
    query = db.query(models.Message).filter(models.Message.user_id == user_id)
    if session_id:
        query = query.filter(models.Message.session_id == session_id)
    messages = query.order_by(models.Message.timestamp.asc()).all()
    return [{"role": m.role, "content": m.content, "timestamp": str(m.timestamp)} for m in messages]