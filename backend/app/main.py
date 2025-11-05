from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.job.data_worker import DataWorker
from app.api.pool_temperature_api import *

import os

if os.getenv("DEVELOPMENT_MODE") == "prod":
    allowed_origins = "https://swimply.larsjohansen.com"
else:
    allowed_origins = "http://localhost:5173"

app = FastAPI()

app.include_router(pool_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[allowed_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DataWorker.start()