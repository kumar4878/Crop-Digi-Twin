# ANTIGRAVITY AI PROMPT - CROP DIGITAL TWIN ENHANCEMENT

**Copy this entire prompt and paste it into Antigravity AI to implement the 3 critical features.**

---

## 🎯 PROJECT CONTEXT

I have an existing Crop Digital Twin application in the repository: https://github.com/kumar4878/Crop-Digi-Twin

**Current Tech Stack:**
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- Backend: Bun 1.x + Elysia 1.x + TypeScript
- Database: MongoDB Atlas
- Infrastructure: Docker Compose

**Current Structure:**
```
├── backend/          → Elysia API
├── webapp/           → React app
├── worker/           → Background jobs
├── ingest/           → Data ingestion
├── infrastructure/   → IaC
└── docker-compose.yml
```

---

## 🎯 IMPLEMENTATION GOAL

Implement **3 CRITICAL FEATURES** to transform this from a basic CRUD app into a true Digital Twin platform:

### 1. EVENT SOURCING SYSTEM
Create an immutable audit trail where every action (irrigation, spraying, stage progression) is stored as an event. This enables:
- PMFBY insurance compliance (provenance tracking)
- "Why did the system recommend X?" debugging
- State reconstruction from event history
- Regulatory audit trails

### 2. POSTGIS INTEGRATION
Match farmer field boundaries to authoritative village polygons from Survey of India. This enables:
- Acreage validation (government data vs farmer-reported)
- Spatial aggregation ("How much wheat in Telangana?")
- Cluster management (200 acres, 1200 acres)

### 3. GDD (GROWING DEGREE DAYS) ENGINE
Progress crop stages based on accumulated temperature, not calendar days. This enables:
- Accurate harvest predictions (±3 days vs ±14 days)
- Optimal fertilizer timing
- Weather-resilient stage progression

---

## 📋 FEATURE 1: EVENT SOURCING

### Task 1.1: Create MongoDB Collections

Create these collections in MongoDB:

**Collection: `events`**
```javascript
// Schema
{
  _id: ObjectId,
  eventId: String,              // UUID v4
  eventType: String,            // 'STAGE_PROGRESSION', 'IRRIGATION_APPLIED', etc.
  timestamp: Date,
  farmerId: String,
  plotId: String,
  season: String,               // e.g., 'KHARIF-2024'
  payload: {
    before: Object,             // State before change
    after: Object,              // State after change
    reasoning: Array<String>    // Why this happened
  },
  provenance: {
    source: String,             // 'SENSOR' | 'MANUAL' | 'AI' | 'SYSTEM'
    triggeredBy: String,        // User ID or system component
    confidence: Number,         // 0-100
    modelVersion: String        // e.g., 'DDE-v2.1'
  },
  hash: String,                 // SHA256 for integrity
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.events.createIndex({ plotId: 1, season: 1, timestamp: 1 });
db.events.createIndex({ eventType: 1, timestamp: -1 });
db.events.createIndex({ hash: 1 }, { unique: true });
```

**Collection: `digital_twins`** (Materialized View)
```javascript
{
  _id: ObjectId,
  plotId: String,
  season: String,
  currentStage: String,
  gddAccumulated: Number,
  activitiesCount: {
    irrigations: Number,
    sprays: Number,
    fertilizers: Number
  },
  healthScore: Number,
  lastEventId: String,
  eventCount: Number,
  rebuiltAt: Date
}

// Indexes
db.digital_twins.createIndex({ plotId: 1, season: 1 }, { unique: true });
```

### Task 1.2: Implement EventSourcingService

**File: `backend/src/services/event-sourcing.service.ts`**

