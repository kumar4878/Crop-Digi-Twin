# Functional Specification Document (FSD)
## Crop-Based Farming Enterprise SaaS Platform
### Version 2.0 - Tech Stack Aligned

---

## 📋 Document Control

| Attribute | Details |
|-----------|---------|
| **Version** | 2.0 |
| **Date** | February 2026 |
| **Status** | Production Ready |
| **Owner** | Product & Engineering |

---

## 🎯 1. Executive Summary

*(For detailed V2 architecture and the Crop Digitwin Platform specifications, please refer to [v2/docs/Technical_Specification.md](./v2/docs/Technical_Specification.md))*

### 1.1 Platform Purpose
Multi-tenant SaaS platform enabling AI-driven crop lifecycle management, precision agriculture, and enterprise-grade farming operations with SAP ERP integration.

### 1.2 Target Users
- **Farmers**: 10,000+ users managing 500,000+ acres
- **Agronomists**: Field advisory and validation
- **Territory Managers**: Regional oversight
- **CXO/Leadership**: Strategic decision-making

### 1.3 Core Value Proposition
- 40% reduction in crop loss through early pest detection
- 25% water savings via smart irrigation
- Real-time SAP synchronization for demand planning
- Mobile-first field operations

---

## 🏗️ 2. Technology Architecture

### 2.1 Tech Stack Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND LAYER                          │
│  React 18 + Vite + TanStack Query + Zustand + Tailwind    │
│  PWA Support | Offline Capabilities | Responsive Design    │
└─────────────────────────────────────────────────────────────┘
                              ↕ HTTPS/WSS
┌─────────────────────────────────────────────────────────────┐
│                     API GATEWAY                             │
│              Nginx + Rate Limiting + CORS                   │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND SERVICES                          │
│        Elysia (Bun) + TypeScript + WebSocket               │
│     JWT Auth | RBAC | Input Validation (Zod)               │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌──────────────┬──────────────┬──────────────┬───────────────┐
│   MongoDB    │  Redis       │  RabbitMQ    │  S3/Cloudinary│
│   Database   │  Cache/Queue │  Event Queue │  File Storage │
└──────────────┴──────────────┴──────────────┴───────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                 EXTERNAL INTEGRATIONS                       │
│  SAP ERP | Weather API | AI/ML Service | GIS/Satellite     │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack Details

#### Frontend Stack
```typescript
{
  "framework": "React 18.2+",
  "buildTool": "Vite 5.x",
  "styling": "Tailwind CSS 3.x",
  "stateManagement": {
    "global": "Zustand 4.x",
    "server": "TanStack Query (React Query) 5.x"
  },
  "routing": "React Router 6.x",
  "forms": "React Hook Form + Zod",
  "maps": "Mapbox GL JS / Leaflet",
  "charts": "Recharts / Chart.js",
  "ui": "shadcn/ui + Radix UI",
  "icons": "Lucide React",
  "mobile": "PWA + Capacitor (optional native)"
}
```

#### Backend Stack
```typescript
{
  "runtime": "Bun 1.x",
  "framework": "Elysia 1.x",
  "language": "TypeScript 5.x",
  "validation": "Zod",
  "authentication": "JWT (jose library)",
  "websocket": "Elysia WebSocket plugin",
  "documentation": "Elysia Swagger plugin"
}
```

#### Database & Storage
```typescript
{
  "primary": "MongoDB 7.x (Atlas)",
  "cache": "Redis 7.x (Upstash/ElastiCache)",
  "messageQueue": "RabbitMQ 3.x (CloudAMQP)",
  "fileStorage": "AWS S3 / Cloudinary",
  "search": "MongoDB Atlas Search"
}
```

#### DevOps & Infrastructure
```typescript
{
  "hosting": {
    "frontend": "Vercel / Netlify",
    "backend": "Railway / Fly.io / AWS ECS",
    "database": "MongoDB Atlas"
  },
  "cicd": "GitHub Actions",
  "monitoring": "Sentry (errors) + Axiom (logs) + Uptime Robot",
  "cdn": "Cloudflare",
  "ssl": "Let's Encrypt / Cloudflare SSL"
}
```

---

## 👥 3. User Roles & Access Matrix

### 3.1 Role Definitions

| Role | ID | Permissions | Typical Count |
|------|-----|-------------|---------------|
| **Super Admin** | `SUPER_ADMIN` | Full system access | 2-5 |
| **Admin** | `ADMIN` | Master data, user management | 10-20 |
| **CXO** | `CXO` | Dashboard, reports, analytics | 5-10 |
| **Manager** | `MANAGER` | Regional oversight, approvals | 50-100 |
| **Agronomist** | `AGRONOMIST` | Advisory creation, validation | 100-200 |
| **Territory Manager** | `TM` | Field monitoring, reports | 200-500 |
| **Sales** | `SALES` | Farmer support, basic insights | 500-1000 |
| **Farmer** | `FARMER` | Farm operations, alerts | 10,000+ |

### 3.2 Access Control Matrix

```typescript
// Permission Structure
interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete' | 'approve')[];
  scope: 'own' | 'team' | 'region' | 'all';
}

// RBAC Configuration
const rolePermissions: Record<Role, Permission[]> = {
  FARMER: [
    { resource: 'farms', actions: ['create', 'read', 'update'], scope: 'own' },
    { resource: 'fields', actions: ['create', 'read', 'update'], scope: 'own' },
    { resource: 'advisories', actions: ['read'], scope: 'own' },
    { resource: 'alerts', actions: ['read'], scope: 'own' },
    { resource: 'pest-reports', actions: ['create', 'read'], scope: 'own' }
  ],
  AGRONOMIST: [
    { resource: 'advisories', actions: ['create', 'read', 'update', 'approve'], scope: 'region' },
    { resource: 'pest-reports', actions: ['read', 'update'], scope: 'region' },
    { resource: 'soil-reports', actions: ['read', 'update'], scope: 'region' }
  ],
  CXO: [
    { resource: 'dashboards', actions: ['read'], scope: 'all' },
    { resource: 'reports', actions: ['read'], scope: 'all' },
    { resource: 'analytics', actions: ['read'], scope: 'all' }
  ]
  // ... other roles
};
```

---

## 📦 4. Detailed Functional Modules

### 4.1 Authentication & User Management

#### 4.1.1 Features
- Multi-factor authentication (OTP via SMS/Email)
- JWT-based session management
- Role-based access control (RBAC)
- Password reset with token expiry
- Device fingerprinting for security
- Session timeout management

#### 4.1.2 User Flow
```
Registration → OTP Verification → Profile Setup → Role Assignment → Dashboard Access
```

#### 4.1.3 API Endpoints (Elysia)

```typescript
// auth.routes.ts
import { Elysia, t } from 'elysia';

export const authRoutes = new Elysia({ prefix: '/auth' })
  
  // User Registration
  .post('/register', async ({ body, set }) => {
    // Implementation
  }, {
    body: t.Object({
      mobile: t.String({ pattern: '^[6-9]\\d{9}$' }),
      email: t.String({ format: 'email' }),
      name: t.String({ minLength: 2, maxLength: 100 }),
      role: t.Optional(t.Enum(['FARMER', 'AGRONOMIST'])),
      language: t.Optional(t.String())
    }),
    response: {
      201: t.Object({
        userId: t.String(),
        message: t.String(),
        otpSent: t.Boolean()
      }),
      400: t.Object({ error: t.String() }),
      409: t.Object({ error: t.String() }) // User exists
    },
    detail: {
      tags: ['Authentication'],
      summary: 'Register new user',
      description: 'Creates user account and sends OTP for verification'
    }
  })

  // OTP Verification
  .post('/verify-otp', async ({ body, set }) => {
    // Implementation
  }, {
    body: t.Object({
      mobile: t.String(),
      otp: t.String({ length: 6 }),
      deviceId: t.Optional(t.String())
    }),
    response: {
      200: t.Object({
        accessToken: t.String(),
        refreshToken: t.String(),
        user: t.Object({
          id: t.String(),
          name: t.String(),
          role: t.String(),
          permissions: t.Array(t.String())
        })
      }),
      401: t.Object({ error: t.String() })
    }
  })

  // Login
  .post('/login', async ({ body }) => {
    // Implementation
  }, {
    body: t.Object({
      mobile: t.Optional(t.String()),
      email: t.Optional(t.String()),
      password: t.Optional(t.String()),
      loginMethod: t.Enum(['OTP', 'PASSWORD'])
    })
  })

  // Refresh Token
  .post('/refresh', async ({ body, jwt }) => {
    // Implementation
  }, {
    body: t.Object({
      refreshToken: t.String()
    })
  })

  // Get Profile
  .get('/profile', async ({ user }) => {
    // Implementation (requires auth middleware)
  }, {
    response: {
      200: t.Object({
        id: t.String(),
        name: t.String(),
        mobile: t.String(),
        email: t.String(),
        role: t.String(),
        avatar: t.Nullable(t.String()),
        preferences: t.Object({})
      })
    }
  })

  // Update Profile
  .patch('/profile', async ({ body, user }) => {
    // Implementation
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      avatar: t.Optional(t.String()),
      language: t.Optional(t.String()),
      preferences: t.Optional(t.Object({}))
    })
  })

  // Logout
  .post('/logout', async ({ user, jwt }) => {
    // Invalidate token in Redis
  });
```

