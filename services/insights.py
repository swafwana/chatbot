from sqlalchemy.orm import Session
from datetime import date, timedelta
from collections import Counter
import models
from services.ai_client import generate_chat_reply


def calculate_streak(entries: list) -> int:
    if not entries:
        return 0

    streak = 0
    check_date = date.today()

    dates = {e.date for e in entries}

    while check_date in dates:
        streak += 1
        check_date -= timedelta(days=1)

    return streak


def calculate_most_frequent(entries: list) -> str | None:
    if not entries:
        return None
    last_7 = [e.mood for e in entries if e.date >= date.today() - timedelta(days=7)]
    if not last_7:
        return None
    return Counter(last_7).most_common(1)[0][0]


def generate_mood_pattern(entries: list) -> str:
    if not entries:
        return "No mood data yet — start logging to see patterns."

    summary = "\n".join(
        f"{e.date}: {e.mood}" + (f" — {e.note}" if e.note else "")
        for e in entries[:14]
    )

    prompt = f"""Here are a user's mood logs from the past two weeks:

{summary}

Write 2 sentences max. Be warm, specific, and human. Mention any pattern you notice — 
time-based, trend-based, or emotional. Don't use bullet points or headers. 
Don't be generic. Speak directly to the user as 'you'."""

    return generate_chat_reply(prompt, context="", history=[])