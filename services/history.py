from sqlalchemy.orm import Session
import models


def build_chat_history(
    db: Session,
    user_id: str,
    session_id: str,
    limit: int = 10
):
    messages = (
        db.query(models.Message)
        .filter(
            models.Message.user_id == user_id,
            models.Message.session_id == session_id
        )
        .order_by(models.Message.timestamp.desc())
        .limit(limit)
        .all()
    )

    messages.reverse()

    history = []

    for msg in messages:

        role = msg.role

        if role == "bot":
            role = "assistant"

        history.append({
            "role": role,
            "content": msg.content
        })

    return history