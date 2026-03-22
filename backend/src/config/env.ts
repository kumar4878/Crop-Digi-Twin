import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',

  // PostgreSQL (Event Store)
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/crop_farming',

  // MongoDB (Application Data)
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/crop_farming_v2',

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '30d',

  // External Services
  weatherApiKey: process.env.WEATHER_API_KEY || '',
  weatherBaseUrl: process.env.WEATHER_BASE_URL || 'https://api.openweathermap.org/data/3.0',
  aiModelEndpoint: process.env.AI_MODEL_ENDPOINT || '',

  // File Storage
  s3BucketName: process.env.S3_BUCKET_NAME || '',
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',

  // SAP Integration
  sapOdataUrl: process.env.SAP_ODATA_URL || '',
  sapUsername: process.env.SAP_USERNAME || '',
  sapPassword: process.env.SAP_PASSWORD || '',

  // IMD / GKMS
  imdApiUrl: process.env.IMD_API_URL || '',

  // Bhashini
  bhashiniApiKey: process.env.BHASHINI_API_KEY || '',
  bhashiniApiUrl: process.env.BHASHINI_API_URL || '',

  // Notifications
  fcmServerKey: process.env.FCM_SERVER_KEY || '',
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
  twilioPhone: process.env.TWILIO_PHONE || '',
};
