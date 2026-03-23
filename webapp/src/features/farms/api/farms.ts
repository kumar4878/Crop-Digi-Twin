import api from '@/lib/api'

export interface FarmListItem {
    id: string
    name: string
    totalArea: number
    activeFields: number
    healthScore: number
    status: string
    district?: string
    state?: string
}

export interface FarmsResponse {
    farms: FarmListItem[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

export interface FarmDetail {
    _id: string
    name: string
    address: {
        line1?: string
        village: string
        district: string
        state: string
        pincode?: string
    }
    totalArea: number
    status: string
    fields: Array<{
        _id: string
        name: string
        area: number
        villageCode?: string
        villageName?: string
        villageMatchConfidence?: number
        currentCrop?: {
            cropName: string
            status: string
            currentStage?: string
            season?: string
        }
        healthMetrics?: {
            ndvi: number
            stressLevel: string
        }
        status: string
    }>
}

/** List farms for the current user */
export async function getFarms(page = 1, limit = 20, search?: string): Promise<FarmsResponse> {
    const { data } = await api.get('/farms', { params: { page, limit, search } })
    return data
}

/** Get farm details by ID */
export async function getFarmById(id: string): Promise<FarmDetail> {
    const { data } = await api.get(`/farms/${id}`)
    return data
}

/** Create a new farm */
export async function createFarm(farm: {
    name: string
    address: Record<string, string>
    location?: { type: string; coordinates: number[] }
    totalArea: number
    ownershipType: string
}) {
    // Provide a default location if not given (India center)
    const payload = {
        ...farm,
        location: farm.location || { type: 'Point', coordinates: [78.9629, 20.5937] },
    }
    const { data } = await api.post('/farms', payload)
    return data
}

/** Update a farm */
export async function updateFarm(id: string, updates: Record<string, unknown>) {
    const { data } = await api.patch(`/farms/${id}`, updates)
    return data
}

/** Delete a farm (soft delete) */
export async function deleteFarm(id: string) {
    const { data } = await api.delete(`/farms/${id}`)
    return data
}

/** Create a new field for a farm */
export async function createField(field: {
    farmId: string
    name: string
    soilType: string
    irrigationType: string
    boundary: { type: string; coordinates: number[][][] }
}) {
    // Provide a default fallback boundary if missing (a small square around center point)
    const payload = {
        ...field,
        boundary: field.boundary || { 
            type: 'Polygon', 
            coordinates: [[[78.96, 20.59], [78.961, 20.59], [78.961, 20.591], [78.96, 20.591], [78.96, 20.59]]] 
        },
    }
    const { data } = await api.post('/fields', payload)
    return data
}

/** Update a field */
export async function updateField(id: string, updates: Record<string, unknown>) {
    const { data } = await api.patch(`/fields/${id}`, updates)
    return data
}

/** Delete a field (soft delete) */
export async function deleteField(id: string) {
    const { data } = await api.delete(`/fields/${id}`)
    return data
}

/** Assign a crop to a field */
export async function assignCropToField(fieldId: string, cropData: {
    cropId: string
    season: string
    sowingDate: string
    expectedHarvestDate: string
    targetYield?: number
    seedVariety?: string
}) {
    const { data } = await api.post(`/fields/${fieldId}/assign-crop`, cropData)
    return data
}
