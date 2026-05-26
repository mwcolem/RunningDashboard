from fastapi import APIRouter

import app.garmin_client as gc

router = APIRouter(prefix="/api/gear")


@router.get("/shoes")
def get_shoes():
    return gc.get_shoes()
