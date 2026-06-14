# EMO Wellness — Mental Health Companion

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI (Python) |
| AI Model | Groq API (`llama-3.3-70b-versatile` by default, Gemini via env) |
| Database | SQLite (`chatbot.db`) via SQLAlchemy |
| Auth | JWT (via `python-jose`) + bcrypt password hashing |
| Frontend | Jinja2 templates + vanilla JS modules |

---

## File Structure

### Templates (`/templates`)

| File | Route | Description |
|------|-------|-------------|
| `login.html` | `/login` | Auth page — sign in / register (standalone, no layout) |
| `layout.html` | — | Base layout: loads `base.css`, sidebar partial, all JS modules |
| `partials/sidebar.html` | — | Responsive sidebar with hamburger menu for mobile |
| `dashboard.html` | `/dashboard` | Overview: greeting, mood check-in, stats, weekly chart, quick actions, AI insights |
| `chat.html` | `/chat` | Companion Chat (Serenity): session sidebar, chat window, typing indicator, goal check-in banner |
| `journal.html` | `/journal` | Daily Journal: mood picker, write area, tag selector, recent entries |
| `refresh.html` | `/refresh` | Mental Refresh: 4 technique cards + Box Breathing, Body Scan, Gratitude Reset, Grounding 5-4-3-2-1 widgets |
| `goals.html` | `/goals` | Goals: active/resolved goal cards with check-in threads and modals |
| `insights.html` | `/insights` | Insights: mood streak, most frequent mood, AI pattern analysis, journal insights |
| `analytics.html` | `/analytics` | Mood Analytics: trend chart, mood prediction, heatmap, monthly bars, suggestions (static demo data) |


### Static JS (`/static`)

| File | Initialised by | Responsibility |
|------|---------------|----------------|
| `emo.js` | Auto (entry point) | Auth guard, shared utilities (`EMO.apiJson`, `EMO.escapeHtml`, `EMO.formatTime`, `EMO.logout`), boots all page modules |
| `emo.login.js` | `login.html` | Login / register form handling, JWT storage |
| `emo.sidebar.js` | `initSidebar()` | Populates avatar and display name from `user_id` |
| `emo.dashboard.js` | `initDashboard()` | Mood emoji click → `POST /api/mood`, mood reminder banner, pre-selects today's logged mood |
| `emo.chat.js` | `initChat()` | Session management, message send/receive, history load, sidebar, goal check-in flow |
| `emo.journal.js` | `initJournal()` | Save entry, load recent entries, open/view entry, mood-aware prompts, tag and prompt cycling |
| `emo.goals.js` | `initGoals()` | CRUD for goals, check-in redirect to chat, resolve/pause/reactivate, resolved section toggle |
| `emo.insights.js` | `initInsights()` | Loads mood insights and journal insights from API, renders streak, emoji, pattern text |
| `emo.refresh.js` | `initRefreshBreathing()` etc. | Four independent guided exercise widgets: Box Breathing, Body Scan, Gratitude Reset, Grounding |
| `base.css` | `layout.html` | All CSS variables, sidebar, topbar, buttons, cards, scrollbar, responsive breakpoints (mobile/tablet) |

### Backend (`/routes`, `/services`, `/models`)

