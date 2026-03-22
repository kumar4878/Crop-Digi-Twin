import api from '@/lib/api'

export interface DashboardFarmerResponse {
    stats: {
        totalFarms: number
        totalFields: number
        totalAcreage: number
        activeCrops: number
        pendingAlerts: number
        upcomingHarvests: number
    }
    recentAlerts: Array<{
        _id: string
        type: string
        severity: string
        title: string
        message: string
        createdAt: string
    }>
    activeCrops: Array<{
        fieldId: string
        fieldName: string
        cropName: string
        currentStage: string
        sowingDate: string
        expectedHarvestDate: string
        healthScore: number
    }>
    weather?: {
        temperature: number
        humidity: number
        windSpeed: number
        condition: string
        rainfall: number
    }
}

/** Get farmer dashboard data */
export async function getFarmerDashboard(): Promise<DashboardFarmerResponse> {
    const { data } = await api.get('/dashboard/farmer')
    return data
}

/** Get CXO dashboard data */
export async function getCxoDashboard() {
    const { data } = await api.get('/dashboard/cxo')
    return data
}