#### 4.1.4 MongoDB Schema

```typescript
// users.schema.ts
interface User {
  _id: ObjectId;
  mobile: string; // Indexed, unique
  email: string; // Indexed, unique
  name: string;
  password?: string; // Hashed with bcrypt
  role: 'SUPER_ADMIN' | 'ADMIN' | 'CXO' | 'MANAGER' | 'AGRONOMIST' | 'TM' | 'SALES' | 'FARMER';
  avatar?: string; // S3 URL
  language: 'en' | 'hi' | 'te' | 'ta' | 'mr'; // Default: 'en'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  emailVerified: boolean;
  mobileVerified: boolean;
  preferences: {
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    theme: 'light' | 'dark' | 'auto';
    units: {
      temperature: 'celsius' | 'fahrenheit';
      area: 'acres' | 'hectares';
      rainfall: 'mm' | 'inches';
    };
  };
  metadata: {
    lastLoginAt?: Date;
    lastLoginIP?: string;
    loginCount: number;
    devices: Array<{
      deviceId: string;
      deviceType: string;
      lastUsed: Date;
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date; // Soft delete
}

// Indexes
db.users.createIndex({ mobile: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ status: 1 });
db.users.createIndex({ 'metadata.lastLoginAt': -1 });
```

```typescript
// sessions.schema.ts
interface Session {
  _id: ObjectId;
  userId: ObjectId; // References users._id
  refreshToken: string; // Hashed, indexed
  deviceId: string;
  deviceInfo: {
    type: string;
    os: string;
    browser: string;
  };
  ipAddress: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt?: Date;
}

// Indexes
db.sessions.createIndex({ userId: 1 });
db.sessions.createIndex({ refreshToken: 1 }, { unique: true });
db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
```

#### 4.1.5 Frontend Components (React + Vite)

```typescript
// src/features/auth/components/LoginForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';

const loginSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid mobile number'),
  loginMethod: z.enum(['OTP', 'PASSWORD'])
});

export const LoginForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const loginMutation = useMutation({
    mutationFn: (data) => authAPI.login(data),
    onSuccess: (response) => {
      useAuthStore.getState().setAuth(response);
      // Redirect to dashboard
    }
  });

  return (
    <form onSubmit={handleSubmit((data) => loginMutation.mutate(data))}>
      {/* Form implementation */}
    </form>
  );
};
```

#### 4.1.6 Security Implementation

```typescript
// JWT Configuration
const JWT_CONFIG = {
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '30d',
  algorithm: 'HS256',
  issuer: 'crop-platform',
  audience: 'crop-platform-users'
};

// Middleware: Auth Guard
export const authGuard = (requiredRole?: Role[]) => {
  return async ({ headers, set, jwt }) => {
    const token = headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    try {
      const payload = await jwt.verify(token);
      
      // Check if token is blacklisted in Redis
      const isBlacklisted = await redis.get(`blacklist:${token}`);
      if (isBlacklisted) {
        set.status = 401;
        return { error: 'Token revoked' };
      }

      // Check role
      if (requiredRole && !requiredRole.includes(payload.role)) {
        set.status = 403;
        return { error: 'Forbidden' };
      }

      return { user: payload };
    } catch (error) {
      set.status = 401;
      return { error: 'Invalid token' };
    }
  };
};
```

---

### 4.2 Farm & Field Management

#### 4.2.1 Features
- Multi-farm management per farmer
- GPS-based field boundary capture
- Field polygons with area calculation
- Crop assignment per season
- Field health scoring
- Satellite imagery overlay

#### 4.2.2 Business Rules
1. **One Active Crop per Field per Season**: Each field can only have one active crop in a given season
2. **GPS Boundary Mandatory**: GIS features require valid GeoJSON polygon
3. **Minimum Field Size**: 0.1 acres (prevent data noise)
4. **Maximum Field Size**: 1000 acres (single field limit)
5. **Boundary Validation**: Self-intersecting polygons rejected

#### 4.2.3 API Endpoints

```typescript
// farm.routes.ts
export const farmRoutes = new Elysia({ prefix: '/farms' })

  // Create Farm
  .post('/', async ({ body, user }) => {
    // Implementation
  }, {
    body: t.Object({
      name: t.String({ minLength: 2, maxLength: 100 }),
      address: t.Object({
        line1: t.String(),
        line2: t.Optional(t.String()),
        village: t.String(),
        district: t.String(),
        state: t.String(),
        pincode: t.String({ pattern: '^\\d{6}$' })
      }),
      location: t.Object({
        type: t.Literal('Point'),
        coordinates: t.Tuple([t.Number(), t.Number()]) // [longitude, latitude]
      }),
      totalArea: t.Number({ minimum: 0.1 }), // in acres
      ownershipType: t.Enum(['OWNED', 'LEASED', 'SHARED'])
    }),
    response: {
      201: t.Object({
        farmId: t.String(),
        message: t.String()
      })
    }
  })

  // Get Farms (with pagination)
  .get('/', async ({ query, user }) => {
    // Implementation
  }, {
    query: t.Object({
      page: t.Optional(t.Number({ minimum: 1 })),
      limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
      search: t.Optional(t.String()),
      status: t.Optional(t.Enum(['ACTIVE', 'INACTIVE']))
    }),
    response: {
      200: t.Object({
        farms: t.Array(t.Object({
          id: t.String(),
          name: t.String(),
          totalArea: t.Number(),
          activeFields: t.Number(),
          healthScore: t.Number()
        })),
        pagination: t.Object({
          page: t.Number(),
          limit: t.Number(),
          total: t.Number(),
          totalPages: t.Number()
        })
      })
    }
  })

  // Get Farm Details
  .get('/:id', async ({ params, user }) => {
    // Implementation
  })

  // Update Farm
  .patch('/:id', async ({ params, body, user }) => {
    // Implementation
  })

  // Delete Farm (soft delete)
  .delete('/:id', async ({ params, user }) => {
    // Implementation
  });

// field.routes.ts
export const fieldRoutes = new Elysia({ prefix: '/fields' })

  // Create Field
  .post('/', async ({ body, user }) => {
    // Validate polygon, calculate area, save
  }, {
    body: t.Object({
      farmId: t.String(),
      name: t.String(),
      boundary: t.Object({
        type: t.Literal('Polygon'),
        coordinates: t.Array(t.Array(t.Tuple([t.Number(), t.Number()])))
      }),
      soilType: t.Enum(['CLAY', 'LOAM', 'SANDY', 'SILT', 'PEATY', 'CHALKY']),
      irrigationType: t.Enum(['DRIP', 'SPRINKLER', 'FLOOD', 'RAINFED']),
      elevation: t.Optional(t.Number()), // meters
      slope: t.Optional(t.Number()) // degrees
    })
  })

  // Get Fields by Farm
  .get('/farm/:farmId', async ({ params, user }) => {
    // Implementation
  })

  // Assign Crop to Field
  .post('/:id/assign-crop', async ({ params, body, user }) => {
    // Check for existing active crop in season
  }, {
    body: t.Object({
      cropId: t.String(),
      season: t.String(),
      sowingDate: t.String({ format: 'date' }),
      expectedHarvestDate: t.String({ format: 'date' }),
      targetYield: t.Number(),
      seedVariety: t.String()
    })
  })

  // Get Field with GIS Data
  .get('/:id/gis', async ({ params, user }) => {
    // Returns field + NDVI + weather + pest risk
  });
```

