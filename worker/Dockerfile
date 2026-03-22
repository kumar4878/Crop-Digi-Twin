FROM python:3.10-slim

WORKDIR /app
COPY worker.py /app/worker.py

RUN pip install earthengine-api requests boto3 rasterio psycopg2-binary

CMD ["python", "/app/worker.py"]
