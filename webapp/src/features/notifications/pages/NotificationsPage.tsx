import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, Bug, CloudRain, Wheat, Settings, CheckCheck, Loader2 } from 'lucide-react'
import { getNotifications, markNotificationRead } from '@/features/notifications/api/notifications'

interface Notification {
    _id: string
    type: string
    title: string
    message: string
    severity: string
    readAt?: string
    createdAt: string
}

export function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)

    const fetchNotifications = async () => {
        try {
            setLoading(true)
            const data = await getNotifications(1, 50)
            setNotifications(data.notifications || [])
        } catch {
            setNotifications([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchNotifications() }, [])

    const handleMarkRead = async (id: string) => {
        try {
            await markNotificationRead(id)
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, readAt: new Date().toISOString() } : n))
        } catch { /* silent */ }
    }

    const handleMarkAllRead = async () => {
        const unread = notifications.filter(n => !n.readAt)
        await Promise.all(unread.map(n => markNotificationRead(n._id).catch(() => {})))
        setNotifications(prev => prev.map(n => ({ ...n, readAt: n.readAt || new Date().toISOString() })))
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'PEST_ALERT': return <Bug className="h-5 w-5 text-red-500" />
            case 'WEATHER_ALERT': return <CloudRain className="h-5 w-5 text-blue-500" />
            case 'STAGE_CHANGE': return <Wheat className="h-5 w-5 text-green-500" />
            default: return <Bell className="h-5 w-5 text-amber-500" />
        }
    }

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 60) return `${mins}m ago`
        const hours = Math.floor(mins / 60)
        if (hours < 24) return `${hours}h ago`
        return `${Math.floor(hours / 24)}d ago`
    }

    const unreadCount = notifications.filter(n => !n.readAt).length

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading notifications...</span>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Notifications</h1>
                    <p className="text-muted-foreground">{unreadCount} unread</p>
                </div>
                <div className="flex gap-2">
                    {unreadCount > 0 && (
                        <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                            <CheckCheck className="h-4 w-4 mr-2" />
                            Mark all read
                        </Button>
                    )}
                    <Button variant="ghost" size="icon">
                        <Settings className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {notifications.length > 0 ? (
                <div className="grid gap-2">
                    {notifications.map((notif) => (
                        <Card
                            key={notif._id}
                            className={`cursor-pointer transition-colors ${!notif.readAt ? 'bg-primary/5 border-primary/20' : ''}`}
                            onClick={() => !notif.readAt && handleMarkRead(notif._id)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1">{getIcon(notif.type)}</div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className={`font-medium ${!notif.readAt ? 'text-foreground' : 'text-muted-foreground'}`}>{notif.title}</h3>
                                            <span className="text-xs text-muted-foreground">{timeAgo(notif.createdAt)}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                                    </div>
                                    {!notif.readAt && <div className="h-2 w-2 rounded-full bg-primary mt-2" />}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <Bell className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        You'll receive alerts for weather changes, pest detections, crop stage transitions, and more.
                    </p>
                </div>
            )}
        </div>
    )
}