| File | Prefix | Description |
|------|--------|-------------|
| `routes/auth.py` | `/api/auth` | `POST /register`, `POST /login` — returns JWT token + user_id |
| `routes/chat.py` | `/api` | `POST /chat`, `POST /chat/session`, `GET /chat/sessions`, `GET /chat/history` |
| `routes/mood.py` | `/api/mood` | `POST /` (upsert today's mood), `GET /latest/{user_id}`, `GET /history/{user_id}`, `GET /insights/{user_id}` |
| `routes/journal.py` | `/api/journal` | `POST /`, `GET /entry/{id}`, `GET /insights/{user_id}`, `GET /{user_id}` |
| `routes/goals.py` | `/api/goals` | `POST /`, `GET /{user_id}`, `PATCH /{id}`, `DELETE /{id}`, `POST /{id}/checkins`, `POST /{id}/checkins/summarize` |
| `services/ai_client.py` | — | `generate_chat_reply()` (Groq/Gemini/fallback), `generate_checkin_summary()` |
| `services/crisis.py` | — | Keyword-based crisis detection; returns `SAFE_RESPONSE` and `crisis=True` |
| `services/context.py` | — | Builds per-user context string (mood, goals, journal snippets) injected into AI prompt |
| `services/history.py` | — | Fetches last 10 messages for a session to pass as conversation history to the AI |
| `services/insights.py` | — | Streak calculation, most-frequent mood, AI-generated mood & journal pattern text |
| `services/suggestions.py` | — | Returns mood-based quick suggestions (used in `GET /mood/latest`) |
| `services/auth.py` | — | bcrypt hashing, JWT encode/decode |
| `models.py` | — | SQLAlchemy models: `User`, `Message`, `Mood`, `JournalEntry`, `Goal`, `GoalCheckin` |
| `schemas.py` | — | Pydantic request/response schemas |
| `database.py` | — | SQLite engine + `get_db()` dependency |
| `main.py` | — | FastAPI app, router registration, page routes, static files |

---

## API Reference

### Auth
| Method | Path | Body | Returns |
|--------|------|------|---------|
| POST | `/api/auth/register` | `{email, password}` | `{token, email, user_id}` |
| POST | `/api/auth/login` | `{email, password}` | `{token, email, user_id}` |

All subsequent requests require `Authorization: Bearer <token>` header (added automatically by `EMO.apiJson`).

### Chat
| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/chat` | `{user_id, message, session_id?, checkin_goal_id?}` — crisis check runs first |
| POST | `/api/chat/session` | Creates a new session UUID |
| GET | `/api/chat/sessions?user_id=` | Lists sessions with preview text |
| GET | `/api/chat/history?user_id=&session_id=` | Full message history |

### Mood
| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/mood` | Upserts today's mood entry per user |
| GET | `/api/mood/latest/{user_id}` | Returns most recent mood + suggestions |
| GET | `/api/mood/history/{user_id}` | Last 30 mood entries |
| GET | `/api/mood/insights/{user_id}` | Streak, most frequent mood, AI pattern text |

### Journal
| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/journal` | Creates entry with mood, tags, prompt |
| GET | `/api/journal/entry/{id}` | Single entry by ID |
| GET | `/api/journal/insights/{user_id}` | Entry count, top mood, top tags, pattern |
| GET | `/api/journal/{user_id}?limit=` | Paginated entry list |

### Goals
| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/goals` | `{user_id, title, why}` |
| GET | `/api/goals/{user_id}` | All goals with embedded check-in threads |
| PATCH | `/api/goals/{id}` | Update title, why, status, closing_note |
| DELETE | `/api/goals/{id}` | Also deletes all check-ins |
| POST | `/api/goals/{id}/checkins` | Manual check-in note |
| POST | `/api/goals/{id}/checkins/summarize?session_id=` | AI-summarises a chat session into a check-in note |

---

## Key Flows

### Chat & Goal Check-in
1. User clicks **+ Check in** on a goal → redirected to `/chat` with `checkin_goal`, `checkin_title`, `checkin_message` query params
2. `emo.chat.js` detects params, creates a new session, shows goal-aware welcome message
3. Conversation uses `checkin_goal_id` to inject goal context via `services/context.py`
4. User clicks **Save check-in** → `POST /api/goals/{id}/checkins/summarize` summarises the session with AI

### Crisis Detection
- Every `POST /api/chat` runs `keyword_crisis_detected()` before any AI call
- On detection: saves a safe response to DB with `crisis_flag=True`, returns `{crisis: true}`
- Frontend renders crisis messages with a distinct blush-coloured bubble (`.msg-bubble.crisis`)

### AI Context Injection
`services/context.py` scans the user's message for mood/goal/journal keywords and appends relevant data (latest mood, active goals, recent journal snippets) as a system message. For goal check-ins, only the specific goal and its history are injected.

### Auth Flow
- Login/register stores `emo_token` and `emo_user_id` in `localStorage`
- `emo.js` redirects to `/login` if no token is found
- All API calls via `EMO.apiJson()` attach the Bearer token; a 401 triggers logout

---

## Environment Variables (`.env`)

```
GROQ_API_KEY=...
MODEL_PROVIDER=groq           # or "gemini"
MODEL_NAME=llama-3.3-70b-versatile
GEMINI_API_KEY=...            # optional
SECRET_KEY=your-jwt-secret
```

---

## Running Locally

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

Visit `http://localhost:8000` — redirects to `/login`.

---

