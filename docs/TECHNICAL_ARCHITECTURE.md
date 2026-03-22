# Technical Architecture: Crop-Based Farming Platform

## Multi-Tenant Precision Agriculture SaaS Platform

---

## 1. Executive Overview

A scalable, enterprise-grade farming platform enabling AI-driven crop lifecycle management, precision agriculture, and SAP ERP integration. Designed to support 10,000+ farmers managing 500,000+ acres with real-time weather monitoring, pest prediction, and crop-stage recommendations.

---

## 2. High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[("Web App<br/>React + Vite PWA")]
        MOB[("Mobile App<br/>Capacitor Native")]
    end

    subgraph "Edge & CDN"
        CF[Cloudflare CDN<br/>SSL + WAF + DDoS]
    end

    subgraph "API Gateway Layer"
        NGINX[Nginx Reverse Proxy<br/>Rate Limiting + CORS + Load Balancing]
    end

    subgraph "Backend Services (Microservices)"
        AUTH[Auth Service<br/>JWT + OTP + RBAC]
        FARM[Farm Service<br/>CRUD + GeoJSON]
        CROP[Crop Service<br/>Lifecycle + Stages]
        WEATHER[Weather Service<br/>Real-time + Forecast]
        PEST[Pest Service<br/>AI Detection + Risk]
        SOIL[Soil Service<br/>NPK Analysis]
        ADVISORY[Advisory Service<br/>Recommendations]
        NOTIF[Notification Service<br/>Push + SMS + Email]
        DASHBOARD[Dashboard Service<br/>Analytics + KPIs]
        SAP[SAP Integration Service<br/>OData + Sync]
    end

    subgraph "Message Queue"
        RABBIT[RabbitMQ<br/>Event-Driven Architecture]
    end

    subgraph "Data Layer"
        MONGO[(MongoDB Atlas<br/>Primary Database)]
        REDIS[(Redis<br/>Cache + Session + Queue)]
        S3[(AWS S3 / Cloudinary<br/>File Storage)]
    end

    subgraph "External Services"
        WEATHER_API[Weather API<br/>OpenWeatherMap]
        AI_MODEL[AI/ML Service<br/>Pest Detection + Yield Prediction]
        GIS[GIS/Satellite<br/>NDVI + Imagery]
        SAP_ERP[SAP ERP<br/>Master Data + Sync]
        SMS[Twilio/SMS Gateway]
        FCM[Firebase Cloud Messaging]
    end

    WEB --> CF
    MOB --> CF
    CF --> NGINX
    NGINX --> AUTH
    NGINX --> FARM
    NGINX --> CROP
    NGINX --> WEATHER
    NGINX --> PEST
    NGINX --> SOIL
    NGINX --> ADVISORY
    NGINX --> NOTIF
    NGINX --> DASHBOARD
    NGINX --> SAP

    AUTH --> MONGO
    AUTH --> REDIS
    FARM --> MONGO
    CROP --> MONGO
    WEATHER --> REDIS
    WEATHER --> MONGO
    PEST --> MONGO
    PEST --> AI_MODEL
    SOIL --> MONGO
    ADVISORY --> MONGO
    NOTIF --> RABBIT
    DASHBOARD --> MONGO
    SAP --> SAP_ERP

    RABBIT --> NOTIF
    NOTIF --> SMS
    NOTIF --> FCM

    WEATHER --> WEATHER_API
    FARM --> GIS
    CROP --> GIS

    S3 --> PEST
