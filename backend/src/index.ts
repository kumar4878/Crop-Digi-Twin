import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import { connectMongoDB } from './db/mongodb';
import { connectRedis } from './db/redis';
import { EventStore } from './db/EventStore';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './routes/auth.routes';
import farmRoutes from './routes/farm.routes';
import fieldRoutes from './routes/field.routes';
import cropRoutes from './routes/crop.routes';
import soilRoutes from './routes/soil.routes';
import pestRoutes from './routes/pest.routes';
import weatherRoutes from './routes/weather.routes';
import dashboardRoutes from './routes/dashboard.routes';
import sapRoutes from './routes/sap.routes';
import eventRoutes from './routes/event.routes';
import spatialRoutes from './routes/spatial.routes';
import gddRoutes from './routes/gdd.routes';
import { startDDECron } from './cron/dde.cron';
import { startGDDEngineCron } from './cron/gdd.cron';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize Event Store (PostgreSQL)
const eventStore = new EventStore({
  connectionString: config.databaseUrl,
});

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    services: { eventStore: 'connected', mongodb: 'connected' },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/farms', farmRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/soil', soilRoutes);
app.use('/api/pest', pestRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/integration/sap', sapRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/spatial', spatialRoutes);
app.use('/api/gdd', gddRoutes);

// Edge Sync Endpoint (existing)
app.post('/api/sync/events', async (req, res) => {
  try {
    const events = req.body.events;
    if (!Array.isArray(events)) {
      return res.status(400).json({ error: 'Events array is required' });
    }
    const savedEvents = await eventStore.appendEvents(events);
    res.json({ success: true, count: savedEvents.length });
  } catch (error: any) {
    console.error('Error syncing events:', error);
    res.status(500).json({ error: 'Failed to sync events' });
  }
});

// Global Error Handler
app.use(errorHandler);

// Start Server
async function startServer() {
  // Connect databases
  await connectMongoDB();
  await connectRedis();

  startDDECron();
  startGDDEngineCron();

  app.listen(config.port, () => {
    console.log(`\n🌾 Crop Digitwin Platform V2`);
    console.log(`   Server running at http://localhost:${config.port}`);
    console.log(`   Environment: ${config.nodeEnv}`);
    console.log(`   Event Store: PostgreSQL`);
    console.log(`   App Data: MongoDB`);
    console.log(`   Cache: Redis\n`);
    console.log(`   Routes:`);
    console.log(`     POST /api/auth/register, /login, /verify-otp`);
    console.log(`     CRUD /api/farms, /api/fields, /api/crops`);
    console.log(`     POST /api/soil/reports, /api/pest/report`);
    console.log(`     GET  /api/weather/current/:fieldId`);
    console.log(`     GET  /api/dashboard/farmer, /cxo`);
    console.log(`     POST /api/sync/events (Edge Sync)`);
    console.log(`     POST /api/integration/sap/pull/master-data\n`);
  });
}

startServer().catch(console.error);