#### 4.2.4 MongoDB Schema

```typescript
// farms.schema.ts
interface Farm {
  _id: ObjectId;
  userId: ObjectId; // Farmer ID
  name: string;
  address: {
    line1: string;
    line2?: string;
    village: string;
    district: string;
    state: string;
    pincode: string;
    country: string; // Default: 'IN'
  };
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  totalArea: number; // acres (auto-calculated from fields)
  ownershipType: 'OWNED' | 'LEASED' | 'SHARED';
  status: 'ACTIVE' | 'INACTIVE';
  metadata: {
    registrationNumber?: string;
    surveyNumber?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// Indexes
db.farms.createIndex({ userId: 1 });
db.farms.createIndex({ location: '2dsphere' }); // Geo queries
db.farms.createIndex({ 'address.district': 1, 'address.state': 1 });
db.farms.createIndex({ status: 1 });
```

```typescript
// fields.schema.ts
interface Field {
  _id: ObjectId;
  farmId: ObjectId;
  name: string;
  boundary: {
    type: 'Polygon';
    coordinates: number[][][]; // GeoJSON polygon
  };
  centroid: {
    type: 'Point';
    coordinates: [number, number]; // Auto-calculated
  };
  area: number; // acres (auto-calculated from boundary)
  soilType: 'CLAY' | 'LOAM' | 'SANDY' | 'SILT' | 'PEATY' | 'CHALKY';
  irrigationType: 'DRIP' | 'SPRINKLER' | 'FLOOD' | 'RAINFED';
  elevation?: number; // meters
  slope?: number; // degrees
  currentCrop?: {
    cropId: ObjectId;
    season: string;
    sowingDate: Date;
    expectedHarvestDate: Date;
    targetYield: number;
    seedVariety: string;
    status: 'ACTIVE' | 'HARVESTED' | 'FAILED';
    assignedAt: Date;
  };
  healthMetrics: {
    ndvi: number; // -1 to 1
    stressLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    lastUpdated: Date;
  };
  status: 'ACTIVE' | 'INACTIVE' | 'FALLOW';
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
db.fields.createIndex({ farmId: 1 });
db.fields.createIndex({ boundary: '2dsphere' }); // Geo queries
db.fields.createIndex({ 'currentCrop.cropId': 1 });
db.fields.createIndex({ 'currentCrop.season': 1, 'currentCrop.status': 1 });
db.fields.createIndex({ status: 1 });
```

#### 4.2.5 Frontend Components

```typescript
// src/features/farms/components/FieldMap.tsx
import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { useQuery } from '@tanstack/react-query';

export const FieldMap = ({ farmId }: { farmId: string }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  const { data: fields } = useQuery({
    queryKey: ['fields', farmId],
    queryFn: () => fieldAPI.getFieldsByFarm(farmId)
  });

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [78.9629, 20.5937], // Default: India center
      zoom: 10
    });

    // Add field boundaries
    if (fields) {
      fields.forEach((field) => {
        map.current?.addSource(`field-${field.id}`, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: field.boundary
          }
        });

        map.current?.addLayer({
          id: `field-${field.id}`,
          type: 'fill',
          source: `field-${field.id}`,
          paint: {
            'fill-color': getHealthColor(field.healthMetrics.ndvi),
            'fill-opacity': 0.5
          }
        });
      });
    }
  }, [fields]);

  return <div ref={mapContainer} className="h-[600px] w-full rounded-lg" />;
};
```

---

### 4.3 Crop Planning & Stage Management

#### 4.3.1 Features
- Crop calendar with stage milestones
- Automatic stage progression based on GDD
- Manual override by agronomists
- Stage-specific advisory generation
- Weather-based stage adjustment

#### 4.3.2 Crop Growth Stages

```typescript
enum CropStage {
  SOWING = 'SOWING',
  GERMINATION = 'GERMINATION',
  VEGETATIVE = 'VEGETATIVE',
  FLOWERING = 'FLOWERING',
  FRUITING = 'FRUITING',
  MATURATION = 'MATURATION',
  HARVEST = 'HARVEST'
}

interface StageConfig {
  stage: CropStage;
  durationDays: number; // Typical duration
  gddRequired?: number; // Growing Degree Days
  criticalWeatherParams: {
    minTemp?: number;
    maxTemp?: number;
    minRainfall?: number;
    maxRainfall?: number;
  };
  advisories: string[]; // Advisory template IDs
}
```

#### 4.3.3 API Endpoints

```typescript
// crop-stage.routes.ts
export const cropStageRoutes = new Elysia({ prefix: '/crop-stages' })

  // Get Crop Stage Calendar
  .get('/calendar/:cropId', async ({ params }) => {
    // Returns stage timeline with dates
  })

  // Update Field Crop Stage
  .post('/field/:fieldId/update', async ({ params, body, user }) => {
    // Auto-progression or manual override
  }, {
    body: t.Object({
      newStage: t.Enum(CropStage),
      reason: t.Optional(t.String()), // For manual overrides
      overrideAuto: t.Boolean()
    })
  })

  // Get Current Stage Advisory
  .get('/field/:fieldId/advisory', async ({ params }) => {
    // Returns stage-specific recommendations
  });
```

#### 4.3.4 MongoDB Schema

```typescript
// crop_calendars.schema.ts
interface CropCalendar {
  _id: ObjectId;
  cropId: ObjectId; // References crops master
  cropName: string;
  stages: Array<{
    stage: CropStage;
    durationDays: number;
    gddRequired?: number;
    criticalWeatherParams: {
      minTemp?: number;
      maxTemp?: number;
      minRainfall?: number;
      maxRainfall?: number;
    };
    advisories: ObjectId[]; // Advisory template IDs
    keyActivities: string[];
  }>;
  totalDuration: number; // days
  createdAt: Date;
  updatedAt: Date;
}
```

```typescript
// field_crop_stages.schema.ts
interface FieldCropStage {
  _id: ObjectId;
  fieldId: ObjectId;
  cropId: ObjectId;
  season: string;
  sowingDate: Date;
  currentStage: CropStage;
  stageHistory: Array<{
    stage: CropStage;
    enteredAt: Date;
    exitedAt?: Date;
    durationDays: number;
    gddAccumulated?: number;
    wasAutoProgressed: boolean;
    overriddenBy?: ObjectId; // User ID if manual
  }>;
  expectedHarvestDate: Date;
  actualHarvestDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
db.field_crop_stages.createIndex({ fieldId: 1, season: 1 });
db.field_crop_stages.createIndex({ cropId: 1, currentStage: 1 });
```

#### 4.3.5 Stage Progression Logic

