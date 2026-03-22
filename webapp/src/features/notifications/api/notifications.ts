import api from '@/lib/api'

/** Fetch paginated notifications */
export async function getNotifications(page = 1, limit = 20) {
    const { data } = await api.get('/dashboard/notifications', { params: { page, limit } })
    return data
}

/** Mark a single notification as read */
export async function markNotificationRead(id: string) {
    const { data } = await api.patch(`/dashboard/notifications/${id}/read`)
    return data
}
