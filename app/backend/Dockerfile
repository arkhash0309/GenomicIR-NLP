FROM python:3.11-slim-bookworm

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /repo/app/backend

COPY app/backend/requirements.txt app/backend/uv-overrides.txt ./
RUN uv pip install --system --no-cache -r requirements.txt --override uv-overrides.txt

COPY app/backend/ .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