```typescript
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export class EventSourcingService {
  
  async createEvent(event: {
    eventType: string;
    timestamp: Date;
    farmerId: string;
    plotId: string;
    season: string;
    payload: any;
    provenance: any;
  }) {
    const eventId = uuidv4();
    
    // Create deterministic hash
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify({
        eventType: event.eventType,
        timestamp: event.timestamp,
        plotId: event.plotId,
        payload: event.payload
      }))
      .digest('hex');
    
    const fullEvent = {
      eventId,
      ...event,
      hash,
      createdAt: new Date()
    };
    
    // Store event
    await db.collection('events').insertOne(fullEvent);
    
    // Rebuild digital twin
    await this.reconstructDigitalTwin(event.plotId, event.season);
    
    return fullEvent;
  }
  
  async reconstructDigitalTwin(plotId: string, season: string) {
    // Get all events
    const events = await db.collection('events')
      .find({ plotId, season })
      .sort({ timestamp: 1 })
      .toArray();
    
    // Replay events
    let state = {
      plotId,
      season,
      currentStage: 'SOWING',
      gddAccumulated: 0,
      activitiesCount: { irrigations: 0, sprays: 0, fertilizers: 0 }
    };
    
    for (const event of events) {
      if (event.eventType === 'STAGE_PROGRESSION') {
        state.currentStage = event.payload.after.stage;
        state.gddAccumulated = event.payload.after.gdd || 0;
      }
      if (event.eventType === 'IRRIGATION_APPLIED') {
        state.activitiesCount.irrigations++;
      }
    }
    
    // Update materialized view
    await db.collection('digital_twins').updateOne(
      { plotId, season },
      { $set: state },
      { upsert: true }
    );
    
    return state;
  }
}
```

### Task 1.3: Add API Endpoints

**File: `backend/src/api/events.routes.ts`**

```typescript
import { Elysia } from 'elysia';

export const eventRoutes = new Elysia({ prefix: '/events' })
  
  .get('/plot/:plotId/season/:season', async ({ params }) => {
    const events = await db.collection('events')
      .find({ plotId: params.plotId, season: params.season })
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();
    
    return { events };
  })
  
  .get('/digital-twin/:plotId/:season', async ({ params }) => {
    const twin = await db.collection('digital_twins').findOne({
      plotId: params.plotId,
      season: params.season
    });
    
    return twin;
  });
```

### Task 1.4: Frontend Component

**File: `webapp/src/components/EventTimeline.tsx`**

```typescript
export const EventTimeline = ({ plotId, season }) => {
  const { data } = useQuery({
    queryKey: ['events', plotId, season],
    queryFn: () => api.getEvents(plotId, season)
  });

  return (
    <div className="space-y-4">
      {data?.events.map(event => (
        <div key={event.eventId} className="border-l-2 pl-4">
          <h4 className="font-semibold">{event.eventType}</h4>
          <p className="text-sm text-gray-500">
            {format(new Date(event.timestamp), 'MMM d, yyyy')}
          </p>
          <Badge>{event.provenance.source}</Badge>
        </div>
      ))}
    </div>
  );
};
```

---

## 📋 FEATURE 2: POSTGIS INTEGRATION

### Task 2.1: Add PostGIS to Docker Compose

**Update `docker-compose.yml`:**

```yaml
services:
  postgis:
    image: postgis/postgis:15-3.4
    environment:
      POSTGRES_DB: cropdb
      POSTGRES_USER: cropuser
      POSTGRES_PASSWORD: ${POSTGIS_PASSWORD:-changeme}
    volumes:
      - postgis_data:/var/lib/postgresql/data
      - ./postgis/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U cropuser"]
      interval: 10s

volumes:
  postgis_data:
```

### Task 2.2: Create PostGIS Schema

**File: `postgis/schema.sql`**

```sql
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE villages (
  id SERIAL PRIMARY KEY,
  village_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  source TEXT NOT NULL,
  geom GEOMETRY(MULTIPOLYGON, 4326) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_villages_geom ON villages USING GIST (geom);
CREATE INDEX idx_villages_state ON villages (state, district);

CREATE TABLE village_acreage (
  id SERIAL PRIMARY KEY,
  village_code TEXT NOT NULL,
  date DATE NOT NULL,
  crop_class TEXT NOT NULL,
  area_acre DOUBLE PRECISION NOT NULL,
  source TEXT NOT NULL,
  UNIQUE(village_code, date, crop_class)
);
```

