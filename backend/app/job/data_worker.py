import json
import threading
import time

import requests

import app.constants as constants
import app.db.db as db


class DataWorker:

    @staticmethod
    def worker(stop_event: threading.Event, period=constants.POLLING_INTERVAL_SECONDS):
        next_run = time.monotonic()
        while not stop_event.is_set():
            url = "https://webapi.ubibot.com/channels/104075?account_key=bbb665991ad27e823cf2d61a491946fd"
            response = requests.get(url)
            response.raise_for_status()
            result = response.json()
            field = None
            for key, val in result["channel"].items():
                if val == "Pool Temperature":
                    field = key
                    break
            last_values = json.loads(result["channel"]["last_values"])
            temp = last_values[field]["value"]
            iso_time = last_values[field]["created_at"]
            formatted_time = f"STR_TO_DATE('{iso_time}', '%Y-%m-%dT%H:%i:%sZ')"

            with db.Database() as cur:
                cur.execute(f"INSERT INTO pool_data (reading_time, temperature) VALUES({formatted_time}, {temp})")
                inserted_id = cur.lastrowid
                print(f"Inserted row ID: {inserted_id} with reading_time: {iso_time} and temp: {temp}")

            # schedule next run relative to monotonic clock
            next_run += period
            wait = max(0.0, next_run - time.monotonic())
            if stop_event.wait(wait):
                break

    @staticmethod
    def start():
        stop = threading.Event()
        t = threading.Thread(target=DataWorker.worker, args=(stop,), daemon=True)
        t.start()