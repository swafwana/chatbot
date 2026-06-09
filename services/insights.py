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

def generate_journal_insights(entries: list) -> dict:
    if not entries:
        return {
            "total_entries": 0,
            "most_common_mood": None,
            "pattern": "No journal entries yet — start writing to see insights.",
            "mood_counts": {}
        }

    # Count moods
    moods = [e.mood_selected for e in entries if e.mood_selected]
    mood_counts = dict(Counter(moods)) if moods else {}

    # Most common mood
    most_common = Counter(moods).most_common(1)[0][0] if moods else None

    # Basic fallback pattern (before AI)
    pattern = ""

    if mood_counts.get("sad", 0) >= 3:
        pattern = "You’ve had several low mood entries recently. It might help to slow down and take care of yourself."
    elif mood_counts.get("happy", 0) >= 3:
        pattern = "Your entries show a generally positive emotional pattern recently."
    elif mood_counts:
        pattern = "Your moods are mixed, suggesting emotional variation across days."
    else:
        pattern = "Not enough mood data to detect a clear pattern."

    # Optional AI enhancement (uses your existing AI function)
    summary_text = "\n".join(
        f"- {e.timestamp.date()}: {e.content[:100]}"
        for e in entries[:7]
    )

    ai_prompt = f"""
You are analyzing a user's journal entries.

Entries:
{summary_text}

Mood distribution:
{mood_counts}

Give 2 short, human, supportive insights about the user's emotional state and thinking patterns.
Be specific. Avoid generic mental health advice.
Speak directly to the user as "you".
Max 2-3 sentences total.
"""

    ai_pattern = generate_chat_reply(ai_prompt, context="", history=[])

    return {
        "total_entries": len(entries),
        "most_common_mood": most_common,
        "mood_counts": mood_counts,
        "pattern": ai_pattern or pattern
    }