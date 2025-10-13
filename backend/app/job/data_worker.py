# app/job/data_worker.py
import json
import logging
import threading
import time
from datetime import datetime

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

import app.constants as constants
import app.db.db as db

log = logging.getLogger(__name__)

UBIBOT_URL = "https://webapi.ubibot.com/channels/104075"
UBIBOT_KEY = "bbb665991ad27e823cf2d61a491946fd"


def _session_with_retry() -> requests.Session:
    retry = Retry(
        total=6,
        backoff_factor=0.8,
        status_forcelist=[500, 502, 503, 504, 520, 521, 522, 523, 524, 525, 526],
        allowed_methods={"GET", "HEAD", "OPTIONS"},
        raise_on_status=False,
    )
    s = requests.Session()
    s.mount("https://", HTTPAdapter(max_retries=retry))
    return s

def _parse_payload(result: dict) -> tuple[datetime, float]:
    """
    Return (utc_dt, temperature_float). Raises KeyError/ValueError if malformed.
    """
    # Find which field is "Pool Temperature"
    # e.g. channel may contain keys like "field1_name": "Pool Temperature"
    field_key = None
    for k, v in result["channel"].items():
        if v == "Pool Temperature":
            field_key = k.replace("_name", "")  # "field1" if k was "field1_name"
            break
    if not field_key:
        raise KeyError("Pool Temperature field not found in channel metadata")

    # last_values is a JSON string, parse it
    last_values = json.loads(result["channel"]["last_values"])
    rec = last_values[field_key]  # e.g. {"value": "78.5", "created_at": "2025-10-12T22:01:00Z"}

    temp = float(rec["value"])
    iso_time = rec["created_at"]
    # Robust ISO8601 parse with 'Z'
    utc_dt = datetime.fromisoformat(iso_time.replace("Z", "+00:00"))

    return utc_dt, temp

class DataWorker:

    @staticmethod
    def worker(stop_event: threading.Event, period: float = constants.POLLING_INTERVAL_SECONDS):
        s = _session_with_retry()
        next_run = time.monotonic()

        while not stop_event.is_set():
            try:
                r = s.get(UBIBOT_URL, params={"account_key": UBIBOT_KEY}, timeout=10)
                # If 5xx after retries, this may still be 5xx; don't raise hard—log and continue.
                if 500 <= r.status_code <= 599:
                    print(f"UbiBot {r.status_code}: {r.text[:200]}")
                    raise requests.HTTPError(f"Upstream {r.status_code}")

                r.raise_for_status()
                result = r.json()

                utc_dt, temp = _parse_payload(result)

                # Parameterized insert; let the driver handle datetime & float types.
                sql = """
                        INSERT INTO pool_data (reading_time, temperature)
                        VALUES (%s, %s)
                        ON DUPLICATE KEY UPDATE temperature = VALUES(temperature)
                    """
                with db.Database() as cur:
                    cur.execute(sql, (utc_dt, temp))
                    try:
                        inserted_id = getattr(cur, "lastrowid", None)
                    except Exception:
                        inserted_id = None
                print(f"Upserted reading_time={utc_dt.isoformat()} temp={temp} id={inserted_id}")

            except requests.HTTPError as e:
                print(f"UbiBot HTTP error: {e}")
            except requests.RequestException as e:
                print(f"UbiBot network error: {e}")
            except (KeyError, ValueError, TypeError) as e:
                print(f"UbiBot payload parse error: {e}")
            except Exception as e:
                # Don't kill the thread on unexpected errors—log and continue
                print(f"Worker unexpected error: {e}")

            # schedule next run relative to monotonic clock
            next_run += period
            wait = max(0.0, next_run - time.monotonic())
            if stop_event.wait(wait):
                break

    @staticmethod
    def start() -> tuple[threading.Event, threading.Thread]:
        stop = threading.Event()
        t = threading.Thread(target=DataWorker.worker, args=(stop,), daemon=True, name="DataWorker")
        t.start()
        return stop, t