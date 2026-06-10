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
from routes.auth import router as auth_router
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware

app = FastAPI(title="Mental Health Chatbot API", version="1.0.0")
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

Base.metadata.create_all(bind=engine)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

app.include_router(chat_router)
app.include_router(mood_router)
app.include_router(goals_router)
app.include_router(journal_router)
app.include_router(auth_router)