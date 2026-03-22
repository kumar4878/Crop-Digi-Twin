import { Pool, PoolConfig } from 'pg';
import crypto from 'crypto';

export interface BaseEvent {
  eventId: string;
  streamId: string;
  eventType: string;
  version: number;
  timestamp: string;
  actorId: string;
  payload: any;
  hash: string;
}

export class EventStore {
  private pool: Pool;

  constructor(config: PoolConfig) {
    this.pool = new Pool(config);
    this.initializeSchema().catch(console.error);
  }

  // Create immutable ledger table if it doesn't exist
  private async initializeSchema() {
    const query = `
      CREATE TABLE IF NOT EXISTS event_ledger (
        event_id UUID PRIMARY KEY,
        stream_id UUID NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        version INTEGER NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        actor_id UUID NOT NULL,
        payload JSONB NOT NULL,
        hash VARCHAR(256) NOT NULL,
        UNIQUE(stream_id, version) -- Ensure strictly monotonic versions per stream
      );

      CREATE INDEX IF NOT EXISTS idx_stream_id ON event_ledger(stream_id);
      CREATE INDEX IF NOT EXISTS idx_event_type ON event_ledger(event_type);
      CREATE INDEX IF NOT EXISTS idx_timestamp ON event_ledger(timestamp);
    `;
    await this.pool.query(query);
    console.log('[db]: Event Ledger schema initialized');
  }

  // Generate SHA-256 Hash for provenance
  private generateHash(event: BaseEvent, previousHash: string = ''): string {
    const dataString = `${previousHash}|${event.streamId}|${event.eventType}|${event.version}|${JSON.stringify(event.payload)}`;
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  // Idempotent appending of events from Edge Queue
  public async appendEvents(events: BaseEvent[]): Promise<BaseEvent[]> {
    const client = await this.pool.connect();
    const appendedEvents: BaseEvent[] = [];

    try {
      await client.query('BEGIN');

      for (const event of events) {
        // Idempotency Check: if eventId already exists, skip
        const checkQuery = await client.query('SELECT event_id FROM event_ledger WHERE event_id = $1', [event.eventId]);
        if (checkQuery.rows.length > 0) {
          console.log(`[sync]: Skipping existing event ${event.eventId}`);
          continue; 
        }

        // Get previous event hash for the stream
        const prevEventQuery = await client.query(
          'SELECT hash FROM event_ledger WHERE stream_id = $1 ORDER BY version DESC LIMIT 1',
          [event.streamId]
        );
        const previousHash = prevEventQuery.rows.length > 0 ? prevEventQuery.rows[0].hash : '';

        // Recalculate hash on the server side to ensure integrity
        const serverHash = this.generateHash(event, previousHash);

        const insertQuery = `
          INSERT INTO event_ledger (event_id, stream_id, event_type, version, timestamp, actor_id, payload, hash)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *;
        `;
        const values = [
          event.eventId,
          event.streamId,
          event.eventType,
          event.version,
          event.timestamp,
          event.actorId,
          event.payload,
          serverHash
        ];

        const result = await client.query(insertQuery, values);
        appendedEvents.push(result.rows[0]);
      }

      await client.query('COMMIT');
      return appendedEvents;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