```typescript
// services/cropStageService.ts
export class CropStageService {
  
  // Cron job runs daily
  async autoProgressStages() {
    const activeFields = await db.fields.find({
      'currentCrop.status': 'ACTIVE'
    });

    for (const field of activeFields) {
      const stageRecord = await db.field_crop_stages.findOne({
        fieldId: field._id,
        season: field.currentCrop.season
      });

      const gdd = await this.calculateGDD(field, stageRecord);
      const currentStageConfig = await this.getStageConfig(
        field.currentCrop.cropId,
        stageRecord.currentStage
      );

      // Check if ready to progress
      if (gdd >= currentStageConfig.gddRequired) {
        await this.progressStage(field, stageRecord, 'AUTO');
      }

      // Check weather anomalies
      await this.checkWeatherAnomalies(field, currentStageConfig);
    }
  }

  async calculateGDD(field: Field, stageRecord: FieldCropStage): Promise<number> {
    const weather = await weatherService.getHistoricalData(
      field.centroid.coordinates,
      stageRecord.stageHistory[stageRecord.stageHistory.length - 1].enteredAt,
      new Date()
    );

    const baseTemp = 10; // Celsius (crop-specific)
    let gdd = 0;

    for (const day of weather) {
      const avgTemp = (day.maxTemp + day.minTemp) / 2;
      gdd += Math.max(0, avgTemp - baseTemp);
    }

    return gdd;
  }

  async progressStage(field: Field, stageRecord: FieldCropStage, mode: 'AUTO' | 'MANUAL') {
    const stages = Object.values(CropStage);
    const currentIndex = stages.indexOf(stageRecord.currentStage);
    const nextStage = stages[currentIndex + 1];

    if (!nextStage) return; // Already at harvest

    // Update stage
    await db.field_crop_stages.updateOne(
      { _id: stageRecord._id },
      {
        $set: { currentStage: nextStage },
        $push: {
          stageHistory: {
            stage: nextStage,
            enteredAt: new Date(),
            wasAutoProgressed: mode === 'AUTO'
          }
        }
      }
    );

    // Trigger notifications
    await notificationService.send({
      userId: field.farmId, // Farmer
      type: 'STAGE_CHANGE',
      message: `Your ${field.currentCrop.cropName} in ${field.name} has entered ${nextStage} stage`,
      data: { fieldId: field._id, stage: nextStage }
    });

    // Generate stage advisory
    await advisoryService.generateStageAdvisory(field._id, nextStage);
  }
}
```

---

### 4.4 Soil & Nutrient Intelligence

#### 4.4.1 Features
- Soil test report upload (PDF/Image)
- NPK analysis and scoring
- Fertilizer recommendations
- Soil health trends
- pH level monitoring
- Micro-nutrient tracking

#### 4.4.2 API Endpoints

```typescript
// soil.routes.ts
export const soilRoutes = new Elysia({ prefix: '/soil' })

  // Upload Soil Report
  .post('/reports', async ({ body, user }) => {
    // Parse PDF/image, extract values
  }, {
    body: t.Object({
      fieldId: t.String(),
      reportDate: t.String({ format: 'date' }),
      testingLab: t.String(),
      reportFile: t.String(), // S3 URL or base64
      manualEntry: t.Optional(t.Object({
        ph: t.Number({ minimum: 3, maximum: 10 }),
        nitrogen: t.Number(),
        phosphorus: t.Number(),
        potassium: t.Number(),
        organicCarbon: t.Optional(t.Number()),
        micronutrients: t.Optional(t.Object({
          zinc: t.Number(),
          boron: t.Number(),
          iron: t.Number(),
          manganese: t.Number()
        }))
      }))
    })
  })

  // Get Soil Reports by Field
  .get('/reports/field/:fieldId', async ({ params, query }) => {
    // Returns historical soil reports
  }, {
    query: t.Object({
      limit: t.Optional(t.Number({ maximum: 50 })),
      sort: t.Optional(t.Enum(['asc', 'desc']))
    })
  })

  // Get Fertilizer Recommendations
  .get('/recommendations/:fieldId', async ({ params }) => {
    // AI-based fertilizer recommendation
  });
```

#### 4.4.3 MongoDB Schema

```typescript
// soil_reports.schema.ts
interface SoilReport {
  _id: ObjectId;
  fieldId: ObjectId;
  reportDate: Date;
  testingLab: string;
  reportFile: string; // S3 URL
  results: {
    ph: number;
    nitrogen: number; // kg/ha
    phosphorus: number; // kg/ha
    potassium: number; // kg/ha
    organicCarbon?: number; // %
    electricalConductivity?: number; // dS/m
    micronutrients?: {
      zinc?: number; // ppm
      boron?: number; // ppm
      iron?: number; // ppm
      manganese?: number; // ppm
      copper?: number; // ppm
      sulphur?: number; // ppm
    };
  };
  interpretation: {
    npkRating: 'DEFICIENT' | 'LOW' | 'MEDIUM' | 'HIGH' | 'EXCESSIVE';
    phRating: 'ACIDIC' | 'SLIGHTLY_ACIDIC' | 'NEUTRAL' | 'SLIGHTLY_ALKALINE' | 'ALKALINE';
    overallScore: number; // 0-100
  };
  recommendations: {
    fertilizers: Array<{
      name: string;
      quantity: number; // kg/acre
      applicationStage: CropStage;
      notes: string;
    }>;
    amendments: Array<{
      type: 'LIME' | 'GYPSUM' | 'ORGANIC_MATTER';
      quantity: number;
      reason: string;
    }>;
  };
  createdBy: ObjectId; // User who uploaded
  verifiedBy?: ObjectId; // Agronomist who verified
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
db.soil_reports.createIndex({ fieldId: 1, reportDate: -1 });
db.soil_reports.createIndex({ status: 1 });
```

---

### 4.5 Weather Monitoring & Alerts

#### 4.5.1 Features
- Real-time weather data
- 7-day forecast
- Extreme weather alerts
- Rainfall tracking
- Temperature extremes
- Wind speed monitoring

#### 4.5.2 Weather Data Provider Integration

```typescript
// services/weatherService.ts
import axios from 'axios';

export class WeatherService {
  private readonly API_KEY = process.env.WEATHER_API_KEY;
  private readonly BASE_URL = 'https://api.openweathermap.org/data/3.0';

  async getCurrentWeather(lat: number, lon: number) {
    const response = await axios.get(`${this.BASE_URL}/onecall`, {
      params: {
        lat,
        lon,
        appid: this.API_KEY,
        units: 'metric',
        exclude: 'minutely,hourly'
      }
    });

    return {
      temperature: response.data.current.temp,
      feelsLike: response.data.current.feels_like,
      humidity: response.data.current.humidity,
      windSpeed: response.data.current.wind_speed,
      rainfall: response.data.current.rain?.['1h'] || 0,
      condition: response.data.current.weather[0].main,
      timestamp: new Date(response.data.current.dt * 1000)
    };
  }

  async getForecast(lat: number, lon: number, days: number = 7) {
    const response = await axios.get(`${this.BASE_URL}/onecall`, {
      params: {
        lat,
        lon,
        appid: this.API_KEY,
        units: 'metric',
        exclude: 'current,minutely,hourly'
      }
    });

    return response.data.daily.slice(0, days).map((day: any) => ({
      date: new Date(day.dt * 1000),
      tempMin: day.temp.min,
      tempMax: day.temp.max,
      humidity: day.humidity,
      rainfall: day.rain || 0,
      windSpeed: day.wind_speed,
      condition: day.weather[0].main
    }));
  }

  async checkAnomalies(fieldId: ObjectId) {
    const field = await db.fields.findOne({ _id: fieldId });
    const weather = await this.getCurrentWeather(
      field.centroid.coordinates[1],
      field.centroid.coordinates[0]
    );

    const alerts = [];

    // Temperature extremes
    if (weather.temperature > 40) {
      alerts.push({
        type: 'HEAT_WAVE',
        severity: 'HIGH',
        message: 'Extreme heat detected. Consider additional irrigation.'
      });
    }

    if (weather.temperature < 10) {
      alerts.push({
        type: 'COLD_WAVE',
        severity: 'MEDIUM',
        message: 'Low temperature alert. Protect sensitive crops.'
      });
    }

    // Heavy rainfall
    if (weather.rainfall > 50) {
      alerts.push({
        type: 'HEAVY_RAIN',
        severity: 'HIGH',
        message: 'Heavy rainfall detected. Check drainage systems.'
      });
    }

    // Store alerts and notify
    for (const alert of alerts) {
      await this.createWeatherAlert(fieldId, alert);
    }

    return alerts;
  }

  async createWeatherAlert(fieldId: ObjectId, alert: any) {
    await db.weather_alerts.insertOne({
      fieldId,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      weatherData: await this.getCurrentWeather(/* ... */),
      createdAt: new Date(),
      acknowledgedAt: null
    });

    // Send notification via RabbitMQ
    await rabbitMQ.publish('weather.alerts', {
      fieldId,
      alert
    });
  }
}
```

#### 4.5.3 MongoDB Schema

