# SatQuery AI — Python AI Specialist Microservice Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . /app

ENV PYTHONPATH=/app/services/ai:/app
ENV PORT=8000
ENV HOST=0.0.0.0

EXPOSE 8000

CMD ["python", "services/ai/main.py"]
