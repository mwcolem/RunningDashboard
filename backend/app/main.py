import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from garminconnect import GarminConnectAuthenticationError, GarminConnectTooManyRequestsError

import app.garmin_client as gc
from app.config import get_settings
from app.routers import activities, health


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        gc.get_client()
    except Exception as e:
        logging.getLogger(__name__).warning("Garmin login failed at startup: %s — will retry on first request", e)
    yield


settings = get_settings()

app = FastAPI(title="Garmin Running Dashboard", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(activities.router)
app.include_router(health.router)


@app.exception_handler(GarminConnectTooManyRequestsError)
async def too_many_requests_handler(request: Request, exc: GarminConnectTooManyRequestsError):
    return JSONResponse(status_code=429, content={"detail": "Garmin rate limit hit — try again later"})


@app.exception_handler(GarminConnectAuthenticationError)
async def auth_error_handler(request: Request, exc: GarminConnectAuthenticationError):
    return JSONResponse(status_code=401, content={"detail": "Garmin authentication failed"})


@app.get("/api/ping")
def ping():
    return {"status": "ok"}