```typescript
// weather_snapshots.schema.ts
interface WeatherSnapshot {
  _id: ObjectId;
  fieldId: ObjectId;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  data: {
    temperature: number; // Celsius
    feelsLike: number;
    humidity: number; // %
    windSpeed: number; // km/h
    rainfall: number; // mm
    condition: string; // 'Clear', 'Rain', 'Clouds', etc.
  };
  source: 'OPENWEATHER' | 'WEATHERAPI' | 'MANUAL';
  timestamp: Date;
  createdAt: Date;
}

// Indexes
db.weather_snapshots.createIndex({ fieldId: 1, timestamp: -1 });
db.weather_snapshots.createIndex({ location: '2dsphere' });
db.weather_snapshots.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL
```

```typescript
// weather_alerts.schema.ts
interface WeatherAlert {
  _id: ObjectId;
  fieldId: ObjectId;
  type: 'HEAT_WAVE' | 'COLD_WAVE' | 'HEAVY_RAIN' | 'DROUGHT' | 'STORM' | 'FROST';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  weatherData: {
    temperature: number;
    rainfall: number;
    windSpeed: number;
  };
  actionable: boolean;
  recommendations: string[];
  createdAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: ObjectId;
}

// Indexes
db.weather_alerts.createIndex({ fieldId: 1, createdAt: -1 });
db.weather_alerts.createIndex({ severity: 1, acknowledgedAt: 1 });
```

---

### 4.6 Pest & Disease Management

#### 4.6.1 Features
- Pest incident reporting
- Image-based pest identification (AI)
- Risk scoring per field
- Preventive advisory
- Treatment recommendations
- Pest outbreak alerts

#### 4.6.2 AI Integration Flow

```
User uploads image → S3 upload → AI model endpoint → 
Confidence score → (< 70% → Manual review) → 
Pest identified → Risk assessment → Advisory generation
```

#### 4.6.3 API Endpoints

```typescript
// pest.routes.ts
export const pestRoutes = new Elysia({ prefix: '/pest' })

  // Report Pest Incident
  .post('/report', async ({ body, user }) => {
    // Upload image to S3, call AI service
  }, {
    body: t.Object({
      fieldId: t.String(),
      images: t.Array(t.String()), // Base64 or URLs
      description: t.Optional(t.String()),
      severity: t.Optional(t.Enum(['LOW', 'MEDIUM', 'HIGH'])),
      affectedArea: t.Optional(t.Number()) // % of field
    })
  })

  // Get Pest Risk Score
  .get('/risk-score/:fieldId', async ({ params }) => {
    // AI-based risk calculation
  })

  // Get Treatment Recommendations
  .get('/treatment/:pestId', async ({ params }) => {
    // Returns pesticide recommendations
  })

  // Get Pest Incidents by Field
  .get('/field/:fieldId', async ({ params, query }) => {
    // Historical pest data
  });
```

#### 4.6.4 AI Service Integration

```typescript
// services/aiPestDetection.ts
export class AIPestDetectionService {
  private readonly AI_ENDPOINT = process.env.AI_MODEL_ENDPOINT;

  async identifyPest(imageUrl: string): Promise<PestIdentification> {
    const response = await fetch(this.AI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        model: 'pest-detection-v2'
      })
    });

    const result = await response.json();

    return {
      pestId: result.pest_id,
      pestName: result.pest_name,
      scientificName: result.scientific_name,
      confidence: result.confidence, // 0-100
      severity: result.estimated_severity,
      needsReview: result.confidence < 70,
      boundingBoxes: result.detections // For image annotation
    };
  }

  async calculateRiskScore(fieldId: ObjectId): Promise<number> {
    // Fetch recent incidents
    const incidents = await db.pest_incidents.find({
      fieldId,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    }).toArray();

    const weather = await weatherService.getCurrentWeather(/* ... */);
    const cropStage = await db.field_crop_stages.findOne({ fieldId });

    // AI model for risk prediction
    const riskScore = await this.predictRisk({
      incidents: incidents.length,
      avgSeverity: incidents.reduce((sum, i) => sum + i.severity, 0) / incidents.length,
      humidity: weather.humidity,
      temperature: weather.temperature,
      cropStage: cropStage.currentStage
    });

    return riskScore; // 0-100
  }
}
```

#### 4.6.5 MongoDB Schema

```typescript
// pest_incidents.schema.ts
interface PestIncident {
  _id: ObjectId;
  fieldId: ObjectId;
  reportedBy: ObjectId; // User ID
  images: Array<{
    url: string; // S3 URL
    thumbnailUrl: string;
    uploadedAt: Date;
  }>;
  identification: {
    pestId: string;
    pestName: string;
    scientificName: string;
    confidence: number; // 0-100
    method: 'AI' | 'MANUAL' | 'AGRONOMIST';
    identifiedBy?: ObjectId; // Agronomist if manual
  };
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedArea: number; // % of field
  symptoms: string[];
  treatment: {
    recommended: Array<{
      productName: string;
      activeIngredient: string;
      dosage: string;
      applicationMethod: string;
      safetyPeriod: number; // days before harvest
    }>;
    applied?: Array<{
      productName: string;
      appliedAt: Date;
      appliedBy: ObjectId;
      effectiveness: 'LOW' | 'MEDIUM' | 'HIGH';
    }>;
  };
  status: 'REPORTED' | 'UNDER_TREATMENT' | 'RESOLVED' | 'ESCALATED';
  reviewStatus: 'PENDING' | 'APPROVED' | 'NEEDS_EXPERT';
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

// Indexes
db.pest_incidents.createIndex({ fieldId: 1, createdAt: -1 });
db.pest_incidents.createIndex({ 'identification.pestId': 1 });
db.pest_incidents.createIndex({ status: 1, reviewStatus: 1 });
```

---

### 4.7 Real-Time Notifications & Alerts

#### 4.7.1 Notification Channels
- **In-App**: WebSocket push
- **Push Notifications**: FCM (Firebase Cloud Messaging)
- **SMS**: Twilio / local SMS gateway
- **Email**: SendGrid / AWS SES

#### 4.7.2 WebSocket Implementation (Elysia)

```typescript
// websocket.ts
import { Elysia } from 'elysia';

export const websocketRoutes = new Elysia()
  .ws('/ws', {
    open(ws) {
      console.log('WebSocket connected:', ws.data.userId);
      
      // Join user-specific room
      ws.subscribe(`user:${ws.data.userId}`);
    },

    message(ws, message) {
      // Handle client messages
      console.log('Received:', message);
    },

    close(ws) {
      console.log('WebSocket closed');
    }
  });

// Notification service
export class NotificationService {
  async send(notification: Notification) {
    // Store in DB
    await db.notifications.insertOne(notification);

    // Send via WebSocket
    websocketServer.publish(`user:${notification.userId}`, {
      type: 'notification',
      data: notification
    });

    // Send push notification
    if (notification.pushEnabled) {
      await this.sendPushNotification(notification);
    }

    // Send SMS if critical
    if (notification.severity === 'CRITICAL' && notification.smsEnabled) {
      await this.sendSMS(notification);
    }
  }

  async sendPushNotification(notification: Notification) {
    const userDevices = await db.user_devices.find({
      userId: notification.userId,
      fcmToken: { $exists: true }
    }).toArray();

    for (const device of userDevices) {
      await fcm.send({
        token: device.fcmToken,
        notification: {
          title: notification.title,
          body: notification.message
        },
        data: notification.data
      });
    }
  }

  async sendSMS(notification: Notification) {
    const user = await db.users.findOne({ _id: notification.userId });
    
    await twilioClient.messages.create({
      to: user.mobile,
      from: process.env.TWILIO_PHONE,
      body: notification.message
    });
  }
}
```

#### 4.7.3 RabbitMQ Event Queue

