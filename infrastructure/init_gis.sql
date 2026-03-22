-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create villages table (Authoritative source)
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
  geom GEOMETRY(MULTIPOLYGON, 4326),
  valid_from DATE,
  valid_to DATE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Index for spatial queries
CREATE INDEX IF NOT EXISTS idx_villages_geom ON villages USING GIST (geom);

-- Create village_acreage table for results
CREATE TABLE IF NOT EXISTS village_acreage (
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

-- Index for acreage queries
CREATE INDEX IF NOT EXISTS idx_village_acreage_village_date ON village_acreage (village_code, date);
