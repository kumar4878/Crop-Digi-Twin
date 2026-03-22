// User & Auth Types
export type UserRole =
    | 'SUPER_ADMIN'
    | 'ADMIN'
    | 'CXO'
    | 'MANAGER'
    | 'AGRONOMIST'
    | 'TM'
    | 'SALES'
    | 'FARMER'

export interface User {
    _id: string
    mobile: string
    email: string
    name: string
    avatar?: string
    role: UserRole
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
    language: 'en' | 'hi' | 'te' | 'ta' | 'mr' | 'kn'
    preferences: UserPreferences
    assignedRegions?: string[]
    createdAt: string
    updatedAt: string
}

export interface UserPreferences {
    notifications: {
        email: boolean
        sms: boolean
        push: boolean
    }
    theme: 'light' | 'dark' | 'auto'
    units: {
        temperature: 'celsius' | 'fahrenheit'
        area: 'acres' | 'hectares' | 'bigha'
        rainfall: 'mm' | 'inches'
    }
}

// Farm & Field Types
export interface Farm {
    _id: string
    userId: string
    name: string
    registrationNumber?: string
    address: Address
    location: GeoPoint
    totalArea: number
    ownershipType: 'OWNED' | 'LEASED' | 'SHARED' | 'CONTRACT'
    landType: 'IRRIGATED' | 'RAINFED' | 'MIXED'
    regionId?: string
    status: 'ACTIVE' | 'INACTIVE'
    fieldsCount?: number
    createdAt: string
    updatedAt: string
}

export interface Address {
    line1: string
    line2?: string
    village: string
    taluk?: string
    district: string
    state: string
    pincode: string
    country: string
}

export interface GeoPoint {
    type: 'Point'
    coordinates: [number, number] // [longitude, latitude]
}

export interface GeoPolygon {
    type: 'Polygon'
    coordinates: number[][][]
}

export interface Field {
    _id: string
    farmId: string
    name: string
    fieldCode?: string
    boundary: GeoPolygon
    centroid: GeoPoint
    area: number
    areaUnit: 'acres' | 'hectares'
    soilType: SoilType
    soilTexture?: 'FINE' | 'MEDIUM' | 'COARSE'
    irrigationType: IrrigationType
    irrigationSource?: 'BOREWELL' | 'CANAL' | 'RIVER' | 'TANK' | 'POND'
    elevation?: number
    drainage: 'GOOD' | 'MODERATE' | 'POOR'
    currentCrop?: CurrentCrop
    healthMetrics?: HealthMetrics
    status: 'ACTIVE' | 'INACTIVE' | 'FALLOW'
    createdAt: string
    updatedAt: string
}

export type SoilType =
    | 'CLAY' | 'LOAM' | 'SANDY' | 'SILT'
    | 'SANDY_LOAM' | 'CLAY_LOAM' | 'SILTY_LOAM'
    | 'PEATY' | 'CHALKY' | 'BLACK_COTTON' | 'RED' | 'ALLUVIAL'

export type IrrigationType =
    | 'DRIP' | 'SPRINKLER' | 'FLOOD' | 'FURROW' | 'RAINFED' | 'MICRO_SPRINKLER'

export interface CurrentCrop {
    cropId: string
    cropName: string
    varietyId?: string
    varietyName?: string
    season: string
    sowingDate: string
    expectedHarvestDate: string
    targetYield: number
    targetYieldUnit: 'tons' | 'quintals' | 'kg'
    status: 'ACTIVE' | 'HARVESTED' | 'FAILED' | 'ABANDONED'
    currentStage?: CropStage
}

export interface HealthMetrics {
    ndvi: number
    lai?: number
    stressLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    lastUpdated: string
}

// Crop Types
export type CropStage =
    | 'SOWING'
    | 'GERMINATION'
    | 'VEGETATIVE'
    | 'FLOWERING'
    | 'FRUITING'
    | 'MATURATION'
    | 'HARVEST'

export interface CropMaster {
    _id: string
    name: string
    localNames: Record<string, string>
    scientificName: string
    category: string
    growingSeasons: string[]
    avgDurationDays: number
    waterRequirement: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
    iconUrl?: string
    imageUrl?: string
}

