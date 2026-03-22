#!/usr/bin/env python3
import os, hashlib, subprocess, json, sys
import psycopg2
from psycopg2.extras import execute_values

PG_HOST = os.environ.get('PG_HOST', 'postgres')
PG_PORT = os.environ.get('PG_PORT', '5432')
PG_DB = os.environ.get('PG_DB', 'crop_farming')
PG_USER = os.environ.get('PG_USER', 'postgres')
PG_PASSWORD = os.environ.get('PG_PASSWORD', 'password')

def compute_hash(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            h.update(chunk)
    return h.hexdigest()

def ogr2ogr_load(shapefile_path, table_name='villages_temp'):
    print(f"Loading {shapefile_path} via ogr2ogr...")
    cmd = [
        'ogr2ogr', '-f', 'PostgreSQL',
        f"PG:host={PG_HOST} port={PG_PORT} dbname={PG_DB} user={PG_USER} password={PG_PASSWORD}",
        shapefile_path, '-nln', table_name, '-lco', 'GEOMETRY_NAME=geom', '-nlt', 'MULTIPOLYGON', '-overwrite'
    ]
    subprocess.check_call(cmd)

def upsert_villages(temp_table='villages_temp', source_name='SurveyOfIndia', file_hash=''):
    print("Upserting into main villages table...")
    conn = psycopg2.connect(host=PG_HOST, port=PG_PORT, dbname=PG_DB, user=PG_USER, password=PG_PASSWORD)
    cur = conn.cursor()
    
    # Check what columns ogr2ogr generated (in case some are missing like state)
    cur.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{temp_table}'")
    cols = [r[0].lower() for r in cur.fetchall()]
    
    # Try different possible column names for village properties based on Bhuvan or SoI
    dist_col = "district" if "district" in cols else "district_n" if "district_n" in cols else "NULL"
    name_col = "name" if "name" in cols else "vill_name" if "vill_name" in cols else "NULL"
    code_col = "loc_code" if "loc_code" in cols else "vill_code" if "vill_code" in cols else "NULL"
    state_col = "state" if "state" in cols else "state_name" if "state_name" in cols else "NULL"
    
    # Format the insert
    district_sql = f'COALESCE("{dist_col}", \'\')::text' if dist_col != "NULL" else "''"
    name_sql = f'COALESCE("{name_col}", \'\')::text' if name_col != "NULL" else "''"
    code_sql = f'COALESCE("{code_col}", \'\')::text' if code_col != "NULL" else "''"
    state_sql = f'COALESCE("{state_col}", \'\')::text' if state_col != "NULL" else "''"

    cur.execute(f"""
    INSERT INTO villages (village_code, name, state, district, source, source_version, ingest_hash, geom, created_at, updated_at)
    SELECT DISTINCT ON ({code_sql})
           {code_sql},
           {name_sql},
           {state_sql},
           {district_sql},
           %s, %s, %s, ST_Multi(ST_Transform(geom, 4326)), now(), now()
    FROM {temp_table}
    WHERE {code_sql} != ''
    ORDER BY {code_sql}, {name_sql} DESC
    ON CONFLICT (village_code) DO UPDATE SET
      name = EXCLUDED.name,
      state = EXCLUDED.state,
      district = EXCLUDED.district,
      source = EXCLUDED.source,
      source_version = EXCLUDED.source_version,
      ingest_hash = EXCLUDED.ingest_hash,
      geom = EXCLUDED.geom,
      updated_at = now();
    """, (source_name, 'v1', file_hash))
    
    conn.commit()
    cur.close()
    conn.close()

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python ingest_villages.py path/to/shapefile.shp")
        sys.exit(1)
    target_path = sys.argv[1]
    
    if not os.path.exists(target_path):
        print(f"File not found: {target_path}")
        sys.exit(1)
        
    print("Computing hash...")
    file_hash = compute_hash(target_path)
    print("Loading file into PostGIS temp table...")
    ogr2ogr_load(target_path)
    print("Upserting into villages table...")
    upsert_villages(file_hash=file_hash)
    print("Done.")
