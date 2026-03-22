FROM python:3.10-slim

RUN apt-get update && apt-get install -y \
    gdal-bin \
    libgdal-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY ingest_villages.py /app/ingest_villages.py
RUN pip install psycopg2-binary
ENTRYPOINT ["python", "/app/ingest_villages.py"]
