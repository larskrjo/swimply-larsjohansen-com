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
            FROM pool_data
            WHERE CONVERT_TZ(reading_time, 'UTC', 'America/Los_Angeles')
                  >= DATE_SUB(CONVERT_TZ(CURDATE(), 'UTC', 'America/Los_Angeles'), INTERVAL 14 DAY)
              AND CONVERT_TZ(reading_time, 'UTC', 'America/Los_Angeles')
                  <  CONVERT_TZ(CURDATE(), 'UTC', 'America/Los_Angeles');
        """);
        rows = cur.fetchall()

    pool_temperature_list = []
    for item in rows:
        dt_utc = item[2].replace(tzinfo=timezone.utc)
        dt_pacific = dt_utc.astimezone(ZoneInfo("America/Los_Angeles"))
        pool_temperature_list.append(PoolTemperatureEntry(id=item[0], temperature=float(item[1]), reading_time=str(dt_pacific)))

    return pool_temperature_list