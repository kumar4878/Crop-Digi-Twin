import api from '@/lib/api'

/** Get advisory for a specific field's active crop */
export async function getFieldAdvisory(fieldId: string) {
    const { data } = await api.get(`/crops/field/${fieldId}/advisory`)
    return data
}

/** Manually update crop stage */
export async function updateCropStage(fieldId: string, stage: string, reason?: string) {
    const { data } = await api.post(`/crops/field/${fieldId}/update-stage`, { stage, reason })
    return data
}

/** Get all fields with active crops (for DDE overview) */
export async function getActiveCropFields() {
    const { data } = await api.get('/crops/active')
    return data
}
