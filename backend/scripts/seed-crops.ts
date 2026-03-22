import mongoose from 'mongoose';
import { CropCalendar } from '../src/models/CropCalendar';
import { config } from '../src/config/env';

const MONGO_URI = config.mongodbUri || 'mongodb://localhost:27017/crop_farming_v2';

async function seedCropMaster() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    await CropCalendar.deleteMany({});
    console.log('Cleared existing crop calendars');

    const crops = [
      {
        cropName: 'Wheat', category: 'CEREAL', growingSeasons: ['RABI'], avgDuration: 120, tBase: 5, totalDuration: 120,
        stages: [
          { stage: 'SOWING', durationDays: 10, keyActivities: ['Land preparation', 'Seed treatment'] },
          { stage: 'GERMINATION', durationDays: 15, keyActivities: ['Irrigation'] },
          { stage: 'VEGETATIVE', durationDays: 45, keyActivities: ['Weeding', 'Fertilizer application'] },
          { stage: 'FLOWERING', durationDays: 20, keyActivities: ['Pest monitoring'] },
          { stage: 'MATURATION', durationDays: 20, keyActivities: ['Reduce irrigation'] },
          { stage: 'HARVEST', durationDays: 10, keyActivities: ['Combine harvesting'] },
        ]
      },
      {
        cropName: 'Rice (Paddy)', category: 'CEREAL', growingSeasons: ['KHARIF', 'ZAID'], avgDuration: 150, tBase: 10, totalDuration: 150,
        stages: [
          { stage: 'SOWING', durationDays: 20, keyActivities: ['Nursery preparation'] },
          { stage: 'VEGETATIVE', durationDays: 60, keyActivities: ['Transplanting', 'Flooding'] },
          { stage: 'FLOWERING', durationDays: 30, keyActivities: ['Disease management'] },
          { stage: 'MATURATION', durationDays: 30, keyActivities: ['Drain fields'] },
          { stage: 'HARVEST', durationDays: 10, keyActivities: ['Harvesting'] },
        ]
      },
      {
        cropName: 'Cotton', category: 'FIBER', growingSeasons: ['KHARIF'], avgDuration: 160, tBase: 12, totalDuration: 160,
        stages: [
          { stage: 'SOWING', durationDays: 15, keyActivities: ['Deep ploughing'] },
          { stage: 'VEGETATIVE', durationDays: 45, keyActivities: ['Weeding'] },
          { stage: 'FLOWERING', durationDays: 40, keyActivities: ['Bollworm monitoring'] },
          { stage: 'FRUITING', durationDays: 40, keyActivities: ['Irrigation management'] },
          { stage: 'HARVEST', durationDays: 20, keyActivities: ['Picking'] },
        ]
      },
      {
        cropName: 'Maize', category: 'CEREAL', growingSeasons: ['KHARIF', 'RABI'], avgDuration: 100, tBase: 10, totalDuration: 100,
        stages: [
          { stage: 'SOWING', durationDays: 10, keyActivities: ['Seed bed preparation'] },
          { stage: 'GERMINATION', durationDays: 10, keyActivities: ['Thinning'] },
          { stage: 'VEGETATIVE', durationDays: 35, keyActivities: ['Weeding', 'Earthing up'] },
          { stage: 'FLOWERING', durationDays: 15, keyActivities: ['Pollination monitoring'] },
          { stage: 'MATURATION', durationDays: 20, keyActivities: ['Reduce irrigation'] },
          { stage: 'HARVEST', durationDays: 10, keyActivities: ['Dehusking'] },
        ]
      },
      {
        cropName: 'Soybean', category: 'OILSEED', growingSeasons: ['KHARIF'], avgDuration: 100, tBase: 10, totalDuration: 100,
        stages: [
          { stage: 'SOWING', durationDays: 10, keyActivities: ['Seed inoculation with Rhizobium'] },
          { stage: 'GERMINATION', durationDays: 10, keyActivities: ['Gap filling'] },
          { stage: 'VEGETATIVE', durationDays: 35, keyActivities: ['Weeding', 'Pest scouting'] },
          { stage: 'FLOWERING', durationDays: 20, keyActivities: ['Pod borer monitoring'] },
          { stage: 'MATURATION', durationDays: 15, keyActivities: ['Stop irrigation'] },
          { stage: 'HARVEST', durationDays: 10, keyActivities: ['Threshing'] },
        ]
      },
      {
        cropName: 'Groundnut', category: 'OILSEED', growingSeasons: ['KHARIF', 'RABI'], avgDuration: 120, tBase: 12, totalDuration: 120,
        stages: [
          { stage: 'SOWING', durationDays: 10, keyActivities: ['Kernel treatment'] },
          { stage: 'GERMINATION', durationDays: 12, keyActivities: ['Light irrigation'] },
          { stage: 'VEGETATIVE', durationDays: 30, keyActivities: ['Weeding', 'Gypsum application'] },
          { stage: 'FLOWERING', durationDays: 25, keyActivities: ['Pegging stage care'] },
          { stage: 'MATURATION', durationDays: 30, keyActivities: ['Pod development monitoring'] },
          { stage: 'HARVEST', durationDays: 13, keyActivities: ['Digging', 'Drying'] },
        ]
      },
      {
        cropName: 'Sugarcane', category: 'CASH_CROP', growingSeasons: ['KHARIF', 'RABI'], avgDuration: 360, tBase: 12, totalDuration: 360,
        stages: [
          { stage: 'SOWING', durationDays: 30, keyActivities: ['Sett treatment', 'Furrow planting'] },
          { stage: 'GERMINATION', durationDays: 30, keyActivities: ['Gap filling', 'Irrigation'] },
          { stage: 'VEGETATIVE', durationDays: 120, keyActivities: ['Earthing up', 'Fertilizer'] },
          { stage: 'FLOWERING', durationDays: 60, keyActivities: ['De-trashing'] },
          { stage: 'MATURATION', durationDays: 90, keyActivities: ['Withhold irrigation'] },
          { stage: 'HARVEST', durationDays: 30, keyActivities: ['Machine harvesting'] },
        ]
      },
      {
        cropName: 'Chili (Mirchi)', category: 'VEGETABLE', growingSeasons: ['KHARIF', 'RABI'], avgDuration: 150, tBase: 15, totalDuration: 150,
        stages: [
          { stage: 'SOWING', durationDays: 25, keyActivities: ['Nursery raising'] },
          { stage: 'VEGETATIVE', durationDays: 40, keyActivities: ['Transplanting', 'Staking'] },
          { stage: 'FLOWERING', durationDays: 30, keyActivities: ['Thrips management'] },
          { stage: 'FRUITING', durationDays: 40, keyActivities: ['Picking'] },
          { stage: 'HARVEST', durationDays: 15, keyActivities: ['Drying'] },
        ]
      },
      {
        cropName: 'Tomato', category: 'VEGETABLE', growingSeasons: ['RABI', 'KHARIF'], avgDuration: 120, tBase: 12, totalDuration: 120,
        stages: [
          { stage: 'SOWING', durationDays: 20, keyActivities: ['Nursery bed preparation'] },
          { stage: 'VEGETATIVE', durationDays: 30, keyActivities: ['Transplanting', 'Staking'] },
          { stage: 'FLOWERING', durationDays: 25, keyActivities: ['Pollination', 'Pest control'] },
          { stage: 'FRUITING', durationDays: 30, keyActivities: ['Harvesting in batches'] },
          { stage: 'HARVEST', durationDays: 15, keyActivities: ['Grading', 'Packing'] },
        ]
      },
      {
        cropName: 'Onion', category: 'VEGETABLE', growingSeasons: ['RABI', 'KHARIF'], avgDuration: 130, tBase: 10, totalDuration: 130,
        stages: [
          { stage: 'SOWING', durationDays: 35, keyActivities: ['Nursery raising', 'Transplanting'] },
          { stage: 'VEGETATIVE', durationDays: 40, keyActivities: ['Weeding', 'Irrigation'] },
          { stage: 'MATURATION', durationDays: 40, keyActivities: ['Neck fall monitoring'] },
          { stage: 'HARVEST', durationDays: 15, keyActivities: ['Curing', 'Storage preparation'] },
        ]
      },
    ];

    for (const data of crops) {
      await CropCalendar.create(data);
    }
    
    console.log(`Successfully seeded ${crops.length} master crops`);
  } catch (error) {
    console.error('Error seeding crops:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

seedCropMaster();
