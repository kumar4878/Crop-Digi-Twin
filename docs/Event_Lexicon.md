# V2 Event Lexicon: Immutable Ledger Definition

In an Event-Sourced architecture, the state of the Digital Twin (the Field/Crop) is never directly updated. Instead, the current state is derived by replaying a sequence of immutable events. 

This document defines the schema for the **Top 10 Core Events** required to track the Farmer-Plot-Season lifecycle.

## Core Event Structure (Base Schema)

Every event appended to the ledger strictly follows this structure:

```typescript
interface BaseEvent {
  eventId: string;             // UUID v4 of the specific event
  streamId: string;            // The aggregate UUID (e.g., FarmerPlotSeason ID)
  eventType: string;           // The name of the event (e.g., "CropSown")
  version: number;             // Concurrency control (1, 2, 3...)
  timestamp: string;           // ISO-8601 UTC timestamp of when it occurred
  actorId: string;             // The User ID who initiated the event
  payload: any;                // Event-specific data
  hash: string;                // Cryptographic hash (SHA-256) of preceding event hash + payload (for PMFBY)
}
```

---

## 1. PlotLifecycle Events

### `PlotRegistered`
*   **Trigger**: A new plot of land is registered under a farmer's profile.
*   **Payload**: `geojsonBoundary`, `totalArea`, `soilType`, `regionId`.

### `SeasonStarted` (CropSown)
*   **Trigger**: The farmer physically sows the crop on the plot.
*   **Payload**: `cropId`, `varietyId`, `sowingDate`, `expectedDurationDays`, `seedQuantity`.

### `SeasonEnded` (CropHarvested)
*   **Trigger**: The crop is harvested, closing the ledger stream for this season.
*   **Payload**: `harvestDate`, `actualYieldAmount`, `yieldQuality`.

---

## 2. Observation Events (Sensor & Human)

### `PestObserved`
*   **Trigger**: A human or drone spots a potential pest issue.
*   **Payload**: `pestId` (if known), `severity` (LOW, HIGH), `affectedAreaPercent`, `imageEvidenceUrls`.

### `SoilMoistureRead`
*   **Trigger**: IoT Sensor or manual technician reading of soil moisture.
*   **Payload**: `moistureLevelPercent`, `depthCm`, `sensorId` (if automated).

### `CropStageAdvanced`
*   **Trigger**: Phenological change (e.g., Vegetative to Flowering), either derived by GDD or manually confirmed.
*   **Payload**: `previousStage`, `newStage`, `gddAccumulated`, `isManualOverride`.

---

## 3. Action Events (Advisory Executed)

### `IrrigationExecuted`
*   **Trigger**: Water is applied to the plot.
*   **Payload**: `waterAmountLiters`, `durationMinutes`, `waterSource`.

### `PesticideApplied` (ProtectionAction)
*   **Trigger**: Operator sprays chemicals based on an advisory.
*   **Payload**: `productId`, `activeIngredient`, `dosageApplied`, `applicationMethod` (e.g., Drone, Manual).

### `FertilizerApplied` (NutritionAction)
*   **Trigger**: Nutrients are added to the soil.
*   **Payload**: `fertilizerType` (e.g., NPK 19-19-19), `quantityKg`, `applicationStage`.

---

## 4. Intelligence Events (System Generated)

### `AdvisoryIssued`
*   **Trigger**: The Cloud DDE or Edge DDE-mini calculates that an action is necessary (e.g., irrigation needed).
*   **Payload**: `advisoryType` (Irrigation, Spray), `urgency`, `reasonCode` (for PMFBY/Audit).

---

## Designing for Offline (The Delta-Sync protocol)

When these events occur on a mobile Edge Runtime (offline), they are strictly appended to an `OutboxQueue` table in SQLite. The device generates the UUIDs and Timestamps locally. 

When connectivity is restored, the array of events is `POST`ed to `/sync/events`. The Cloud API verifies the order, recalculates the cryptographic hashes for security, and commits them to the PostgreSQL Event Store.
