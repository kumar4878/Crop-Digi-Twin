import api from '@/lib/api'

// Get soil reports by field
export async function getSoilReports(fieldId: string) {
    const { data } = await api.get(`/soil/reports/field/${fieldId}`)
    return data
}

// Upload / create soil report
export async function createSoilReport(body: {
    fieldId: string
    reportDate: string
    testingLab: string
    reportFile?: string
    manualEntry?: {
        ph: number
        nitrogen: number
        phosphorus: number
        potassium: number
        organicCarbon?: number
    }
}) {
    const { data } = await api.post('/soil/reports', body)
    return data
}

// Get fertilizer recommendations for a field
export async function getSoilRecommendations(fieldId: string) {
    const { data } = await api.get(`/soil/recommendations/${fieldId}`)
    return data
}
