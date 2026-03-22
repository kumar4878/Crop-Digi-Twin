import api from '@/lib/api'

// Get all pest incidents (optionally by field)
export async function getPestIncidents(fieldId?: string) {
    if (fieldId) {
        const { data } = await api.get(`/pest/field/${fieldId}`)
        return data
    }
    // If no fieldId, fetch all by trying the general endpoint
    const { data } = await api.get('/pest/field/all')
    return data
}

// Report a new pest incident
export async function reportPest(body: {
    fieldId: string
    images: string[]
    description?: string
    severity?: 'LOW' | 'MEDIUM' | 'HIGH'
    affectedArea?: number
}) {
    const { data } = await api.post('/pest/report', body)
    return data
}

// Get pest risk score for a field
export async function getPestRiskScore(fieldId: string) {
    const { data } = await api.get(`/pest/risk-score/${fieldId}`)
    return data
}

// Update pest incident status
export async function updatePestStatus(id: string, status: string) {
    const { data } = await api.patch(`/pest/${id}/status`, { status })
    return data
}
