import { Pool } from 'pg';
import { Field } from '../models/Field';
import { config } from '../config/env';

export class SpatialMatchingService {
  private pgPool: Pool;

  constructor() {
    this.pgPool = new Pool({
      connectionString: config.databaseUrl
    });
  }

  /**
   * Matches a GeoJSON Polygon to a Village in the PostGIS database
   */
  async matchFieldToVillage(fieldId: string, boundaryGeoJSON: any): Promise<{ matched: boolean; villageCode?: string; confidence?: number }> {
    try {
      // Find the intersection area percentage between the Farm Field and Village geometries
      const sql = `
        WITH field_geom AS (
          SELECT ST_GeomFromGeoJSON($1) AS geom
        )
        SELECT 
          v.village_code,
          v.name,
          v.district,
          v.state,
          ROUND(CAST((ST_Area(ST_Intersection(f.geom, v.geom)) / NULLIF(ST_Area(f.geom), 0)) * 100 AS numeric), 2) AS overlap_pct
        FROM villages v, field_geom f
        WHERE ST_Intersects(v.geom, f.geom)
        ORDER BY overlap_pct DESC
        LIMIT 1;
      `;

      // Pass GeoJSON as string parameter to SQL
      const result = await this.pgPool.query(sql, [JSON.stringify(boundaryGeoJSON)]);
      
      if (result.rows.length === 0) {
        return { matched: false };
      }

      const match = result.rows[0];

      // Update the Field model in MongoDB with authoritative census-aligned location data
      await Field.findByIdAndUpdate(fieldId, {
        $set: {
          villageCode: match.village_code,
          villageName: match.name,
          district: match.district,
          state: match.state,
          villageMatchConfidence: parseFloat(match.overlap_pct)
        }
      });

      return {
        matched: true,
        villageCode: match.village_code,
        confidence: parseFloat(match.overlap_pct)
      };
    } catch (error) {
      console.error(`[SpatialMatchingService] Error matching field ${fieldId}:`, error);
      throw error;
    }
  }

  /**
   * Batch script to retroactively match fields that lack village tagging
   */
  async matchAllUnassignedFields() {
    // Find fields missing the village metadata
    const fields = await Field.find({ villageCode: { $exists: false } });
    
    let matched = 0;
    const errors = [];

    for (const field of fields) {
      try {
        const result = await this.matchFieldToVillage(field._id.toString(), field.boundary);
        if (result.matched) matched++;
      } catch (e: any) {
        errors.push({ fieldId: field._id, error: e.message });
      }
    }
    
    return { totalProcessed: fields.length, matchedCount: matched, errors };
  }
}

export const spatialMatchingService = new SpatialMatchingService();
