import os

from dotenv import load_dotenv

load_dotenv()

SYSTEM_PROMPT = """You are EMO, a compassionate mental health support companion.

Principles:
- Reflection over completion
- Support over automation
- Conversation over forms

Respond empathetically, clearly, and briefly (3-6 sentences)."""


def _fallback_reply(user_message: str) -> str:
    return (
        "Thank you for sharing this. I hear you, and your feelings are valid. "
        "Would it help to explore what made this moment hardest, and one small "
        "step that could make the next hour feel safer or lighter?"
    )


def generate_chat_reply(user_message: str, context: str,  history: list) -> str:
    provider = os.getenv("MODEL_PROVIDER", "groq").lower()
    model_name = os.getenv("MODEL_NAME", "llama-3.3-70b-versatile")

    prompt = (
        f"{SYSTEM_PROMPT}\n\n"
        f"User context:\n{context}\n\n"
        f"User message:\n{user_message}"
    )

    if provider == "groq" and os.getenv("GROQ_API_KEY"):
        from groq import Groq

        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        messages = [
        {
        "role": "system",
        "content": SYSTEM_PROMPT
        }
        ]

        
        if context.strip():
            messages.append({
                "role": "system",
                "content": f"User context:\n{context}"
            })
        

        messages.extend(history)

        messages.append({
        "role": "user",
        "content": user_message
        })

        result = client.chat.completions.create(
                model=model_name,
                messages=messages
            )

       
                
        return result.choices[0].message.content


 # Gemini placeholder for phase-based rollout; can be wired with google-genai package later.
    if provider == "gemini" and os.getenv("GEMINI_API_KEY"):
        return _fallback_reply(prompt)

    return _fallback_reply(prompt)
def generate_checkin_summary(goal_title: str, conversation: str) -> str:
    provider = os.getenv("MODEL_PROVIDER", "groq").lower()
    model_name = os.getenv("MODEL_NAME", "llama-3.3-70b-versatile")
    
    prompt = f"""The user is working on a personal goal: "{goal_title}"

Here is their check-in conversation with Serenity:

{conversation}

Write a 1-2 sentence summary of this check-in from the user's perspective. 
Focus on how they are feeling about the goal and any progress or struggles they mentioned.
Write it as a journal-style note, not a report."""

    if provider == "groq" and os.getenv("GROQ_API_KEY"):
        from groq import Groq
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        result = client.chat.completions.create(
            model=model_name,
            messages=[{"role": "user", "content": prompt}]
        )
        return result.choices[0].message.content
    
    return "Reflected on progress toward this goal."