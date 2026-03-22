# V2 Edge Sync Architecture: The Idempotent Outbox

The defining feature of the V2 Crop Farming architecture is its ability to operate seamlessly in zero-connectivity environments. This is achieved via a dedicated **Edge Runtime** (using SQLite) on the Operator's mobile device, utilizing an **Outbox Pattern** to reliably sync events to the Cloud API when connectivity is restored.

## 1. Local Edge Schema (SQLite)

The mobile device maintains a local representation of the Event Ledger. It captures events as they happen, ensuring immediate UI responsiveness.

### 1.1 `local_event_outbox` Table
Every action the user takes offline is appended to this outbox queue.

```sql
CREATE TABLE local_event_outbox (
    event_id TEXT PRIMARY KEY,       -- UUID v4
    stream_id TEXT NOT NULL,         -- The FarmerPlotSeason ID
    event_type TEXT NOT NULL,        -- 'CropSown', 'PesticideApplied', etc.
    version INTEGER NOT NULL,        -- The local incrementing version
    payload TEXT NOT NULL,           -- JSON stringified payload
    timestamp TEXT NOT NULL,         -- ISO-8601
    sync_status TEXT NOT NULL,       -- 'PENDING', 'IN_FLIGHT', 'SYNCED', 'FAILED'
    retry_count INTEGER DEFAULT 0
);
```

### 1.2 `local_projections` (The Cache)
Instead of querying the event ledger directly for the UI, the Edge Runtime maintains local projections (e.g., current crop stage, pest severity) derived from the outbox + recently pulled cloud state.

## 2. The Idempotent Sync Protocol (Cloud <-> Edge)

The protocol guarantees that no events are lost, no events are duplicated, and the Cloud Event Store retains verifiable cryptographic hashes of the absolute truth.

### Phase A: Upward Sync (Edge -> Cloud)

1.  **Connectivity Detected**: The Edge device listens for network restoration.
2.  **Batch Processing**: The Edge selects all rows from `local_event_outbox` where `sync_status = 'PENDING'`, sorted strictly by `timestamp ASC`.
3.  **Update State**: Sets `sync_status = 'IN_FLIGHT'` to prevent concurrent background tasks from picking them up.
4.  **API Request**: Posts the batch to `/api/sync/events` on the Cloud API.
5.  **Cloud Ingestion (Idempotency)**:
    *   The Cloud Database initiates a Postgres transaction.
    *   For each event, it verifies if `event_id` already exists.
    *   **If Yes**: The Cloud safely ignores it (handling duplicate transmissions).
    *   **If No**: The Cloud retrieves the previous hash for the `stream_id` and computes a guaranteed valid Server-Side Hash for the new event. It is then inserted.
6.  **Acknowledgement Return**: The Cloud returns an array of `event_ids` that were successfully ingested.
7.  **Edge Finalization**: The Edge deletes or marks those specific `event_ids` as `SYNCED`.

### Phase B: Downward Sync (Cloud -> Edge)

If multiple Operators (e.g., a Farmer and an Agronomist) modify the same plot simultaneously offline, or if the DDE (Cloud AI) generates an Advisory, the Edge must pull those down.

1.  **Watermarking**: The Edge requests events from `/api/sync/pull?since_timestamp=<last_pull_timestamp>`.
2.  **Conflict Resolution**: If the Cloud returns an event on the same `stream_id` that conflicts with a local `PENDING` event, the system employs **CRDTs (Last-Write-Wins based on absolute Cloud timestamp)**, or delegates to manual review.

## 3. DDE-mini (Edge Logic)

To prevent the user from making incorrect decisions offline, certain rules are hardcoded into the Edge application (DDE-mini).

**Example Rule: The Irrigation Gate**
If an operator tries to log `IrrigationExecuted`:
```javascript
function evaluateIrrigation(currentSoilMoisture, offlineWeatherForecast) {
  if (currentSoilMoisture >= 60) {
    return { allowed: false, reason: "Soil moisture adequate." };
  }
  if (offlineWeatherForecast.rainfallNext48h > 15) {
    return { allowed: false, reason: "Rain predicted. Irrigation blocked." };
  }
  return { allowed: true };
}
```
If `allowed: false`, the local Outbox rejects the event entirely, preventing it from ever reaching the Cloud.
