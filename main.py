from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

import models
from database import Base, engine
from routes.chat import router as chat_router
from routes.goals import router as goals_router
from routes.journal import router as journal_router
from routes.mood import router as mood_router

app = FastAPI(title="Mental Health Chatbot API", version="1.0.0")
Base.metadata.create_all(bind=engine)


app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

app.include_router(chat_router)
app.include_router(mood_router)
app.include_router(goals_router)
app.include_router(journal_router)


def _page(request: Request, template: str, active_nav: str, user_id: str = "default"):
    return templates.TemplateResponse(
        request=request,
        name=template,
        context={"active_nav": active_nav, "user_id": user_id or "default"},
    )


@app.get("/api/health")
def api_health():
    return {
        "name": "mental-health-chatbot",
        "status": "ok",
        "message": "Open /dashboard for the app UI, or /docs for API.",
    }


@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/dashboard", status_code=302)


@app.get("/dashboard", response_class=HTMLResponse, name="page_dashboard")
def page_dashboard(request: Request, user_id: str = "default"):
    return _page(request, "dashboard.html", "dashboard", user_id)


@app.get("/chat", response_class=HTMLResponse, name="page_chat")
def page_chat(request: Request, user_id: str = "default"):
    return _page(request, "chat.html", "chat", user_id)


@app.get("/journal", response_class=HTMLResponse, name="page_journal")
def page_journal(request: Request, user_id: str = "default"):
    return _page(request, "journal.html", "journal", user_id)


@app.get("/refresh", response_class=HTMLResponse, name="page_refresh")
def page_refresh(request: Request, user_id: str = "default"):
    return _page(request, "refresh.html", "refresh", user_id)


@app.get("/stress", response_class=HTMLResponse, name="page_stress")
def page_stress(request: Request, user_id: str = "default"):
    return _page(request, "stress.html", "stress", user_id)


@app.get("/analytics", response_class=HTMLResponse, name="page_analytics")
def page_analytics(request: Request, user_id: str = "default"):
    return _page(request, "analytics.html", "analytics", user_id)

@app.get("/goals", response_class=HTMLResponse, name="page_goals")
def page_goals(request: Request, user_id: str = "default"):
    return _page(request, "goals.html", "goals", user_id)
@app.get("/insights", response_class=HTMLResponse)
def page_insights(request: Request, user_id: str = "default"):
    return templates.TemplateResponse(
        request=request,
        name="insights.html",
        context={"user_id": user_id, "active_nav": "insights"}
    )
# class ChatInput(BaseModel):
#     message: str

# client = Groq(api_key=os.getenv("GROQ_API_KEY"))


# # @app.post("/chat")
