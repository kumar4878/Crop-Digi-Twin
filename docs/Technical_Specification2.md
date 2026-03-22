. High level architecture & components to add
•	PostGIS: enable PostGIS on your PostgreSQL instance (or provision a dedicated Postgres+PostGIS). Store authoritative village polygons and acreage results here.
•	ETL / Ingest service: a microservice (Node or Python) to ingest shapefiles (Survey of India / Bhuvan) into PostGIS and record provenance in your event ledger.
•	Processing workers: worker pool (Python) that runs GEE jobs, Sentinel Hub Process API calls, and raster operations; orchestrated via RabbitMQ.
•	Raster storage & tile server: store processed rasters as COGs in S3 and serve via a tile server + CDN for map clients.
•	Spatial matching service: microservice to match Mongo field polygons to PostGIS village polygons and write match results back to Mongo.
•	Time series store: store aggregated NDVI/VCI time series in Parquet on S3 or TimescaleDB for fast queries.
•	Secrets manager: AWS Secrets Manager / HashiCorp Vault for API keys and service account JSONs.
2. Step by step implementation plan (priority + tasks)
Phase A — Foundation (days 0–7)
1.	Provision PostGIS
o	Enable PostGIS extension on your PostgreSQL instance.
o	Create villages and village_acreage tables (schema below).
2.	Ingest authoritative shapefiles
o	Build an ETL script to read Survey of India / Bhuvan shapefiles and insert into PostGIS with source, source_version, ingest_hash.
3.	Add spatial index & test queries
o	Create GIST index on geom and run sample ST_Intersects queries.
Phase B — Field matching & provenance (days 7–14)
4.	Spatial matching microservice
o	For each field doc in Mongo, compute overlap with PostGIS villages and write village_code and village_match_confidence back to Mongo.
5.	Event ledger entry
o	For each match, write an event to PostgreSQL event store with hash of the field geometry and matched village id.
Phase C — Imagery baseline & NDVI (days 14–30)
6.	GEE baseline pipeline
o	Use a GEE service account to compute multi year NDVI_min/NDVI_max and export per village NDVI baselines (COG or CSV).
7.	On demand NDVI
o	Use Sentinel Hub Process API for on demand NDVI tiles for a field when an alert is triggered.
8.	Store outputs
o	Save COGs and time series Parquet to S3; register metadata in Postgres.
Phase D — Crop classification & acreage (days 30–45)
9.	Crop classification
o	Run classification in GEE (RandomForest or supervised classifier) or local ML (U Net) to produce per pixel crop class masks. Export masks as COGs.
10.	Acreage calculation
o	Clip crop mask to village polygon and sum pixel areas to compute acreage. Store results in village_acreage table and write an event.
Phase E — QA, UI & automation (days 45–60)
11.	QA & override
o	Build UI to show Bhuvan/MNCFC overlays and allow manual overrides; record overrides as events.
12.	Scheduling & monitoring
o	Schedule nightly/weekly baseline jobs; add metrics and alerts.
3. Concrete schemas, SQL and code snippets
PostGIS table DDL (villages + acreage)
-- villages (authoritative)
CREATE TABLE villages (
  id SERIAL PRIMARY KEY,
  village_code TEXT UNIQUE,
  name TEXT,
  state TEXT,
  district TEXT,
  source TEXT,
  source_version TEXT,
  ingest_hash TEXT,
  confidence SMALLINT,
  geom GEOMETRY(MULTIPOLYGON,4326),
  valid_from DATE,
  valid_to DATE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_villages_geom ON villages USING GIST (geom);

-- village acreage results
CREATE TABLE village_acreage (
  id SERIAL PRIMARY KEY,
  village_code TEXT,
  date DATE,
  crop_class TEXT,
  area_ha DOUBLE PRECISION,
  area_acre DOUBLE PRECISION,
  source TEXT,
  source_version TEXT,
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_village_acreage_village_date ON village_acreage (village_code, date);

Spatial match SQL (compute overlap ratio)
sql
-- For a given field polygon (GeoJSON), compute best matching village
WITH field AS (
  SELECT ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[...]}'),4326) AS geom
)
SELECT v.village_code,
       ST_Area(ST_Transform(ST_Intersection(f.geom, v.geom), 6933)) AS intersect_m2,
       ST_Area(ST_Transform(f.geom, 6933)) AS field_m2,
       (ST_Area(ST_Transform(ST_Intersection(f.geom, v.geom),6933)) / ST_Area(ST_Transform(f.geom,6933))) AS overlap_ratio
FROM villages v, field f
WHERE ST_Intersects(v.geom, f.geom)
ORDER BY overlap_ratio DESC
LIMIT 1;
Node.js snippet to write match back to Mongo
js
// pseudocode using pg and mongoose
const match = await pgClient.query(spatialMatchSql, [geojson]);
if (match.rows.length) {
  const { village_code, overlap_ratio } = match.rows[0];
  await FieldModel.updateOne({ _id: fieldId }, {
    $set: { village_code, village_match_confidence: Math.round(overlap_ratio*100) }
  });
  // write event to Postgres event ledger
  await pgClient.query('INSERT INTO events (type, payload_hash, payload) VALUES ($1,$2,$3)', ['FIELD_MATCH', hash, payload]);
}
GEE script (compute per village mean NDVI and export CSV)
javascript
// Earth Engine JS (run in Code Editor or via Python client)
var villages = ee.FeatureCollection('users/your_account/villages'); // upload villages
var s2 = ee.ImageCollection('COPERNICUS/S2_SR')
           .filterDate('2023-01-01','2023-12-31')
           .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',20));

var addNDVI = function(img){
  return img.addBands(img.normalizedDifference(['B8','B4']).rename('NDVI'));
};

var ndviCollection = s2.map(addNDVI).select('NDVI');

var ndviMean = ndviCollection.mean();

var stats = ndviMean.reduceRegions({
  collection: villages,
  reducer: ee.Reducer.mean(),
  scale: 10
});

// Export to Drive or Cloud Storage
Export.table.toDrive({
  collection: stats,
  description: 'village_ndvi_mean_2023',
  fileFormat: 'CSV'
});
Acreage calculation approach (raster mask → area)
•	If mask is binary COG at 10 m: each pixel area ≈ 100 m2.
•	Area (ha) = \text{pixel_count} \times \text{pixel_area_m2} / 10000.
•	Area (acre) = \text{area_ha} \times 2.47105.
Example Python (rasterio + shapely):
python
import rasterio, rasterio.mask, geopandas as gpd
with rasterio.open('crop_mask_cog.tif') as src:
    out_image, out_transform = rasterio.mask.mask(src, [village_geom], crop=True)
    mask = out_image[0]  # binary mask
    pixel_area_m2 = abs(src.transform.a * src.transform.e)  # approx
    pixel_count = (mask > 0).sum()
    area_ha = pixel_count * pixel_area_m2 / 10000.0
    area_acre = area_ha * 2.47105

A PostGIS ingestion script
Purpose Load Survey of India / Bhuvan village shapefiles into PostGIS with provenance and ingest hash.
Requirements ogr2ogr, Python 3.10+, psycopg2, GDAL installed, access to Postgres+PostGIS.
Environment variables
•	PG_HOST, PG_PORT, PG_DB, PG_USER, PG_PASSWORD
•	S3_BUCKET (optional for archiving original shapefiles)
•	SECRETS_PATH (for secrets manager integration)
Script ingest_villages.py
python
#!/usr/bin/env python3
import os, hashlib, subprocess, json, datetime
import psycopg2
from psycopg2.extras import execute_values

PG_HOST = os.environ['PG_HOST']
PG_PORT = os.environ.get('PG_PORT','5432')
PG_DB = os.environ['PG_DB']
PG_USER = os.environ['PG_USER']
PG_PASSWORD = os.environ['PG_PASSWORD']

def compute_hash(path):
    h = hashlib.sha256()
    with open(path,'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            h.update(chunk)
    return h.hexdigest()

def ogr2ogr_load(shapefile_path, table_name='villages_temp'):
    cmd = [
      'ogr2ogr','-f','PostgreSQL',
      f"PG:host={PG_HOST} port={PG_PORT} dbname={PG_DB} user={PG_USER} password={PG_PASSWORD}",
      shapefile_path, '-nln', table_name, '-lco', 'GEOMETRY_NAME=geom', '-nlt', 'MULTIPOLYGON', '-overwrite'
    ]
    subprocess.check_call(cmd)

def upsert_villages(temp_table='villages_temp'):
    conn = psycopg2.connect(host=PG_HOST,port=PG_PORT,dbname=PG_DB,user=PG_USER,password=PG_PASSWORD)
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS villages (
      id SERIAL PRIMARY KEY,
      village_code TEXT UNIQUE,
      name TEXT,
      state TEXT,
      district TEXT,
      source TEXT,
      source_version TEXT,
      ingest_hash TEXT,
      confidence SMALLINT,
      geom GEOMETRY(MULTIPOLYGON,4326),
      valid_from DATE,
      valid_to DATE,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_villages_geom ON villages USING GIST (geom);
    """)
    conn.commit()
    # Upsert from temp table: assumes temp table has fields name, code, state, district
    cur.execute(f"""
    INSERT INTO villages (village_code,name,state,district,source,source_version,ingest_hash,geom,created_at,updated_at)
    SELECT COALESCE("village_code", "VILL_CODE", '')::text,
           COALESCE("name","NAME")::text,
           COALESCE("state","STATE")::text,
           COALESCE("district","DISTRICT")::text,
           %s, %s, %s, ST_Multi(ST_Transform(geom,4326)), now(), now()
    FROM {temp_table}
    ON CONFLICT (village_code) DO UPDATE SET
      name = EXCLUDED.name,
      state = EXCLUDED.state,
      district = EXCLUDED.district,
      source = EXCLUDED.source,
      source_version = EXCLUDED.source_version,
      ingest_hash = EXCLUDED.ingest_hash,
      geom = EXCLUDED.geom,
      updated_at = now();
    """, ('SurveyOfIndia','v1', compute_hash(shapefile_path)))
    conn.commit()
    cur.close()
    conn.close()

if __name__ == '__main__':
    import sys
    if len(sys.argv) < 2:
        print("Usage: ingest_villages.py path/to/shapefile.shp")
        sys.exit(1)
    shapefile_path = sys.argv[1]
    print("Computing hash...")
    h = compute_hash(shapefile_path)
    print("Loading shapefile into PostGIS temp table...")
    ogr2ogr_load(shapefile_path)
    print("Upserting into villages table...")
    upsert_villages()
    print("Done.")
Dockerfile hint
dockerfile
FROM python:3.10-slim
RUN apt-get update && apt-get install -y gdal-bin libgdal-dev
COPY ingest_villages.py /app/
RUN pip install psycopg2-binary
ENTRYPOINT ["python","/app/ingest_villages.py"]
Scheduling Run as a cron job or Airflow DAG after uploading new shapefiles to S3. Record ingest events in your Postgres event ledger with ingest_hash.
B Spatial matching microservice
Purpose Match MongoDB field polygons to PostGIS villages and write village_code and village_match_confidence back to Mongo. Emit an event to the Postgres event ledger.
Requirements Node 18+, pg, mongoose, geojson, axios (optional).
Environment variables
•	MONGO_URI, PG_* as above
•	MATCH_THRESHOLD default 0.7
•	RABBITMQ_URL for emitting events
Service match_service.js
js
// match_service.js
const { Client } = require('pg');
const mongoose = require('mongoose');
const turf = require('@turf/turf');
const amqplib = require('amqplib');

const MONGO_URI = process.env.MONGO_URI;
const PG_CONN = {
  host: process.env.PG_HOST, port: process.env.PG_PORT||5432,
  database: process.env.PG_DB, user: process.env.PG_USER, password: process.env.PG_PASSWORD
};
const MATCH_THRESHOLD = parseFloat(process.env.MATCH_THRESHOLD || '0.7');
const RABBITMQ_URL = process.env.RABBITMQ_URL;

mongoose.connect(MONGO_URI);
const Field = mongoose.model('Field', new mongoose.Schema({
  ownerId: String,
  boundary: { type: Object },
  village_code: String,
  village_match_confidence: Number
}), 'fields');

async function spatialMatch(fieldGeoJSON) {
  const pg = new Client(PG_CONN);
  await pg.connect();
  const geojsonText = JSON.stringify(fieldGeoJSON);
  const sql = `
    WITH field AS (SELECT ST_SetSRID(ST_GeomFromGeoJSON($1),4326) AS geom)
    SELECT v.village_code,
           ST_Area(ST_Transform(ST_Intersection(f.geom, v.geom), 6933)) AS intersect_m2,
           ST_Area(ST_Transform(f.geom, 6933)) AS field_m2,
           (ST_Area(ST_Transform(ST_Intersection(f.geom, v.geom),6933)) / NULLIF(ST_Area(ST_Transform(f.geom,6933)),0)) AS overlap_ratio
    FROM villages v, field f
    WHERE ST_Intersects(v.geom, f.geom)
    ORDER BY overlap_ratio DESC
    LIMIT 5;
  `;
  const res = await pg.query(sql, [geojsonText]);
  await pg.end();
  return res.rows;
}

async function emitEvent(channel, event) {
  const q = 'events';
  await channel.assertQueue(q, { durable: true });
  channel.sendToQueue(q, Buffer.from(JSON.stringify(event)), { persistent: true });
}

async function processField(fieldDoc, channel) {
  const matches = await spatialMatch(fieldDoc.boundary);
  if (!matches || matches.length === 0) {
    // no match
    await Field.updateOne({ _id: fieldDoc._id }, { $set: { village_match_confidence: 0 }});
    return;
  }
  const best = matches[0];
  const confidence = Math.round((best.overlap_ratio || 0) * 100);
  await Field.updateOne({ _id: fieldDoc._id }, { $set: { village_code: best.village_code, village_match_confidence: confidence }});
  const event = { type: 'FIELD_MATCH', timestamp: new Date().toISOString(), payload: { fieldId: fieldDoc._id, village_code: best.village_code, confidence } };
  await emitEvent(channel, event);
}

async function main() {
  const conn = await amqplib.connect(RABBITMQ_URL);
  const channel = await conn.createChannel();
  // Simple loop: find unmatched fields
  const cursor = Field.find({ $or: [{ village_code: { $exists: false } }, { village_match_confidence: { $lt: 100 } }] }).cursor();
  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    try {
      await processField(doc, channel);
    } catch (err) {
      console.error('Error processing field', doc._id, err);
    }
  }
  await channel.close();
  await conn.close();
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
Dockerfile hint
dockerfile
FROM node:18
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
CMD ["node","match_service.js"]
Operational notes
•	Run as a scheduled job or consume a queue of new/updated fields.
•	For low confidence matches, push to a manual review queue in your UI.
•	Store event IDs and ingest hashes in the Postgres event ledger for provenance.
C Google Earth Engine script
Purpose Compute multi year NDVI_min/NDVI_max, VCI, per village NDVI time series, and export per village CSV and COGs to Cloud Storage or S3 via GCS.
Requirements GEE account with service account, GCP project, earthengine CLI or Python client.
Environment variables
•	GEE_SERVICE_ACCOUNT_KEY path or GOOGLE_APPLICATION_CREDENTIALS
•	GEE_VILLAGE_ASSET path to uploaded FeatureCollection of villages (e.g., users/your_account/villages)
•	EXPORT_BUCKET GCS bucket (e.g., gs://your-bucket)
Script gee_village_ndvi.js (Earth Engine JavaScript)
javascript
// gee_village_ndvi.js
var villages = ee.FeatureCollection('users/your_account/villages'); // upload villages as asset
var startYear = 2018;
var endYear = 2024;
var startDate = ee.Date(startYear + '-01-01');
var endDate = ee.Date(endYear + '-12-31');

function getS2Collection(start, end) {
  return ee.ImageCollection('COPERNICUS/S2_SR')
    .filterDate(start, end)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
    .map(function(img){ return img.clipToBoundsAndScale(villages.geometry(), 10); });
}

// Add NDVI band
function addNDVI(img) {
  var ndvi = img.normalizedDifference(['B8','B4']).rename('NDVI');
  return img.addBands(ndvi);
}

// Build multi-year NDVI min and max per pixel
var s2 = getS2Collection(startDate, endDate).map(addNDVI).select('NDVI');
var ndviMin = s2.min();
var ndviMax = s2.max();

// Compute VCI for a target date range (e.g., current season)
var seasonStart = ee.Date('2024-06-01');
var seasonEnd = ee.Date('2024-09-30');
var seasonCollection = getS2Collection(seasonStart, seasonEnd).map(addNDVI).select('NDVI');
var seasonMean = seasonCollection.mean();

// VCI formula
var vci = seasonMean.subtract(ndviMin).divide(ndviMax.subtract(ndviMin)).multiply(100).rename('VCI');

// Per-village statistics: mean NDVI and mean VCI
var ndviStats = seasonMean.reduceRegions({
  collection: villages,
  reducer: ee.Reducer.mean().combine(ee.Reducer.min(), '', true).combine(ee.Reducer.max(), '', true),
  scale: 10
});

var vciStats = vci.reduceRegions({
  collection: villages,
  reducer: ee.Reducer.mean(),
  scale: 10
});

// Join NDVI and VCI stats by village id
var joined = ndviStats.map(function(f){
  var id = f.get('village_code');
  var vciFeature = vciStats.filter(ee.Filter.eq('village_code', id)).first();
  return f.set('VCI_mean', ee.Algorithms.If(vciFeature, vciFeature.get('mean'), null));
});

// Export per-village CSV to GCS
Export.table.toCloudStorage({
  collection: joined,
  description: 'village_ndvi_vci_2024_season',
  bucket: 'YOUR_EXPORT_BUCKET',
  fileNamePrefix: 'village_ndvi_vci_2024_season',
  fileFormat: 'CSV'
});

// Export VCI raster as COG per tile (example single export)
Export.image.toCloudStorage({
  image: vci,
  description: 'vci_raster_2024_season',
  bucket: 'YOUR_EXPORT_BUCKET',
  fileNamePrefix: 'vci_raster_2024_season',
  scale: 10,
  region: villages.geometry().bounds(),
  maxPixels: 1e13
});
NDVI and VCI formulas
NDVI=NIR−REDNIR+RED
VCI=100⋅NDVI−NDVImin⁡NDVImax⁡−NDVImin⁡
How to run
•	Upload villages as an Earth Engine asset.
•	Run the script in the Earth Engine Code Editor or convert to Python using the ee client and schedule via Cloud Scheduler or a worker.
Export targets
•	CSV per village to GCS → copy to S3 if needed.
•	COGs for VCI/NDVI to GCS → serve via tile server.
D Sentinel Hub Process API examples
Purpose On demand NDVI tiles and time series for a given field polygon using Sentinel Hub Process API.
Requirements Sentinel Hub account, client id/secret, curl or Python requests.
Environment variables
•	SH_CLIENT_ID, SH_CLIENT_SECRET
•	SH_INSTANCE_ID (if using instance)
•	S3_BUCKET for storing results
Get OAuth token (conceptual)
bash
curl -X POST "https://services.sentinel-hub.com/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=${SH_CLIENT_ID}&client_secret=${SH_CLIENT_SECRET}"
Process API NDVI tile request (curl)
bash
curl -X POST "https://services.sentinel-hub.com/api/v1/process" \
 -H "Authorization: Bearer ${TOKEN}" \
 -H "Content-Type: application/json" \
 -d '{
  "input": [{
    "type":"S2L2A",
    "dataFilter":{"timeRange":{"from":"2024-06-01T00:00:00Z","to":"2024-09-30T23:59:59Z"}},
    "processing":{"upsampling":"BICUBIC","downsampling":"BICUBIC"}
  }],
  "evalscript":"//VERSION=3\nfunction setup(){return{input:[{bands:[\"B04\",\"B08\"]}],output:{bands:1, sampleType:\"FLOAT32\"}}}\nfunction evaluatePixel(sample){var ndvi=(sample.B08-sample.B04)/(sample.B08+sample.B04); return [ndvi];}",
  "output":{"width":512,"height":512,"responses":[{"identifier":"default","format":{"type":"image/tiff"}}]},
  "bbox":[77.5,16.8,78.6,17.4]
 }' --output ndvi_tile.tiff
Time series NDVI for a polygon (Python)
python
import requests, json, os
TOKEN = os.environ['SH_TOKEN']
url = "https://services.sentinel-hub.com/api/v1/statistics/aggregations"
payload = {
  "input": [{"type":"S2L2A","dataFilter":{"timeRange":{"from":"2024-01-01T00:00:00Z","to":"2024-12-31T23:59:59Z"}}}],
  "aggregation": {"timeRange": {"interval": "P10D"}},  # 10-day intervals
  "evalscript": "//VERSION=3\nfunction setup(){return{input:[{bands:[\"B04\",\"B08\"]}],output:{bands:1}}}\nfunction evaluatePixel(sample){var ndvi=(sample.B08-sample.B04)/(sample.B08+sample.B04); return [ndvi];}",
  "geometry": {"type":"Polygon","coordinates":[[[77.9,17.0],[77.95,17.0],[77.95,17.05],[77.9,17.05],[77.9,17.0]]]}
}
r = requests.post(url, headers={"Authorization":f"Bearer {TOKEN}","Content-Type":"application/json"}, json=payload)
print(r.json())
Notes
•	Use statistics/aggregations for time series without downloading full images.
•	Use process for image exports and server side evalscripts.
•	Respect rate limits and cache results in S3/Redis.
Deployment Integration Next Steps
1. Secrets and credentials Store PG_*, MONGO_URI, SH_*, GEE service account JSON in AWS Secrets Manager or HashiCorp Vault. Inject into containers via environment variables or secret mounts.
2. Orchestration
•	Use RabbitMQ to queue: INGEST_SHAPEFILE → run A → emit VILLAGES_INGESTED.
•	Queue FIELD_MATCH tasks consumed by B.
•	Queue NDVI_BASELINE tasks consumed by workers that run C via GEE or D via Sentinel Hub.
•	After exports, register metadata in Postgres and emit ACREAGE_COMPUTED events.
3. Storage and formats
•	Store rasters as COGs in S3; store time series as Parquet.
•	Register artifact metadata in Postgres table artifacts(key, type, s3_path, hash, created_at).
4. Monitoring and QA
•	Add metrics: queue length, job duration, export failures, tile cache hit ratio.
•	Build a manual review UI for low confidence matches and acreage discrepancies.
5. Security and governance
•	Enforce RBAC for Postgres and Mongo.
•	Keep Survey of India polygons as canonical; record manual edits as events with user id and reason.
Docker deployment overview
Below is a complete Docker Compose setup and supporting Dockerfiles you can drop into Antigravity. It runs the PostGIS ingestion service (A), the spatial matching microservice (B), a generic worker for GEE/Sentinel tasks (C/D), and required infra (Postgres+PostGIS, MongoDB, RabbitMQ, Redis, MinIO for S3 emulation). Use this for local development and CI; for production replace MinIO with AWS S3 and move secrets to a secrets manager.
1 Docker Compose file
Save as docker-compose.yml
yaml
version: '3.8'
services:
  postgres:
    image: postgis/postgis:15-3.4
    environment:
      POSTGRES_DB: appdb
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD: changeme
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL","pg_isready -U appuser -d appdb"]
      interval: 10s
      timeout: 5s
      retries: 5

  mongo:
    image: mongo:6
    volumes:
      - mongodata:/data/db
    ports:
      - "27017:27017"

  rabbitmq:
    image: rabbitmq:3-management
    environment:
      RABBITMQ_DEFAULT_USER: rabbit
      RABBITMQ_DEFAULT_PASS: rabbit
    ports:
      - "5672:5672"
      - "15672:15672"

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  minio:
    image: minio/minio:RELEASE.2025-01-01T00-00-00Z
    command: server /data
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - miniodata:/data
    ports:
      - "9000:9000"

  ingest:
    build:
      context: ./ingest
      dockerfile: Dockerfile
    environment:
      PG_HOST: postgres
      PG_PORT: 5432
      PG_DB: appdb
      PG_USER: appuser
      PG_PASSWORD: changeme
      S3_ENDPOINT: http://minio:9000
      S3_BUCKET: village-shapefiles
    depends_on:
      - postgres
      - minio

  matcher:
    build:
      context: ./matcher
      dockerfile: Dockerfile
    environment:
      MONGO_URI: mongodb://mongo:27017/app
      PG_HOST: postgres
      PG_PORT: 5432
      PG_DB: appdb
      PG_USER: appuser
      PG_PASSWORD: changeme
      RABBITMQ_URL: amqp://rabbit:rabbit@rabbitmq:5672
      MATCH_THRESHOLD: 0.7
    depends_on:
      - postgres
      - mongo
      - rabbitmq

  worker:
    build:
      context: ./worker
      dockerfile: Dockerfile
    environment:
      RABBITMQ_URL: amqp://rabbit:rabbit@rabbitmq:5672
      PG_HOST: postgres
      PG_PORT: 5432
      PG_DB: appdb
      PG_USER: appuser
      PG_PASSWORD: changeme
      MONGO_URI: mongodb://mongo:27017/app
      MINIO_ENDPOINT: http://minio:9000
    depends_on:
      - rabbitmq
      - postgres
      - mongo
      - minio
    deploy:
      replicas: 2

volumes:
  pgdata:
  mongodata:
  miniodata:
2 Dockerfiles for services
A Ingest service Dockerfile ./ingest/Dockerfile
dockerfile
FROM python:3.10-slim
RUN apt-get update && apt-get install -y gdal-bin libgdal-dev build-essential
WORKDIR /app
COPY ingest_villages.py /app/ingest_villages.py
RUN pip install psycopg2-binary boto3
ENTRYPOINT ["python","/app/ingest_villages.py"]
B Matcher service Dockerfile ./matcher/Dockerfile
dockerfile
FROM node:18
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
CMD ["node","match_service.js"]
package.json should include pg, mongoose, @turf/turf, amqplib.
Worker Dockerfile ./worker/Dockerfile
dockerfile
FROM python:3.10-slim
RUN apt-get update && apt-get install -y gdal-bin libgdal-dev
WORKDIR /app
COPY worker.py /app/worker.py
RUN pip install google-earthengine requests boto3 rasterio psycopg2-binary
CMD ["python","/app/worker.py"]
3 Environment and secrets handling
•	Local dev: use a .env file and docker compose --env-file .env up. Keep .env out of VCS.
•	Production: do not use .env. Use Docker secrets, Kubernetes Secrets, or a secrets manager (AWS Secrets Manager / HashiCorp Vault). Mount service account JSON for GEE as a file into the worker container and set GOOGLE_APPLICATION_CREDENTIALS.
•	S3: replace MinIO with AWS S3 in production. Use IAM roles for EC2/ECS/EKS rather than static keys.
4 How to run and scale
•	Start locally
bash
docker compose up --build -d
•	Run ingestion once (example)
bash
docker compose run --rm ingest /data/shapefiles/ramachandrapuram.shp
•	Schedule ingestion via cron or a scheduler container (Airflow/CronJob) to pick new shapefiles from S3 and run the ingest container.
•	Scale workers by increasing replicas in Compose or scaling the worker service in Kubernetes.
5 Healthchecks, monitoring and logging
•	Healthchecks: Postgres and other infra already have basic checks. Add HTTP health endpoints to ingest, matcher, and worker and configure Docker healthchecks.
•	Logging: forward container logs to a centralized system (ELK/CloudWatch). In Compose, docker compose logs -f.
•	Metrics: instrument services with Prometheus metrics and expose /metrics. Use Grafana dashboards for queue length, job durations, and S3 usage.
6 Production hardening checklist
•	Replace MinIO with S3 and use IAM roles.
•	Enable TLS for Postgres and MongoDB connections.
•	Use Postgres managed service (RDS/Aurora) with PostGIS for reliability.
•	Run Postgres backups and enable point in time recovery.
•	Use autoscaling for worker pool and RabbitMQ consumers.
•	Set quotas and retries for external APIs (Sentinel Hub, GEE) and implement exponential backoff.
•	Add RBAC and audit logging for any manual override UI.

