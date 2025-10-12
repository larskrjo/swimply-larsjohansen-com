# ---- Runtime image ----
FROM python:3.13-slim

# Faster/cleaner Python & pip behavior
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System deps (only if you need to compile wheels; minimal by default)
# RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*

# Copy only pyproject first for caching
COPY pyproject.toml poetry.lock* ./
RUN pip install --upgrade pip && pip install .

# Copy the rest of your app
COPY . .

# Optional healthcheck that hits /health
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD ["python", "-c", "import sys,urllib.request; r=urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=2); sys.exit(0 if r.status==200 else 1)"]

EXPOSE 8000

# IMPORTANT: bind 0.0.0.0 so Docker port mapping works
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