```typescript
// queue/rabbitmq.ts
import amqp from 'amqplib';

export class RabbitMQService {
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  async connect() {
    this.connection = await amqp.connect(process.env.RABBITMQ_URL);
    this.channel = await this.connection.createChannel();

    // Declare exchanges
    await this.channel.assertExchange('notifications', 'topic', { durable: true });
    await this.channel.assertExchange('weather.alerts', 'fanout', { durable: true });
    await this.channel.assertExchange('pest.alerts', 'topic', { durable: true });
  }

  async publish(exchange: string, routingKey: string, message: any) {
    this.channel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
  }

  async consume(queue: string, handler: (msg: any) => Promise<void>) {
    await this.channel.assertQueue(queue, { durable: true });
    
    this.channel.consume(queue, async (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          await handler(content);
          this.channel.ack(msg);
        } catch (error) {
          console.error('Error processing message:', error);
          this.channel.nack(msg, false, true); // Requeue
        }
      }
    });
  }
}

// Worker: Process notification queue
rabbitMQ.consume('notification.queue', async (message) => {
  await notificationService.send(message);
});
```

#### 4.7.4 MongoDB Schema

```typescript
// notifications.schema.ts
interface Notification {
  _id: ObjectId;
  userId: ObjectId;
  type: 'PEST_ALERT' | 'WEATHER_ALERT' | 'STAGE_CHANGE' | 'IRRIGATION_DUE' | 
        'HARVEST_READY' | 'ADVISORY' | 'SYSTEM';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  data: Record<string, any>; // Additional context
  channels: {
    inApp: boolean;
    push: boolean;
    sms: boolean;
    email: boolean;
  };
  status: 'PENDING' | 'SENT' | 'FAILED';
  readAt?: Date;
  actionUrl?: string; // Deep link
  createdAt: Date;
  expiresAt?: Date;
}

// Indexes
db.notifications.createIndex({ userId: 1, createdAt: -1 });
db.notifications.createIndex({ status: 1 });
db.notifications.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL
```

---

### 4.8 SAP ERP Integration

#### 4.8.1 Integration Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   SAP ERP   │◄────────┤  RabbitMQ   │◄────────┤ Crop Platform│
│             │         │   Queue     │         │              │
└─────────────┘         └─────────────┘         └─────────────┘
      │                        │                        │
      │ OData/REST             │ Event-driven           │
      ▼                        ▼                        ▼
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│ Master Data │         │Retry Logic  │         │  MongoDB    │
│ Sync (Crop, │         │Error Handling│         │  (Source)   │
│ Product,    │         │Audit Trail  │         │             │
│ Region)     │         │             │         │             │
└─────────────┘         └─────────────┘         └─────────────┘
```

#### 4.8.2 Data Flow

**Inbound (SAP → Platform)**:
- Crop master data
- Product catalog
- Region hierarchy
- Pricing updates

**Outbound (Platform → SAP)**:
- Acreage data
- Yield forecasts
- Demand signals
- Pest incident summary

#### 4.8.3 API Endpoints

```typescript
// sap-integration.routes.ts
export const sapRoutes = new Elysia({ prefix: '/integration/sap' })

  // Pull Master Data from SAP
  .post('/pull/master-data', async ({ body }) => {
    // Fetch from SAP OData endpoint
  }, {
    body: t.Object({
      entity: t.Enum(['CROPS', 'PRODUCTS', 'REGIONS', 'PRICING']),
      lastSyncDate: t.Optional(t.String({ format: 'date-time' }))
    })
  })

  // Push Acreage Data to SAP
  .post('/push/acreage', async ({ body }) => {
    // Send field acreage to SAP
  })

  // Push Yield Forecast to SAP
  .post('/push/yield-forecast', async ({ body }) => {
    // Send AI predictions to SAP
  })

  // Get Sync Status
  .get('/sync-status', async ({ query }) => {
    // Returns last sync details
  });
```

#### 4.8.4 Integration Service

```typescript
// services/sapIntegration.ts
export class SAPIntegrationService {
  private readonly SAP_BASE_URL = process.env.SAP_ODATA_URL;
  private readonly SAP_USERNAME = process.env.SAP_USERNAME;
  private readonly SAP_PASSWORD = process.env.SAP_PASSWORD;

  async pullCropMaster(): Promise<void> {
    try {
      const response = await axios.get(`${this.SAP_BASE_URL}/CropMasterSet`, {
        auth: {
          username: this.SAP_USERNAME,
          password: this.SAP_PASSWORD
        }
      });

      const crops = response.data.d.results;

      for (const crop of crops) {
        await db.crops_master.updateOne(
          { sapCropCode: crop.CropCode },
          {
            $set: {
              sapCropCode: crop.CropCode,
              name: crop.CropName,
              category: crop.Category,
              growingSeasons: crop.Seasons.split(','),
              avgDuration: crop.AvgDurationDays,
              updatedFromSAP: new Date()
            }
          },
          { upsert: true }
        );
      }

      // Log sync
      await this.logSync('CROPS', crops.length, 'SUCCESS');
    } catch (error) {
      await this.logSync('CROPS', 0, 'FAILED', error.message);
      
      // Retry via RabbitMQ
      await rabbitMQ.publish('sap.sync.retry', 'crop.master', {
        attempt: 1,
        maxAttempts: 3
      });
    }
  }

  async pushYieldForecast(season: string): Promise<void> {
    const forecasts = await db.yield_estimates.find({
      season,
      status: 'APPROVED'
    }).toArray();

    const payload = forecasts.map(f => ({
      FieldId: f.fieldId.toString(),
      CropCode: f.cropCode,
      Season: f.season,
      ForecastYield: f.estimatedYield,
      ForecastDate: f.forecastDate.toISOString()
    }));

    await axios.post(`${this.SAP_BASE_URL}/YieldForecastSet`, {
      d: { results: payload }
    }, {
      auth: {
        username: this.SAP_USERNAME,
        password: this.SAP_PASSWORD
      }
    });

    await this.logSync('YIELD_FORECAST', payload.length, 'SUCCESS');
  }

  async logSync(entity: string, recordCount: number, status: string, error?: string) {
    await db.sap_sync_logs.insertOne({
      entity,
      recordCount,
      status,
      error,
      timestamp: new Date()
    });
  }
}
```

#### 4.8.5 MongoDB Schema

```typescript
// sap_sync_logs.schema.ts
interface SAPSyncLog {
  _id: ObjectId;
  entity: 'CROPS' | 'PRODUCTS' | 'REGIONS' | 'PRICING' | 'ACREAGE' | 'YIELD_FORECAST';
  direction: 'INBOUND' | 'OUTBOUND';
  recordCount: number;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  error?: string;
  retryCount: number;
  timestamp: Date;
}

// Indexes
db.sap_sync_logs.createIndex({ entity: 1, timestamp: -1 });
db.sap_sync_logs.createIndex({ status: 1 });
```

---

### 4.9 CXO Dashboards & Analytics

#### 4.9.1 Dashboard KPIs

```typescript
interface CXODashboard {
  overview: {
    totalFarms: number;
    totalAcreage: number;
    activeFarmers: number;
    cropHealthIndex: number; // 0-100
  };
  yieldMetrics: {
    currentSeasonForecast: number;
    targetYield: number;
    variance: number; // %
    trendByRegion: Array<{
      region: string;
      forecast: number;
      target: number;
    }>;
  };
  riskExposure: {
    highRiskFields: number;
    pestOutbreaks: number;
    weatherAnomalies: number;
    top5Risks: Array<{
      type: string;
      affectedAcres: number;
      severity: string;
    }>;
  };
  advisoryAdoption: {
    totalAdvisories: number;
    adoptionRate: number; // %
    byCategory: Record<string, number>;
  };
}
```

#### 4.9.2 API Endpoints

```typescript
// dashboard.routes.ts
export const dashboardRoutes = new Elysia({ prefix: '/dashboard' })

  // CXO Dashboard
  .get('/cxo', async ({ query, user }) => {
    // Aggregate data from multiple collections
  }, {
    query: t.Object({
      season: t.Optional(t.String()),
      region: t.Optional(t.String()),
      crop: t.Optional(t.String()),
      startDate: t.Optional(t.String({ format: 'date' })),
      endDate: t.Optional(t.String({ format: 'date' }))
    })
  })

  // Regional Performance
  .get('/regional', async ({ query }) => {
    // Region-wise breakdown
  })

  // Crop Health Heatmap
  .get('/heatmap', async ({ query }) => {
    // GIS data for heatmap visualization
  });