### Task 2.3: Implement SpatialMatchingService

**File: `backend/src/services/spatial-matching.service.ts`**

```typescript
import { Client } from 'pg';

export class SpatialMatchingService {
  private pgClient: Client;

  constructor() {
    this.pgClient = new Client({
      host: process.env.POSTGIS_HOST || 'localhost',
      port: 5432,
      database: 'cropdb',
      user: 'cropuser',
      password: process.env.POSTGIS_PASSWORD
    });
  }

  async connect() {
    await this.pgClient.connect();
  }

  async matchFieldToVillage(fieldId: string, fieldGeoJSON: any) {
    const sql = `
      WITH field AS (
        SELECT ST_GeomFromGeoJSON($1) AS geom
      )
      SELECT 
        v.village_code,
        v.name,
        v.district,
        v.state,
        ROUND((ST_Area(ST_Intersection(f.geom, v.geom)) / 
               ST_Area(f.geom)) * 100) AS overlap_pct
      FROM villages v, field f
      WHERE ST_Intersects(v.geom, f.geom)
      ORDER BY overlap_pct DESC
      LIMIT 1;
    `;

    const result = await this.pgClient.query(sql, [JSON.stringify(fieldGeoJSON)]);
    
    if (result.rows.length === 0) {
      return { matched: false };
    }

    const match = result.rows[0];

    // Update MongoDB field
    await db.collection('fields').updateOne(
      { _id: fieldId },
      {
        $set: {
          village_code: match.village_code,
          village_name: match.name,
          district: match.district,
          state: match.state,
          village_match_confidence: match.overlap_pct
        }
      }
    );

    return {
      matched: true,
      village_code: match.village_code,
      confidence: match.overlap_pct
    };
  }
}
```

### Task 2.4: Add Spatial API

**File: `backend/src/api/spatial.routes.ts`**

```typescript
export const spatialRoutes = new Elysia({ prefix: '/spatial' })
  
  .post('/match-field/:fieldId', async ({ params }) => {
    const field = await db.collection('fields').findOne({ _id: params.fieldId });
    const spatialService = new SpatialMatchingService();
    await spatialService.connect();
    
    const match = await spatialService.matchFieldToVillage(
      params.fieldId,
      field.boundary
    );
    
    return match;
  })
  
  .post('/match-all-fields', async () => {
    const fields = await db.collection('fields')
      .find({ village_code: { $exists: false } })
      .toArray();
    
    const spatialService = new SpatialMatchingService();
    await spatialService.connect();
    
    let matched = 0;
    for (const field of fields) {
      const result = await spatialService.matchFieldToVillage(
        field._id.toString(),
        field.boundary
      );
      if (result.matched) matched++;
    }
    
    return { total: fields.length, matched };
  });
```

### Task 2.5: Update Field Schema

Add these fields to existing `fields` collection:

```typescript
interface Field {
  // ... existing fields
  
  // ADD THESE:
  village_code?: string;
  village_name?: string;
  district?: string;
  state?: string;
  village_match_confidence?: number;
  village_matched_at?: Date;
}
```

---

## 📋 FEATURE 3: GDD ENGINE

### Task 3.1: Update Crop Calendar Schema

Add GDD parameters to `crop_calendars` collection:

```typescript
interface CropCalendar {
  cropName: string;
  baseTemperature: number;      // ADD: e.g., 10°C
  upperThreshold: number;       // ADD: e.g., 30°C
  stages: Array<{
    stage: string;
    gddRequired: number;        // ADD: e.g., 650 GDD
    durationDays: number;
  }>;
}

// Example: Rice crop calendar
{
  cropName: 'Rice (Paddy)',
  baseTemperature: 10,
  upperThreshold: 35,
  stages: [
    { stage: 'SOWING', gddRequired: 0, durationDays: 1 },
    { stage: 'GERMINATION', gddRequired: 150, durationDays: 7 },
    { stage: 'VEGETATIVE', gddRequired: 650, durationDays: 40 },
    { stage: 'FLOWERING', gddRequired: 1200, durationDays: 65 },
    { stage: 'MATURATION', gddRequired: 1600, durationDays: 95 },
    { stage: 'HARVEST', gddRequired: 1800, durationDays: 110 }
  ]
}
```