```

---

## 3. Technology Stack

### 3.1 Frontend Layer

| Component | Technology | Purpose |
|-----------|------------|---------|
| Framework | React 18.2+ | Component-based UI |
| Build Tool | Vite 5.x | Fast development & bundling |
| Language | TypeScript 5.x | Type safety |
| Styling | Tailwind CSS 3.x | Utility-first CSS |
| UI Components | shadcn/ui + Radix UI | Accessible component library |
| State (Global) | Zustand 4.x | Lightweight state management |
| State (Server) | TanStack Query 5.x | API caching & sync |
| Routing | React Router 6.x | SPA navigation |
| Forms | React Hook Form + Zod | Form handling + validation |
| Maps | Mapbox GL JS / Leaflet | GIS visualization |
| Charts | Recharts | Dashboard visualizations |
| PWA | Vite PWA Plugin | Offline support |
| Mobile Native | Capacitor 5.x | Native device features |

### 3.2 Backend Layer

| Component | Technology | Purpose |
|-----------|------------|---------|
| Runtime | Bun 1.x | Fast JavaScript runtime |
| Framework | Elysia 1.x | High-performance HTTP framework |
| Language | TypeScript 5.x | Type safety |
| Validation | Zod | Runtime schema validation |
| Authentication | JWT (jose library) | Token-based auth |
| WebSocket | Elysia WebSocket Plugin | Real-time notifications |
| API Docs | Elysia Swagger Plugin | OpenAPI specification |

### 3.3 Data Layer

| Component | Technology | Purpose |
|-----------|------------|---------|
| Primary Database | MongoDB 7.x (Atlas) | Document store + GeoJSON |
| Caching | Redis 7.x (Upstash/ElastiCache) | Session + API cache |
| Message Queue | RabbitMQ 3.x (CloudAMQP) | Async event processing |
| File Storage | AWS S3 / Cloudinary | Images + documents |
| Search | MongoDB Atlas Search | Full-text search |

### 3.4 DevOps & Infrastructure

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend Hosting | Vercel / Netlify | Edge deployment |
| Backend Hosting | Railway / Fly.io / AWS ECS | Container hosting |
| Database | MongoDB Atlas | Managed database |
| CI/CD | GitHub Actions | Automated pipelines |
| Monitoring | Sentry + Axiom + Uptime Robot | Errors + logs + uptime |
| CDN | Cloudflare | Asset delivery + security |
| SSL | Let's Encrypt / Cloudflare | TLS certificates |

---

## 4. Microservices Architecture

### 4.1 Service Breakdown

```mermaid
graph LR
    subgraph "Core Services"
        A1[Auth Service]
        A2[User Service]
    end

    subgraph "Domain Services"
        B1[Farm Service]
        B2[Field Service]
        B3[Crop Service]
        B4[Soil Service]
        B5[Pest Service]
    end

    subgraph "Intelligence Services"
        C1[Weather Service]
        C2[Advisory Service]
        C3[Analytics Service]
        C4[AI/ML Gateway]
    end

    subgraph "Infrastructure Services"
        D1[Notification Service]
        D2[File Upload Service]
        D3[SAP Integration Service]
    end