```

#### 4.9.3 Frontend Dashboard Component

```typescript
// src/features/dashboard/components/CXODashboard.tsx
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, LineChart } from 'recharts';

export const CXODashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['cxo-dashboard'],
    queryFn: () => dashboardAPI.getCXODashboard(),
    refetchInterval: 60000 // Refresh every minute
  });

  if (isLoading) return <Spinner />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* KPI Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Total Acreage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {data.overview.totalAcreage.toLocaleString()} acres
          </div>
          <p className="text-sm text-muted-foreground">
            Across {data.overview.totalFarms} farms
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Crop Health Index</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {data.overview.cropHealthIndex}/100
          </div>
          <ProgressBar value={data.overview.cropHealthIndex} />
        </CardContent>
      </Card>

      {/* Yield Forecast Chart */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Yield Forecast vs Target</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            data={data.yieldMetrics.trendByRegion}
            width={600}
            height={300}
          >
            {/* Chart config */}
          </BarChart>
        </CardContent>
      </Card>

      {/* Risk Exposure */}
      <Card>
        <CardHeader>
          <CardTitle>High Risk Fields</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-600">
            {data.riskExposure.highRiskFields}
          </div>
          <ul className="mt-4 space-y-2">
            {data.riskExposure.top5Risks.map(risk => (
              <li key={risk.type} className="text-sm">
                {risk.type}: {risk.affectedAcres} acres
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
```

---

## 🔒 5. Security Specifications

### 5.1 Authentication & Authorization

#### JWT Configuration
```typescript
const JWT_CONFIG = {
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '30d',
  algorithm: 'HS256',
  issuer: 'crop-platform-api',
  audience: 'crop-platform-app'
};
```

#### RBAC Middleware
```typescript
export const authorize = (allowedRoles: Role[]) => {
  return async (context) => {
    const user = context.user; // From JWT

    if (!allowedRoles.includes(user.role)) {
      context.set.status = 403;
      throw new Error('Insufficient permissions');
    }

    return context;
  };
};

// Usage
app.get('/admin/users', authorize(['ADMIN', 'SUPER_ADMIN']), async () => {
  // Handler
});
```

### 5.2 Data Encryption

- **At Rest**: MongoDB encrypted storage (Atlas encryption)
- **In Transit**: TLS 1.3 for all API calls
- **Sensitive Fields**: Field-level encryption for PII

```typescript
// Encrypt sensitive data before storing
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### 5.3 Input Validation (Zod)

```typescript
import { z } from 'zod';

const farmSchema = z.object({
  name: z.string().min(2).max(100),
  address: z.object({
    pincode: z.string().regex(/^\d{6}$/),
    state: z.string()
  }),
  totalArea: z.number().positive().max(1000)
});

// Use in route
app.post('/farms', async ({ body }) => {
  const validated = farmSchema.parse(body); // Throws on validation error
  // Proceed with validated data
});
```

### 5.4 Rate Limiting

```typescript
import rateLimit from '@elysiajs/rate-limit';

app.use(rateLimit({
  duration: 60000, // 1 minute
  max: 100, // 100 requests per minute
  errorResponse: 'Too many requests'
}));
```

### 5.5 Audit Trail

```typescript
// audit_logs.schema.ts
interface AuditLog {
  _id: ObjectId;
  userId: ObjectId;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  resource: string; // 'farms', 'fields', etc.
  resourceId: ObjectId;
  changes?: {
    before: Record<string, any>;
    after: Record<string, any>;
  };
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

// Log all sensitive operations
async function logAudit(action: string, resource: string, resourceId: ObjectId, userId: ObjectId) {
  await db.audit_logs.insertOne({
    userId,
    action,
    resource,
    resourceId,
    timestamp: new Date()
  });
}
```

---

## 🚀 6. Performance Optimization

### 6.1 Caching Strategy (Redis)

```typescript
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache weather data (5 min TTL)
async function getWeather(lat: number, lon: number) {
  const cacheKey = `weather:${lat}:${lon}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const weather = await weatherAPI.fetch(lat, lon);
  await redis.setex(cacheKey, 300, JSON.stringify(weather));
  return weather;
}

// Cache user permissions (15 min TTL)
async function getUserPermissions(userId: string) {
  const cacheKey = `permissions:${userId}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const permissions = await db.users.findOne({ _id: userId });
  await redis.setex(cacheKey, 900, JSON.stringify(permissions));
  return permissions;
}
```

### 6.2 Database Optimization

#### Indexes
```javascript
// Compound indexes for common queries
db.fields.createIndex({ farmId: 1, status: 1 });
db.fields.createIndex({ 'currentCrop.cropId': 1, 'currentCrop.season': 1 });

// Text search index
db.farms.createIndex({ name: 'text', 'address.village': 'text' });

// Geospatial index
db.fields.createIndex({ boundary: '2dsphere' });
```

#### Query Optimization
```typescript
// Use projection to limit fields
const farms = await db.farms.find(
  { userId: user._id },
  { projection: { name: 1, totalArea: 1, status: 1 } }
).toArray();

// Use aggregation pipeline for complex queries
const dashboard = await db.fields.aggregate([
  { $match: { status: 'ACTIVE' } },
  { $group: {
    _id: '$farmId',
    totalArea: { $sum: '$area' },
    avgHealth: { $avg: '$healthMetrics.ndvi' }
  }},
  { $sort: { totalArea: -1 } },
  { $limit: 10 }
]).toArray();
```

### 6.3 CDN & Asset Optimization

```typescript
// Cloudflare CDN for static assets
const CDN_BASE = 'https://cdn.cropplatform.com';

// Image optimization
function getOptimizedImageUrl(originalUrl: string, width?: number) {
  return `${CDN_BASE}/image/${originalUrl}?w=${width}&format=webp`;
}
```

### 6.4 Lazy Loading & Code Splitting (React)

```typescript
// Lazy load heavy components
import { lazy, Suspense } from 'react';

const FieldMap = lazy(() => import('./components/FieldMap'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/fields/:id" element={<FieldMap />} />
      </Routes>
    </Suspense>
  );
}
```

---

## 📱 7. Frontend Architecture (React + Vite)

### 7.1 Project Structure

```
src/
├── assets/
│   ├── images/
│   └── icons/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── layout/          # Header, Sidebar, Footer
│   └── common/          # Reusable components
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── api/
│   ├── farms/
│   ├── fields/
│   ├── weather/
│   └── dashboard/
├── hooks/               # Custom hooks
├── lib/                 # Utilities
├── stores/              # Zustand stores
├── types/               # TypeScript types
├── App.tsx
└── main.tsx
```

### 7.2 State Management (Zustand)

```typescript
// stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (data: AuthResponse) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: (data) => set({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
      }),
      logout: () => set({
        user: null,
        accessToken: null,
        refreshToken: null
      })
    }),
    {
      name: 'auth-storage'
    }
  )
);
```

### 7.3 API Layer (TanStack Query)

```typescript
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});
```

```typescript
// features/farms/api/farmAPI.ts
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL;

export const farmAPI = {
  getFarms: async (params?: { page?: number; limit?: number }) => {
    const { data } = await axios.get(`${API_BASE}/farms`, { params });
    return data;
  },

  createFarm: async (farmData: CreateFarmDto) => {
    const { data } = await axios.post(`${API_BASE}/farms`, farmData);
    return data;
  },

  getFarmById: async (id: string) => {
    const { data } = await axios.get(`${API_BASE}/farms/${id}`);
    return data;
  }
};

// features/farms/hooks/useFarms.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { farmAPI } from '../api/farmAPI';

export const useFarms = () => {
  return useQuery({
    queryKey: ['farms'],
    queryFn: () => farmAPI.getFarms()
  });
};

export const useCreateFarm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: farmAPI.createFarm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms'] });
    }
  });
};
```

### 7.4 Routing

```typescript
// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/farms" element={<Farms />} />
          <Route path="/farms/:id" element={<FarmDetails />} />
          <Route path="/fields/:id" element={<FieldDetails />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 🛠️ 8. DevOps & Deployment

### 8.1 Environment Configuration

```bash
# .env.example
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
RABBITMQ_URL=amqp://...

# Authentication
JWT_SECRET=...
JWT_REFRESH_SECRET=...

# External Services
WEATHER_API_KEY=...
AI_MODEL_ENDPOINT=...

# File Storage
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=...

# SAP Integration
SAP_ODATA_URL=...
SAP_USERNAME=...
SAP_PASSWORD=...

# Notifications
FCM_SERVER_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
```

### 8.2 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: |
          railway up --service backend

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: |
          vercel --prod

  deploy-workers:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy Workers
        run: |
          # Deploy cron jobs, queue workers
```

### 8.3 Monitoring & Logging

```typescript
// services/monitoring.ts
import * as Sentry from '@sentry/bun';
import { axiom } from '@axiomhq/js';

// Error tracking
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});

// Logging
export const logger = {
  info: (message: string, data?: any) => {
    axiom.ingest('app-logs', [{
      level: 'info',
      message,
      data,
      timestamp: new Date()
    }]);
  },

  error: (message: string, error: Error) => {
    Sentry.captureException(error);
    axiom.ingest('app-logs', [{
      level: 'error',
      message,
      error: error.stack,
      timestamp: new Date()
    }]);
  }
};
```

### 8.4 Health Checks

```typescript
// routes/health.ts
export const healthRoutes = new Elysia({ prefix: '/health' })

  .get('/', async () => {
    return {
      status: 'OK',
      timestamp: new Date(),
      uptime: process.uptime()
    };
  })

  .get('/db', async () => {
    try {
      await db.admin().ping();
      return { status: 'OK', message: 'Database connected' };
    } catch (error) {
      return { status: 'ERROR', message: error.message };
    }
  })

  .get('/redis', async () => {
    try {
      await redis.ping();
      return { status: 'OK', message: 'Redis connected' };
    } catch (error) {
      return { status: 'ERROR', message: error.message };
    }
  });
```

---

## 📊 9. Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response Time (P95) | < 300ms | New Relic / Axiom |
| Frontend Initial Load | < 2s | Lighthouse |
| GIS Render Time | < 3s | Custom metrics |
| Database Query Time | < 100ms | MongoDB Atlas |
| WebSocket Latency | < 50ms | Socket.io metrics |
| Uptime | 99.9% | Uptime Robot |
| Error Rate | < 0.1% | Sentry |

---

## 🧪 10. Testing Strategy

### 10.1 Unit Tests (Bun Test)

```typescript
// tests/services/weatherService.test.ts
import { describe, expect, test } from 'bun:test';
import { WeatherService } from '../services/weatherService';

describe('WeatherService', () => {
  test('should fetch current weather', async () => {
    const weather = await WeatherService.getCurrentWeather(28.7041, 77.1025);
    expect(weather).toHaveProperty('temperature');
    expect(weather.temperature).toBeGreaterThan(-50);
  });
});
```

### 10.2 Integration Tests

```typescript
// tests/integration/auth.test.ts
import { describe, expect, test } from 'bun:test';
import { app } from '../index';

describe('Auth Flow', () => {
  test('should register user and send OTP', async () => {
    const response = await app.handle(
      new Request('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: '9876543210',
          email: 'test@example.com',
          name: 'Test User'
        })
      })
    );

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.otpSent).toBe(true);
  });
});
```

### 10.3 E2E Tests (Playwright)

```typescript
// e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('http://localhost:5173/login');
  await page.fill('input[name="mobile"]', '9876543210');
  await page.click('button[type="submit"]');
  await expect(page.locator('text=OTP sent')).toBeVisible();
});
```

---

## 📝 11. API Documentation

Auto-generated Swagger documentation available at `/swagger`

```typescript
// main.ts
import { swagger } from '@elysiajs/swagger';

app.use(swagger({
  documentation: {
    info: {
      title: 'Crop Platform API',
      version: '1.0.0',
      description: 'AI-driven farming platform API'
    },
    tags: [
      { name: 'Authentication', description: 'Auth endpoints' },
      { name: 'Farms', description: 'Farm management' },
      { name: 'Fields', description: 'Field operations' },
      { name: 'Weather', description: 'Weather data' },
      { name: 'Pest', description: 'Pest management' }
    ]
  }
}));
```

---

## 🔄 12. Data Migration Strategy

```typescript
// migrations/001_initial_setup.ts
export async function up(db: Db) {
  // Create collections
  await db.createCollection('users');
  await db.createCollection('farms');
  await db.createCollection('fields');

  // Create indexes
  await db.collection('users').createIndex({ mobile: 1 }, { unique: true });
  await db.collection('farms').createIndex({ userId: 1 });
  await db.collection('fields').createIndex({ boundary: '2dsphere' });
}

export async function down(db: Db) {
  await db.dropCollection('users');
  await db.dropCollection('farms');
  await db.dropCollection('fields');
}
```

---

## 🚨 13. Error Handling

```typescript
// lib/errorHandler.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
  }
}

// Global error handler
app.onError(({ code, error, set }) => {
  if (error instanceof AppError) {
    set.status = error.statusCode;
    return {
      error: error.message,
      code: error.statusCode
    };
  }

  // Log unexpected errors
  logger.error('Unexpected error', error);
  Sentry.captureException(error);

  set.status = 500;
  return {
    error: 'Internal server error',
    code: 500
  };
});
```

---

## 📋 14. Acceptance Criteria

### 14.1 User Stories

**As a Farmer:**
- ✅ I can register using my mobile number
- ✅ I can create and manage multiple farms
- ✅ I can draw field boundaries on a map
- ✅ I can receive pest alerts for my fields
- ✅ I can view weather forecasts for my location

**As an Agronomist:**
- ✅ I can create advisories for specific crop stages
- ✅ I can review and approve pest identifications
- ✅ I can validate soil test reports

**As a CXO:**
- ✅ I can view enterprise-wide dashboards
- ✅ I can see yield forecasts by region
- ✅ I can monitor risk exposure across all farms

### 14.2 Technical Acceptance

- ✅ All API endpoints return responses in < 300ms
- ✅ Frontend loads in < 2s on 3G networks
- ✅ 99% uptime maintained
- ✅ Zero data loss during SAP sync
- ✅ All user actions logged in audit trail

---

## 🔮 15. Future Enhancements

1. **AI Chatbot**: Voice-based advisory for farmers
2. **Drone Integration**: Aerial imagery analysis
3. **Marketplace**: Buy/sell farm inputs
4. **Blockchain**: Supply chain traceability
5. **IoT Sensors**: Real-time soil moisture, pH monitoring

---

## 📞 16. Support & Documentation

- **Developer Portal**: https://docs.cropplatform.com
- **API Reference**: https://api.cropplatform.com/swagger
- **Support Email**: dev-support@cropplatform.com
- **Slack Channel**: #crop-platform-dev

---

## ✅ 17. Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Tech Lead | | | |
| Frontend Lead | | | |
| Backend Lead | | | |
| QA Lead | | | |
| DevOps Lead | | | |

---

## 📚 Appendix

### A. MongoDB Collections Summary

```typescript
// Complete list of collections
const collections = [
  'users',
  'sessions',
  'farms',
  'fields',
  'crops_master',
  'crop_calendars',
  'field_crop_stages',
  'soil_reports',
  'weather_snapshots',
  'weather_alerts',
  'pest_incidents',
  'notifications',
  'sap_sync_logs',
  'audit_logs'
];
```

### B. Tech Stack Versions

```json
{
  "frontend": {
    "react": "18.2.0",
    "vite": "5.0.0",
    "typescript": "5.3.0",
    "tailwindcss": "3.4.0",
    "tanstack-query": "5.0.0",
    "zustand": "4.4.0"
  },
  "backend": {
    "bun": "1.0.0",
    "elysia": "1.0.0",
    "typescript": "5.3.0",
    "zod": "3.22.0"
  },
  "database": {
    "mongodb": "7.0",
    "redis": "7.2",
    "rabbitmq": "3.12"
  }
}
```

---

**End of Document**

*This FSD is a living document and will be updated as requirements evolve.*