### Task 3.2: Implement GDD Service

**File: `backend/src/services/gdd.service.ts`**

```typescript
export class GDDService {
  
  async calculateGDD(fieldId: string, cropId: string, startDate: Date) {
    // Get crop parameters
    const crop = await db.collection('crop_calendars').findOne({ cropId });
    const baseTemp = crop.baseTemperature || 10;
    
    // Get field location
    const field = await db.collection('fields').findOne({ _id: fieldId });
    const [lon, lat] = field.centroid.coordinates;
    
    // Get weather history
    const weather = await weatherService.getHistoricalData(lat, lon, startDate, new Date());
    
    // Calculate GDD
    let gddAccumulated = 0;
    for (const day of weather) {
      const avgTemp = (day.maxTemp + day.minTemp) / 2;
      const dailyGDD = Math.max(0, avgTemp - baseTemp);
      gddAccumulated += dailyGDD;
    }
    
    return { gddAccumulated };
  }
  
  async checkStageProgression(fieldId: string) {
    const field = await db.collection('fields').findOne({ _id: fieldId });
    const cropStage = await db.collection('field_crop_stages').findOne({ fieldId });
    
    // Calculate GDD since sowing
    const { gddAccumulated } = await this.calculateGDD(
      fieldId,
      cropStage.cropId,
      cropStage.sowingDate
    );
    
    // Get crop calendar
    const calendar = await db.collection('crop_calendars').findOne({ cropId: cropStage.cropId });
    
    // Find next stage
    const currentIndex = calendar.stages.findIndex(s => s.stage === cropStage.currentStage);
    const nextStage = calendar.stages[currentIndex + 1];
    
    const readyToProgress = gddAccumulated >= nextStage.gddRequired;
    
    return {
      currentStage: cropStage.currentStage,
      gddAccumulated,
      gddRequired: nextStage.gddRequired,
      readyToProgress,
      nextStage: nextStage.stage
    };
  }
  
  async autoProgressStages() {
    const activeFields = await db.collection('fields')
      .find({ 'currentCrop.status': 'ACTIVE' })
      .toArray();
    
    for (const field of activeFields) {
      const check = await this.checkStageProgression(field._id);
      
      if (check.readyToProgress) {
        // Create event
        await eventSourcingService.createEvent({
          eventType: 'STAGE_PROGRESSION',
          timestamp: new Date(),
          farmerId: field.userId,
          plotId: field._id,
          season: field.currentCrop.season,
          payload: {
            before: { stage: check.currentStage },
            after: { stage: check.nextStage, gdd: check.gddAccumulated }
          },
          provenance: {
            source: 'SYSTEM',
            triggeredBy: 'GDD_ENGINE',
            confidence: 95
          }
        });
        
        // Update stage
        await db.collection('field_crop_stages').updateOne(
          { fieldId: field._id },
          { $set: { currentStage: check.nextStage } }
        );
      }
    }
  }
}
```

### Task 3.3: Add GDD API

**File: `backend/src/api/gdd.routes.ts`**

```typescript
export const gddRoutes = new Elysia({ prefix: '/gdd' })
  
  .get('/field/:fieldId/check', async ({ params }) => {
    const gddService = new GDDService();
    const check = await gddService.checkStageProgression(params.fieldId);
    return check;
  })
  
  .post('/auto-progress-all', async () => {
    const gddService = new GDDService();
    await gddService.autoProgressStages();
    return { success: true };
  });
```

### Task 3.4: Frontend Component

**File: `webapp/src/components/GDDProgress.tsx`**

