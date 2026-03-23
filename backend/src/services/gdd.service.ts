import { Field } from '../models/Field';
import { FieldCropStage } from '../models/FieldCropStage';
import { CropCalendar, ICropCalendar } from '../models/CropCalendar';
import { eventSourcingService } from './eventSourcing.service';

// In a real system, you would call an external API or query the Weather service
// For this digital twin feature, we'll mock the historical weather query:
const getHistoricalAvgTemp = async (lat: number, lon: number, date: Date) => {
  // Mock average temperature between 25-35 Celsius for Indian agriculture context
  return 25 + Math.random() * 10;
};

export class GddService {
  /**
   * Calculates the Accumulated Growing Degree Days for a given field and crop
   */
  async calculateGDD(fieldId: string, cropId: string, startDate: Date) {
    const crop = await CropCalendar.findById(cropId);
    if (!crop) throw new Error('Crop Calendar not found');

    const baseTemp = crop.tBase || 10;
    
    const field = await Field.findById(fieldId);
    if (!field || !field.centroid || !field.centroid.coordinates) {
      throw new Error('Field location missing for GDD calculation');
    }

    const [lon, lat] = field.centroid.coordinates;
    const now = new Date();
    
    let gddAccumulated = 0;
    
    // Calculate GDD day by day since the start date
    // Note: In an enterprise app, this would be computed incrementally or via batch DB query
    let currentDate = new Date(startDate);
    while (currentDate <= now) {
      const avgTemp = await getHistoricalAvgTemp(lat, lon, currentDate);
      const dailyGDD = Math.max(0, avgTemp - baseTemp);
      gddAccumulated += dailyGDD;
      
      currentDate.setDate(currentDate.getDate() + 1); // increment by 1 day
    }
    
    return { gddAccumulated };
  }

  /**
   * Checks if a field has accumulated enough GDD to progress to the next stage
   */
  async checkStageProgression(fieldId: string) {
    const field = await Field.findById(fieldId);
    if (!field || field.status !== 'ACTIVE' || !field.currentCrop) {
      return { readyToProgress: false, reason: 'Field inactive or no crop assigned' };
    }

    const cropStage = await FieldCropStage.findOne({ 
      fieldId, 
      season: field.currentCrop.season 
    });

    if (!cropStage) {
      return { readyToProgress: false, reason: 'No crop stage tracking found' };
    }

    const { gddAccumulated } = await this.calculateGDD(
      fieldId,
      cropStage.cropId.toString(),
      cropStage.sowingDate
    );

    const calendar = await CropCalendar.findById(cropStage.cropId);
    if (!calendar) throw new Error('Crop Calendar missing');

    const currentIndex = calendar.stages.findIndex(s => s.stage === cropStage.currentStage);
    
    // If we're at HARVEST, there is no next stage
    if (currentIndex === -1 || currentIndex === calendar.stages.length - 1) {
      return {
        currentStage: cropStage.currentStage,
        gddAccumulated,
        readyToProgress: false,
        reason: 'Crop has reached final stage'
      };
    }

    const nextStage = calendar.stages[currentIndex + 1];
    
    // Default to fallback duration days if GDD is missing in the DB
    const expectedGdd = nextStage.gddRequired || (nextStage.durationDays * 15);
    const readyToProgress = gddAccumulated >= expectedGdd;

    return {
      currentStage: cropStage.currentStage,
      gddAccumulated,
      gddRequired: expectedGdd,
      readyToProgress,
      nextStage: nextStage.stage,
      farmerId: field.farmId // Using farmId as farmer reference for simplicity
    };
  }

  /**
   * Batch process to evaluate and automatically progress stages for all Active fields
   */
  async autoProgressStages() {
    console.log('[GDD Engine] Starting Auto-Progression Batch Job...');
    
    const activeFields = await Field.find({ 'currentCrop.status': 'ACTIVE' }).select('_id currentCrop farmId');
    let progressedCount = 0;

    for (const field of activeFields) {
      try {
        const check = await this.checkStageProgression(field._id.toString());
        
        if (check.readyToProgress && check.nextStage) {
           console.log(`[GDD Engine] Auto-progressing Field ${field._id} to ${check.nextStage}`);
          
           // 1. Emit Immutable Event for Ledger (Audit Trail)
           await eventSourcingService.createEvent({
             eventType: 'STAGE_PROGRESSION',
             timestamp: new Date(),
             farmerId: check.farmerId,
             plotId: field._id,
             season: field.currentCrop!.season, // guaranteed present if active
             payload: {
               before: { stage: check.currentStage, gdd: check.gddAccumulated },
               after: { stage: check.nextStage, gdd: check.gddAccumulated },
               reasoning: [`GDD Accumulated (${Math.round(check.gddAccumulated)}) exceeded required threshold (${check.gddRequired}) for ${check.nextStage}`]
             },
             provenance: {
               source: 'SYSTEM',
               triggeredBy: 'CRON_GDD_ENGINE',
               confidence: 95,
               modelVersion: 'GDD-V1'
             }
           });

           // 2. Update the transactional store table (FieldCropStage)
           await FieldCropStage.findOneAndUpdate(
             { fieldId: field._id, season: field.currentCrop!.season },
             { 
               $set: { currentStage: check.nextStage },
               $push: { 
                 stageHistory: {
                   stage: check.nextStage,
                   enteredAt: new Date(),
                   gddAccumulated: check.gddAccumulated,
                   wasAutoProgressed: true
                 }
               }
             }
           );
           
           progressedCount++;
        }
      } catch (error) {
         console.error(`[GDD Engine] Error evaluating field ${field._id}:`, error);
      }
    }
    
    console.log(`[GDD Engine] Batch completed. Auto-progressed ${progressedCount} fields.`);
    return { success: true, progressedCount };
  }
}

export const gddService = new GddService();
