from fastapi import APIRouter
from pydantic import BaseModel

from datetime import timezone
from zoneinfo import ZoneInfo

import app.db.db as db

pool_router = APIRouter(prefix="/api/v1", tags=["pool data"])

class PoolTemperatureEntry(BaseModel):
    id: int
    temperature: float
    reading_time: str

@pool_router.get("/pool/temperature", response_model=list[PoolTemperatureEntry])
async def get_temperature():
    with db.Database() as cur:
        cur.execute("""
            SELECT id, temperature, reading_time
            FROM pool_temperature
            WHERE CONVERT_TZ(reading_time, '+00:00', 'America/Los_Angeles')
                >= CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', 'America/Los_Angeles') - INTERVAL 4 DAY;
        """)
        rows = cur.fetchall()

    pool_temperature_list = []
    for item in rows:
        dt_utc = item[2].replace(tzinfo=timezone.utc)
        dt_pacific = dt_utc.astimezone(ZoneInfo("America/Los_Angeles"))
        pool_temperature_list.append(PoolTemperatureEntry(id=item[0], temperature=float(item[1]), reading_time=str(dt_pacific)))

    return pool_temperature_list