```typescript
export const GDDProgress = ({ fieldId }) => {
  const { data } = useQuery({
    queryKey: ['gdd', fieldId],
    queryFn: () => api.checkGDDProgression(fieldId)
  });

  if (!data) return null;

  const progress = (data.gddAccumulated / data.gddRequired) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crop Progress (GDD-Based)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Current: {data.currentStage}</span>
            <span>Next: {data.nextStage}</span>
          </div>
          <Progress value={progress} />
          <p className="text-sm text-gray-500">
            {Math.round(data.gddAccumulated)}°C-days / {data.gddRequired}°C-days
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
```

### Task 3.5: Cron Job

**File: `worker/src/jobs/gdd-checker.ts`**

```typescript
import cron from 'node-cron';

const gddService = new GDDService();

// Run daily at 6 AM
cron.schedule('0 6 * * *', async () => {
  console.log('Running GDD check...');
  await gddService.autoProgressStages();
  console.log('GDD check complete');
});
```

---

## 🎯 IMPLEMENTATION ORDER

### Phase 1: Event Sourcing (Days 1-3)
1. Create MongoDB collections (`events`, `digital_twins`)
2. Implement `EventSourcingService`
3. Add API endpoints (`/events/*`)
4. Build `EventTimeline` component
5. Test with irrigation events

### Phase 2: PostGIS (Days 4-6)
1. Add PostGIS to `docker-compose.yml`
2. Create schema (`villages`, `village_acreage`)
3. Implement `SpatialMatchingService`
4. Add API endpoints (`/spatial/*`)
5. Match existing fields
6. Verify 70%+ match confidence

### Phase 3: GDD Engine (Days 7-9)
1. Update `crop_calendars` with GDD data
2. Implement `GDDService`
3. Add API endpoints (`/gdd/*`)
4. Build `GDDProgress` component
5. Create cron job
6. Test auto-progression

---

## ✅ ACCEPTANCE CRITERIA

**Event Sourcing:**
- [ ] `events` collection created with indexes
- [ ] Can create events via API
- [ ] Digital twin state reconstructs from events
- [ ] Frontend displays event timeline
- [ ] At least 10 events created

**PostGIS:**
- [ ] PostGIS running in Docker
- [ ] Villages table created
- [ ] At least 100 villages loaded
- [ ] Fields matched with 70%+ confidence
- [ ] API returns village match data

**GDD Engine:**
- [ ] Crop calendars have GDD thresholds
- [ ] GDD calculation works
- [ ] Auto-progression cron job runs
- [ ] Frontend shows GDD progress
- [ ] At least 1 crop progressed via GDD

---

## 🚀 VERIFICATION COMMANDS

After implementation, run these:

```bash
# Check MongoDB collections
mongosh cropdb --eval "db.events.countDocuments()"
mongosh cropdb --eval "db.digital_twins.countDocuments()"

# Check PostGIS
docker-compose exec postgis psql -U cropuser -d cropdb -c "SELECT COUNT(*) FROM villages;"

# Test APIs
curl http://localhost:3000/events/plot/FIELD_ID/season/KHARIF-2024
curl http://localhost:3000/spatial/match-field/FIELD_ID
curl http://localhost:3000/gdd/field/FIELD_ID/check
```

---

## 📦 REQUIRED DEPENDENCIES

Add to `backend/package.json`:
```json
{
  "dependencies": {
    "pg": "^8.11.3",
    "uuid": "^9.0.1"
  }
}
```

Add to `worker/package.json`:
```json
{
  "dependencies": {
    "node-cron": "^3.0.3"
  }
}
```

---

## 🎓 KEY CONCEPTS

**Event Sourcing:**
- Every action is stored as an immutable event
- Current state is rebuilt by replaying events
- Enables time-travel debugging and audit trails

**PostGIS:**
- Spatial database extension for PostgreSQL
- Stores and queries geographic data (polygons)
- Matches field boundaries to village boundaries

**GDD (Growing Degree Days):**
- Temperature-based crop development metric
- Formula: `GDD = max(0, avgTemp - baseTemp)`
- More accurate than calendar-based progression

---

**IMPLEMENTATION NOTE:** Please implement all 3 features in the order specified. Test each feature independently before moving to the next. Use the existing MongoDB connection and add PostGIS as a new service in Docker Compose.