```

### 4.2 Service Specifications

| Service | Responsibilities | Endpoints | Scale Priority |
|---------|-----------------|-----------|----------------|
| **Auth Service** | Registration, OTP, JWT, Session | `/auth/*` | High |
| **User Service** | Profiles, Roles, Permissions | `/users/*` | Medium |
| **Farm Service** | Farm CRUD, GPS location | `/farms/*` | High |
| **Field Service** | Field boundaries, GeoJSON, Area | `/fields/*` | High |
| **Crop Service** | Crop lifecycle, Stage progression | `/crop-stages/*` | High |
| **Soil Service** | Soil reports, NPK analysis | `/soil/*` | Medium |
| **Pest Service** | Incident reporting, AI detection | `/pest/*` | High |
| **Weather Service** | Current + Forecast, Alerts | `/weather/*` | High |
| **Advisory Service** | Stage recommendations | `/advisories/*` | Medium |
| **Analytics Service** | Dashboards, KPIs, Reports | `/dashboard/*` | Medium |
| **Notification Service** | Push, SMS, Email, WebSocket | `/notifications/*` | High |
| **SAP Integration** | Master data sync, Yield push | `/integration/sap/*` | Low |

### 4.3 Inter-Service Communication

```mermaid
sequenceDiagram
    participant Client
    participant Gateway as API Gateway
    participant Auth as Auth Service
    participant Pest as Pest Service
    participant AI as AI/ML Service
    participant Queue as RabbitMQ
    participant Notif as Notification Service

    Client->>Gateway: POST /pest/report (image + data)
    Gateway->>Auth: Validate JWT
    Auth-->>Gateway: User context
    Gateway->>Pest: Forward request
    Pest->>AI: Identify pest (image URL)
    AI-->>Pest: {pestId, confidence, severity}
    Pest->>Pest: Store incident in MongoDB
    Pest->>Queue: Publish pest.detected event
    Queue->>Notif: Consume event
    Notif->>Client: Push notification
    Pest-->>Client: {pestId, treatment recommendations}
```

---

## 5. Database Architecture

### 5.1 MongoDB Collections Overview

```mermaid
erDiagram
    USERS ||--o{ FARMS : owns
    USERS ||--o{ SESSIONS : has
    USERS ||--o{ NOTIFICATIONS : receives
    
    FARMS ||--o{ FIELDS : contains
    FARMS }|--|| ADDRESSES : located_at
    
    FIELDS ||--o{ FIELD_CROP_STAGES : tracks
    FIELDS ||--o{ SOIL_REPORTS : has
    FIELDS ||--o{ PEST_INCIDENTS : has
    FIELDS ||--o{ WEATHER_SNAPSHOTS : monitors
    FIELDS ||--o{ WEATHER_ALERTS : receives
    FIELDS ||--o{ ACTIVITIES : logs
    FIELDS ||--o{ FIELD_IMAGES : stores
    
    CROPS_MASTER ||--o{ CROP_CALENDARS : defines
    CROPS_MASTER ||--o{ FIELD_CROP_STAGES : planted_as
    
    CROP_CALENDARS ||--o{ ADVISORIES : generates
    
    PEST_MASTER ||--o{ PEST_INCIDENTS : identified_as
    PEST_MASTER ||--o{ TREATMENTS : recommends
    
    YIELD_ESTIMATES }|--|| FIELDS : forecasts_for
```

### 5.2 Collection Specifications

#### Core Collections

| Collection | Purpose | Key Indexes | TTL |
|------------|---------|-------------|-----|
| `users` | User accounts | `mobile`, `email`, `role` | - |
| `sessions` | JWT refresh tokens | `userId`, `refreshToken` | 30 days |
| `farms` | Farm records | `userId`, `location (2dsphere)` | - |
| `fields` | Field boundaries | `farmId`, `boundary (2dsphere)` | - |

#### Crop Management Collections

| Collection | Purpose | Key Indexes | TTL |
|------------|---------|-------------|-----|
| `crops_master` | Crop reference data | `sapCropCode`, `name` | - |
| `crop_calendars` | Stage definitions | `cropId` | - |
| `field_crop_stages` | Active crop tracking | `fieldId + season`, `cropId + stage` | - |
| `activities` | Field activity logs | `fieldId + type + date` | - |

#### Intelligence Collections

| Collection | Purpose | Key Indexes | TTL |
|------------|---------|-------------|-----|
| `soil_reports` | Soil test results | `fieldId + date`, `status` | - |
| `weather_snapshots` | Weather history | `fieldId + timestamp` | 90 days |
| `weather_alerts` | Weather warnings | `fieldId + severity` | - |
| `pest_incidents` | Pest reports | `fieldId + pestId + status` | - |
| `yield_estimates` | AI predictions | `fieldId + season` | - |

#### System Collections

| Collection | Purpose | Key Indexes | TTL |
|------------|---------|-------------|-----|
| `notifications` | User notifications | `userId + createdAt`, `status` | 30 days |
| `audit_logs` | Security audit trail | `userId + timestamp`, `resource` | 1 year |
| `sap_sync_logs` | Integration logs | `entity + timestamp`, `status` | 90 days |

---

## 6. Event-Driven Architecture

### 6.1 RabbitMQ Exchanges & Queues

```mermaid
graph LR
    subgraph "Exchanges"
        E1[notifications<br/>topic]
        E2[weather.alerts<br/>fanout]
        E3[pest.alerts<br/>topic]
        E4[crop.stages<br/>topic]
        E5[sap.sync<br/>topic]
    end

    subgraph "Queues"
        Q1[notification.queue]
        Q2[weather.alert.queue]
        Q3[pest.notification.queue]
        Q4[stage.change.queue]
        Q5[sap.inbound.queue]
        Q6[sap.outbound.queue]
    end

    E1 --> Q1
    E2 --> Q2
    E3 --> Q3
    E4 --> Q4
    E5 --> Q5
    E5 --> Q6
```

### 6.2 Event Types

| Exchange | Routing Key Pattern | Event Type | Consumers |
|----------|---------------------|------------|-----------|
| `notifications` | `user.{userId}` | User-specific events | Notification Service |
| `weather.alerts` | `*` (fanout) | Weather anomalies | Notification, Advisory |
| `pest.alerts` | `pest.{severity}` | Pest detections | Notification, Analytics |
| `crop.stages` | `stage.{stageName}` | Stage transitions | Advisory, Notification |
| `sap.sync` | `sap.{direction}.{entity}` | Data sync events | SAP Integration |

### 6.3 Event Message Format

```typescript
interface EventMessage<T> {
  eventId: string;        // UUID
  eventType: string;      // e.g., "pest.detected"
  timestamp: Date;
  source: string;         // Service name
  version: string;        // Schema version
  correlationId?: string; // For tracing
  payload: T;
}

// Example: Pest Detection Event
interface PestDetectedPayload {
  fieldId: string;
  pestId: string;
  pestName: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  affectedArea: number;
  images: string[];
}
```

---

## 7. AI/ML Services

### 7.1 AI Service Architecture

```mermaid
graph TB
    subgraph "AI Gateway Service"
        GW[AI Gateway<br/>Request Routing]
    end

    subgraph "AI Models"
        M1[Pest Detection Model<br/>CNN Image Classification]
        M2[Disease Detection Model<br/>Image Segmentation]
        M3[Yield Prediction Model<br/>Time Series + Features]
        M4[Pest Risk Model<br/>Weather + Historical]
    end

    subgraph "Model Infrastructure"
        INF[Model Serving<br/>TensorFlow Serving / SageMaker]
        GPU[GPU Instances<br/>Inference Acceleration]
    end

    GW --> M1
    GW --> M2
    GW --> M3
    GW --> M4
    M1 --> INF
    M2 --> INF
    M3 --> INF
    M4 --> INF
    INF --> GPU
```

### 7.2 AI Model Specifications

| Model | Purpose | Input | Output | Latency Target |
|-------|---------|-------|--------|----------------|
| **Pest Detection** | Identify pest from images | Image URL | `{pestId, confidence, bbox}` | < 3s |
| **Disease Detection** | Identify plant diseases | Image URL | `{diseaseId, affectedArea}` | < 3s |
| **Yield Prediction** | Forecast crop yield | Field metrics + weather | `{yield, confidence, factors}` | < 1s |
| **Risk Assessment** | Calculate pest risk score | Weather + history | `{riskScore, factors}` | < 500ms |

### 7.3 AI Integration Flow

```typescript
// AI Service Integration
interface AIServiceConfig {
  endpoint: string;
  apiKey: string;
  timeout: number;
  retryPolicy: {
    maxRetries: number;
    backoffMs: number;
  };
}

// Model Request/Response
interface PestDetectionRequest {
  imageUrl: string;
  cropType?: string;
  location?: { lat: number; lng: number };
}

interface PestDetectionResponse {
  pestId: string;
  pestName: string;
  scientificName: string;
  confidence: number;  // 0-100
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  needsReview: boolean;  // confidence < 70
  boundingBoxes: Array<{
    x: number; y: number;
    width: number; height: number;
  }>;
  treatments: Treatment[];
}
```

---

## 8. Security Architecture

### 8.1 Security Layers

```mermaid
graph TB
    subgraph "Edge Security"
        WAF[Cloudflare WAF<br/>DDoS + Bot Protection]
        SSL[TLS 1.3<br/>Encryption in Transit]
    end

    subgraph "Application Security"
        RATE[Rate Limiting<br/>100 req/min per IP]
        AUTH[JWT Authentication<br/>15min access + 30d refresh]
        RBAC[Role-Based Access<br/>8 User Roles]
        VALID[Input Validation<br/>Zod Schemas]
    end

    subgraph "Data Security"
        ENCRYPT[Field Encryption<br/>AES-256 for PII]
        AUDIT[Audit Logging<br/>All Sensitive Operations]
        BACKUP[Encrypted Backups<br/>MongoDB Atlas]
    end

    WAF --> SSL --> RATE --> AUTH --> RBAC --> VALID --> ENCRYPT
```

### 8.2 Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant App
    participant Auth as Auth Service
    participant Redis
    participant DB as MongoDB

    User->>App: Enter mobile number
    App->>Auth: POST /auth/login {mobile}
    Auth->>Auth: Generate 6-digit OTP
    Auth->>Redis: Store OTP (5min TTL)
    Auth->>SMS: Send OTP via Twilio
    Auth-->>App: {otpSent: true}
    
    User->>App: Enter OTP
    App->>Auth: POST /auth/verify-otp {mobile, otp}
    Auth->>Redis: Verify OTP
    Auth->>DB: Get user profile
    Auth->>Auth: Generate JWT tokens
    Auth->>DB: Store refresh token
    Auth-->>App: {accessToken, refreshToken, user}
```

### 8.3 RBAC Permission Matrix

| Role | Farms | Fields | Advisories | Pest Reports | Dashboards | Master Data |
|------|-------|--------|------------|--------------|------------|-------------|
| `FARMER` | Own | Own | Read | Create/Read | Basic | - |
| `SALES` | Team | Team | Read | Read | Basic | Read |
| `TM` | Region | Region | Read | Read/Update | Regional | Read |
| `AGRONOMIST` | Region | Region | Create/Approve | Review/Validate | Regional | Read |
| `MANAGER` | Region | Region | Read | Read | Regional | Read |
| `CXO` | All | All | Read | Read | Executive | Read |
| `ADMIN` | All | All | All | All | All | Full |
| `SUPER_ADMIN` | All | All | All | All | All | Full |

### 8.4 Security Configurations

```typescript
// JWT Configuration
const JWT_CONFIG = {
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '30d',
  algorithm: 'HS256',
  issuer: 'crop-platform-api',
  audience: 'crop-platform-app'
};

// Rate Limiting
const RATE_LIMITS = {
  global: { duration: 60000, max: 100 },          // 100 req/min
  auth: { duration: 60000, max: 10 },             // 10 auth attempts/min
  upload: { duration: 60000, max: 20 },           // 20 uploads/min
  aiPrediction: { duration: 60000, max: 30 }      // 30 AI calls/min
};

// Input Validation (Zod)
const mobileSchema = z.string().regex(/^[6-9]\d{9}$/);
const emailSchema = z.string().email();
const pincodeSchema = z.string().regex(/^\d{6}$/);
const coordinateSchema = z.tuple([z.number(), z.number()]);
```

---

## 9. External Integrations

### 9.1 Integration Architecture

```mermaid
graph LR
    subgraph "Crop Platform"
        CORE[Core Services]
        INT[Integration Layer]
    end

    subgraph "Weather Services"
        OW[OpenWeatherMap<br/>Current + Forecast]
        WA[WeatherAPI<br/>Historical Data]
    end

    subgraph "GIS Services"
        MB[Mapbox<br/>Maps + Geocoding]
        SAT[Satellite Provider<br/>NDVI Imagery]
    end

    subgraph "Communication"
        TW[Twilio<br/>SMS/Voice]
        FCM[Firebase<br/>Push Notifications]
        SG[SendGrid<br/>Email]
    end

    subgraph "Enterprise"
        SAP[SAP ERP<br/>Master Data + Sync]
    end

    CORE --> INT
    INT --> OW
    INT --> WA
    INT --> MB
    INT --> SAT
    INT --> TW
    INT --> FCM
    INT --> SG
    INT --> SAP
```

### 9.2 SAP ERP Integration

#### Data Flows

| Direction | Entity | Frequency | Trigger |
|-----------|--------|-----------|---------|
| **Inbound** | Crop Master | Daily | Scheduled job |
| **Inbound** | Product Catalog | Daily | Scheduled job |
| **Inbound** | Region Hierarchy | Weekly | Scheduled job |
| **Inbound** | Pricing | Real-time | SAP webhook |
| **Outbound** | Acreage Data | Weekly | Scheduled job |
| **Outbound** | Yield Forecast | On-demand | API trigger |
| **Outbound** | Demand Signals | Real-time | Event-driven |
| **Outbound** | Pest Summary | Weekly | Scheduled job |

#### SAP OData Endpoints

```
Inbound:
  GET /sap/opu/odata/sap/ZCROP_MASTER_SRV/CropMasterSet
  GET /sap/opu/odata/sap/ZPRODUCT_SRV/ProductSet
  GET /sap/opu/odata/sap/ZREGION_SRV/RegionSet

Outbound:
  POST /sap/opu/odata/sap/ZYIELD_FORECAST_SRV/YieldForecastSet
  POST /sap/opu/odata/sap/ZACREAGE_SRV/AcreageDataSet
```

### 9.3 Weather API Integration

```typescript
// Weather Service Configuration
const WEATHER_CONFIG = {
  providers: {
    primary: {
      name: 'OpenWeatherMap',
      baseUrl: 'https://api.openweathermap.org/data/3.0',
      features: ['current', 'forecast', 'alerts']
    },
    fallback: {
      name: 'WeatherAPI',
      baseUrl: 'https://api.weatherapi.com/v1',
      features: ['current', 'forecast', 'history']
    }
  },
  caching: {
    currentWeather: 300,     // 5 minutes
    forecast: 3600,          // 1 hour
    historical: 86400        // 1 day
  },
  alertThresholds: {
    temperature: { min: 10, max: 40 },  // °C
    rainfall: { heavy: 50, extreme: 100 },  // mm
    windSpeed: { high: 30, storm: 50 }  // km/h
  }
};
```

---

## 10. Scalability & Performance

### 10.1 Scaling Strategy

| Component | Horizontal Scaling | Vertical Scaling | Auto-Scale Trigger |
|-----------|-------------------|------------------|-------------------|
| API Gateway | ✅ Load balanced | - | CPU > 70% |
| Backend Services | ✅ Container replicas | - | Requests > 1000/s |
| MongoDB | ✅ Sharding | ✅ Tier upgrade | Storage > 80% |
| Redis | ✅ Cluster mode | ✅ Memory upgrade | Memory > 80% |
| RabbitMQ | ✅ Cluster | - | Queue depth > 10k |

### 10.2 Caching Strategy

```mermaid
graph LR
    subgraph "Cache Layers"
        L1[Client Cache<br/>TanStack Query<br/>5 min stale]
        L2[CDN Cache<br/>Cloudflare<br/>Static assets]
        L3[API Cache<br/>Redis<br/>Dynamic data]
        L4[DB Cache<br/>MongoDB Atlas<br/>Query cache]
    end

    L1 --> L2 --> L3 --> L4
```

| Data Type | Cache Location | TTL | Invalidation |
|-----------|---------------|-----|--------------|
| User session | Redis | 15 min | On logout |
| User permissions | Redis | 15 min | On role change |
| Current weather | Redis | 5 min | Time-based |
| Weather forecast | Redis | 1 hour | Time-based |
| Crop calendars | Redis | 1 day | On update |
| Static assets | CDN | 1 year | Version hash |

### 10.3 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response Time (p50) | < 100ms | Gateway metrics |
| API Response Time (p99) | < 500ms | Gateway metrics |
| Page Load Time | < 2s (3G) | Lighthouse |
| Time to First Byte | < 200ms | CDN metrics |
| Database Query Time | < 50ms | MongoDB profiler |
| AI Inference Time | < 3s | Model serving metrics |
| Uptime | 99.9% | Uptime Robot |

---

## 11. Monitoring & Observability

### 11.1 Monitoring Stack

```mermaid
graph TB
    subgraph "Collection"
        APPS[Application Logs]
        METRICS[Performance Metrics]
        TRACES[Distributed Traces]
    end

    subgraph "Processing"
        SENTRY[Sentry<br/>Error Tracking]
        AXIOM[Axiom<br/>Log Aggregation]
        UPTIME[Uptime Robot<br/>Availability]
    end

    subgraph "Alerting"
        SLACK[Slack]
        EMAIL[Email]
        PAGER[PagerDuty]
    end

    APPS --> AXIOM
    APPS --> SENTRY
    METRICS --> AXIOM
    TRACES --> SENTRY
    AXIOM --> SLACK
    SENTRY --> SLACK
    UPTIME --> EMAIL
    UPTIME --> PAGER
```

### 11.2 Key Metrics Dashboard

| Category | Metrics | Alert Threshold |
|----------|---------|-----------------|
| **API Health** | Request rate, Error rate, Latency | Error > 1%, P99 > 1s |
| **Database** | Connections, Query time, Disk usage | Disk > 80% |
| **Queue** | Message rate, Queue depth, Consumer lag | Depth > 10k |
| **Cache** | Hit rate, Memory usage, Evictions | Hit < 80% |
| **Business** | Active users, Pest reports, Advisory adoption | Anomaly detection |

---

## 12. Deployment Architecture

### 12.1 Environment Strategy

| Environment | Purpose | Data | Access |
|-------------|---------|------|--------|
| **Development** | Local development | Mock/Sample | Developers |
| **Staging** | Pre-production testing | Anonymized prod copy | QA + Devs |
| **Production** | Live system | Real data | All users |

### 12.2 CI/CD Pipeline

```mermaid
graph LR
    subgraph "Source"
        GIT[GitHub<br/>main branch]
    end

    subgraph "Build"
        TEST[Run Tests<br/>Unit + Integration]
        BUILD[Build Artifacts<br/>Docker Images]
        SCAN[Security Scan<br/>Vulnerabilities]
    end

    subgraph "Deploy"
        STAGE[Deploy Staging]
        E2E[E2E Tests]
        PROD[Deploy Production]
    end

    GIT --> TEST --> BUILD --> SCAN
    SCAN --> STAGE --> E2E --> PROD
```

### 12.3 Infrastructure as Code

```yaml
# Docker Compose (Development)
services:
  api:
    build: ./backend
    ports: ["3000:3000"]
    environment:
      - MONGODB_URI
      - REDIS_URL
      - RABBITMQ_URL
    depends_on:
      - mongodb
      - redis
      - rabbitmq

  frontend:
    build: ./frontend
    ports: ["5173:5173"]

  mongodb:
    image: mongo:7
    volumes: ["mongo_data:/data/db"]

  redis:
    image: redis:7-alpine

  rabbitmq:
    image: rabbitmq:3-management
    ports: ["5672:5672", "15672:15672"]
```

---

## 13. Disaster Recovery

### 13.1 Backup Strategy

| Component | Frequency | Retention | Recovery Time |
|-----------|-----------|-----------|---------------|
| MongoDB | Continuous (Atlas) | 30 days | < 1 hour |
| Redis | Daily snapshot | 7 days | < 15 min |
| S3 Files | Cross-region replication | Indefinite | < 30 min |
| Configurations | Version controlled | Indefinite | < 5 min |

### 13.2 Recovery Procedures

| Scenario | RTO | RPO | Procedure |
|----------|-----|-----|-----------|
| Service failure | 5 min | 0 | Auto-restart + health checks |
| Database failure | 1 hour | 0 | Atlas automatic failover |
| Region outage | 4 hours | 1 hour | Cross-region deployment |
| Data corruption | 2 hours | 24 hours | Point-in-time recovery |

---

## Appendix A: Environment Variables

```bash
# Application
NODE_ENV=production
PORT=3000
API_VERSION=v1

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/cropdb
REDIS_URL=redis://user:pass@redis.upstash.io:6379
RABBITMQ_URL=amqps://user:pass@crane.rmq.cloudamqp.com/vhost

# Authentication
JWT_SECRET=<256-bit-secret>
JWT_REFRESH_SECRET=<256-bit-secret>
ENCRYPTION_KEY=<32-byte-key>

# External APIs
WEATHER_API_KEY=<openweathermap-key>
MAPBOX_TOKEN=<mapbox-public-token>
AI_MODEL_ENDPOINT=https://ai.cropplatform.com

# File Storage
AWS_ACCESS_KEY_ID=<aws-key>
AWS_SECRET_ACCESS_KEY=<aws-secret>
S3_BUCKET_NAME=crop-platform-files
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# SAP Integration
SAP_ODATA_URL=https://sap-erp.company.com/sap/opu/odata/sap
SAP_USERNAME=<sap-user>
SAP_PASSWORD=<sap-password>

# Notifications
FCM_SERVER_KEY=<firebase-key>
TWILIO_ACCOUNT_SID=<twilio-sid>
TWILIO_AUTH_TOKEN=<twilio-token>
TWILIO_PHONE=+1234567890
SENDGRID_API_KEY=<sendgrid-key>

# Monitoring
SENTRY_DSN=https://key@sentry.io/project
AXIOM_TOKEN=<axiom-token>
```

---

## Appendix B: Quick Reference

### Service Ports

| Service | Port | Protocol |
|---------|------|----------|
| API Gateway | 3000 | HTTP/WS |
| MongoDB | 27017 | TCP |
| Redis | 6379 | TCP |
| RabbitMQ | 5672 | AMQP |
| RabbitMQ Management | 15672 | HTTP |

### API Base URLs

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:3000` |
| Staging | `https://api-staging.cropplatform.com` |
| Production | `https://api.cropplatform.com` |
