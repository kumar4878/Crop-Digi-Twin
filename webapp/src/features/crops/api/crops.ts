import api from '@/lib/api'

// Active crops for the logged-in user
export async function getActiveCrops() {
    const { data } = await api.get('/crops/active')
    return data
}

// Crop master list
export async function getCropMaster(search?: string) {
    const { data } = await api.get('/crops/master', { params: { search } })
    return data
}

// Crop calendar for a specific crop
export async function getCropCalendar(cropId: string) {
    const { data } = await api.get(`/crops/calendar/${cropId}`)
    return data
}

// Stage advisory for a field
export async function getFieldAdvisory(fieldId: string) {
    const { data } = await api.get(`/crops/field/${fieldId}/advisory`)
    return data
}

// Update crop stage manually
export async function updateFieldStage(fieldId: string, body: { newStage: string; reason?: string; overrideAuto: boolean }) {
    const { data } = await api.post(`/crops/field/${fieldId}/update-stage`, body)
    return data
}
