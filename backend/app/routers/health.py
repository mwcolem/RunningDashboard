from fastapi import APIRouter

import app.garmin_client as gc

router = APIRouter(prefix="/api/health")


@router.get("/summary")
def get_summary(date: str | None = None):
    return gc.get_user_summary(date)


@router.get("/heart-rate")
def get_heart_rate(date: str | None = None):
    return gc.get_heart_rates(date)


@router.get("/hrv")
def get_hrv(date: str | None = None):
    return gc.get_hrv_data(date)


@router.get("/stress")
def get_stress(date: str | None = None):
    return gc.get_stress_data(date)


@router.get("/spo2")
def get_spo2(date: str | None = None):
    return gc.get_spo2_data(date)


@router.get("/sleep")
def get_sleep(date: str | None = None):
    return gc.get_sleep_data(date)


@router.get("/body-battery")
def get_body_battery(date: str | None = None):
    return gc.get_body_battery(date)