export interface FieldCropStage {
    _id: string
    fieldId: string
    farmId: string
    cropId: string
    cropName: string
    varietyName?: string
    season: string
    sowingDate: string
    currentStage: CropStage
    currentStageNumber: number
    stageHistory: StageHistoryItem[]
    expectedHarvestDate: string
    actualHarvestDate?: string
    yieldAchieved?: {
        value: number
        unit: string
    }
    status: 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'ABANDONED'
}

export interface StageHistoryItem {
    stage: CropStage
    stageNumber: number
    enteredAt: string
    exitedAt?: string
    durationDays: number
}

// Weather Types
export interface WeatherData {
    temperature: number
    temperatureMin: number
    temperatureMax: number
    feelsLike: number
    humidity: number
    pressure: number
    windSpeed: number
    windDirection?: number
    rainfall: number
    cloudCover?: number
    uvIndex?: number
    condition: string
    conditionDescription?: string
    conditionIcon?: string
}

export interface WeatherForecast extends WeatherData {
    date: string
}

export interface WeatherAlert {
    _id: string
    type: string
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    title: string
    message: string
    recommendations: string[]
    validFrom: string
    validTo?: string
    status: 'ACTIVE' | 'ACKNOWLEDGED' | 'EXPIRED'
}

// Pest Types
export interface PestIncident {
    _id: string
    fieldId: string
    farmId: string
    reportedBy: string
    reportedAt: string
    images: PestImage[]
    identification: PestIdentification
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    affectedArea: number
    symptoms: string[]
    description?: string
    treatment: {
        recommended: Treatment[]
        applied: AppliedTreatment[]
    }
    status: 'REPORTED' | 'IDENTIFIED' | 'UNDER_TREATMENT' | 'MONITORING' | 'RESOLVED'
}

export interface PestImage {
    url: string
    thumbnailUrl: string
    uploadedAt: string
    aiAnalyzed: boolean
}

export interface PestIdentification {
    pestId?: string
    pestName?: string
    scientificName?: string
    confidence: number
    method: 'AI' | 'MANUAL' | 'AGRONOMIST'
}

export interface Treatment {
    _id: string
    productName: string
    activeIngredient: string
    productType: 'CHEMICAL' | 'BIOLOGICAL' | 'ORGANIC' | 'IPM'
    dosage: string
    applicationMethod: string
    effectivenessRating: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
}

export interface AppliedTreatment {
    productName: string
    quantity: number
    unit: string
    appliedAt: string
    appliedBy: string
    effectiveness: 'NOT_EFFECTIVE' | 'PARTIAL' | 'EFFECTIVE' | 'PENDING'
}

// Soil Types
export interface SoilReport {
    _id: string
    fieldId: string
    reportDate: string
    testingLab: string
    reportFile?: string
    results: SoilResults
    interpretation: SoilInterpretation
    recommendations: SoilRecommendations
    status: 'PENDING' | 'VERIFIED' | 'REJECTED'
}

export interface SoilResults {
    ph: number
    nitrogen: number
    phosphorus: number
    potassium: number
    organicCarbon?: number
    electricalConductivity?: number
    micronutrients?: Record<string, number>
}

export interface SoilInterpretation {
    phRating: string
    nitrogenRating: string
    phosphorusRating: string
    potassiumRating: string
    overallScore: number
    healthStatus: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT'
}

export interface SoilRecommendations {
    fertilizers: FertilizerRecommendation[]
    generalAdvice: string[]
}

export interface FertilizerRecommendation {
    name: string
    type: 'ORGANIC' | 'CHEMICAL' | 'BIO'
    quantity: number
    applicationStage: CropStage
    timing: string
}

// Notification Types
export interface Notification {
    _id: string
    userId: string
    type: string
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    title: string
    message: string
    imageUrl?: string
    actionUrl?: string
    entityType?: string
    entityId?: string
    readAt?: string
    createdAt: string
}

// API Response Types
export interface ApiResponse<T> {
    success: boolean
    data: T
    message?: string
}

export interface PaginatedResponse<T> {
    success: boolean
    data: T[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

// Dashboard Types
export interface DashboardStats {
    totalFarms: number
    totalFields: number
    totalAcreage: number
    activeCrops: number
    pendingAlerts: number
    upcomingHarvests: number
}
