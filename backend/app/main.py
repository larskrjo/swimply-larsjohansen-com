from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.job.data_worker import DataWorker
from app.api.pool_temperature_api import *

app = FastAPI()

app.include_router(pool_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DataWorker.start()