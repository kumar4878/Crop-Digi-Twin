import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import {
    MapPin,
    Wheat,
    CloudSun,
    Bug,
    Bell,
    TrendingUp,
    ChevronRight,
    Droplets,
    Wind,
    Loader2,
} from 'lucide-react'
import { getFarmerDashboard, getCxoDashboard } from '@/features/dashboard/api/dashboard'
import { getOpenMeteoWeather } from '@/features/weather/api/weather'

interface DashboardData {
    overview: {
        totalFarms: number
        totalFields: number
        activeCrops: number
        cropHealthIndex: number
    }
    activeCropsList: Array<{
        fieldId: string
        fieldName: string
        crop: string
        stage: string
    }>
    unreadNotifications: Array<{
        _id: string
        type: string
        severity: string
        title: string
        message: string
        createdAt: string
    }>
    [key: string]: unknown
}

interface WeatherData {
    temperature: number
    humidity: number
    windSpeed: number
    condition: string
    rainfall: number
}

const CXO_ROLES = ['CXO', 'ADMIN', 'SUPER_ADMIN', 'MANAGER']

export function DashboardPage() {
    const { user } = useAuthStore()
    const isCxo = CXO_ROLES.includes(user?.role || '')
    const [cxoData, setCxoData] = useState<any>(null)
    const [dashboard, setDashboard] = useState<DashboardData | null>(null)
    const [weather, setWeather] = useState<WeatherData | null>(null)
    const [loading, setLoading] = useState(true)
    const [_error, setError] = useState('')

    useEffect(() => {
        let cancelled = false

        async function fetchData() {
            try {
                setLoading(true)

                // Fetch dashboard and weather in parallel
                const isCxoRole = CXO_ROLES.includes(user?.role || '')
                const [dashboardData, weatherResult, cxoResult] = await Promise.all([
                    getFarmerDashboard().catch(() => null),
                    getOpenMeteoWeather(17.385, 78.4867).catch(() => null),
                    isCxoRole ? getCxoDashboard().catch(() => null) : Promise.resolve(null),
                ])

                if (!cancelled) {
                    if (dashboardData) setDashboard(dashboardData as any)
                    if (cxoResult) setCxoData(cxoResult)
                    if (weatherResult) {
                        setWeather({
                            temperature: weatherResult.current.temperature,
                            humidity: weatherResult.current.humidity,
                            windSpeed: weatherResult.current.windSpeed,
                            condition: weatherResult.current.condition,
                            rainfall: weatherResult.current.rainfall,
                        })
                    }
                }
            } catch (err: any) {
                if (!cancelled) setError(err?.message || 'Failed to load dashboard')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        fetchData()
        return () => { cancelled = true }
    }, [])

    // Fallback values when APIs return no data (new user, empty DB)
    const stats = {
        totalFarms: dashboard?.overview?.totalFarms ?? 0,
        totalFields: dashboard?.overview?.totalFields ?? 0,
        activeCrops: dashboard?.overview?.activeCrops ?? 0,
        cropHealthIndex: dashboard?.overview?.cropHealthIndex ?? 0,
    }

    const currentWeather = weather ?? {
        temperature: 0,
        humidity: 0,
        windSpeed: 0,
        condition: '--',
        rainfall: 0,
    }

    const alerts = dashboard?.unreadNotifications ?? []
    const activeCrops = dashboard?.activeCropsList ?? []

    const getSeverityVariant = (severity: string) => {
        const variants: Record<string, string> = {
            LOW: 'success',
            MEDIUM: 'warning',
            HIGH: 'danger',
            CRITICAL: 'danger',
        }
        return variants[severity] || 'secondary'
    }

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime()
        const hours = Math.floor(diff / (1000 * 60 * 60))
        if (hours < 1) return 'Just now'
        if (hours < 24) return `${hours}h ago`
        return `${Math.floor(hours / 24)}d ago`
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading dashboard...</span>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">
                    Welcome back, {user?.name?.split(' ')[0] || 'Farmer'}! 👋
                </h1>
                <p className="text-muted-foreground">
                    {isCxo ? 'Enterprise overview across all farms' : "Here's what's happening on your farm today"}
                </p>
            </div>

            {/* CXO Enterprise Overview */}
            {isCxo && cxoData && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-indigo-100 text-sm">Total Farms</p>
                                    <p className="text-3xl font-bold">{cxoData.overview?.totalFarms || 0}</p>
                                </div>
                                <MapPin className="h-10 w-10 text-indigo-200" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white border-0">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-teal-100 text-sm">Total Acreage</p>
                                    <p className="text-3xl font-bold">{cxoData.overview?.totalAcreage || 0}</p>
                                </div>
                                <TrendingUp className="h-10 w-10 text-teal-200" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-rose-500 to-rose-600 text-white border-0">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-rose-100 text-sm">Pest Outbreaks</p>
                                    <p className="text-3xl font-bold">{cxoData.riskExposure?.pestOutbreaks || 0}</p>
                                </div>
                                <Bug className="h-10 w-10 text-rose-200" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white border-0">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-cyan-100 text-sm">Crop Health</p>
                                    <p className="text-3xl font-bold">{cxoData.overview?.cropHealthIndex || 0}%</p>
                                </div>
                                <Wheat className="h-10 w-10 text-cyan-200" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm">Total Farms</p>
                                <p className="text-3xl font-bold">{stats.totalFarms}</p>
                            </div>
                            <MapPin className="h-10 w-10 text-green-200" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm">Total Fields</p>
                                <p className="text-3xl font-bold">{stats.totalFields}</p>
                            </div>
                            <TrendingUp className="h-10 w-10 text-blue-200" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-amber-100 text-sm">Active Crops</p>
                                <p className="text-3xl font-bold">{stats.activeCrops}</p>
                            </div>
                            <Wheat className="h-10 w-10 text-amber-200" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 text-sm">Crop Health</p>
                                <p className="text-3xl font-bold">{stats.cropHealthIndex}%</p>
                            </div>
                            <MapPin className="h-10 w-10 text-purple-200" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column - Weather & Crops */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Weather Widget */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-lg font-semibold">Today's Weather</CardTitle>
                            <Link to="/weather">
                                <Button variant="ghost" size="sm">
                                    View Forecast
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-4">
                                    <CloudSun className="h-16 w-16 text-amber-500" />
                                    <div>
                                        <p className="text-4xl font-bold">{Math.round(currentWeather.temperature)}°C</p>
                                        <p className="text-muted-foreground capitalize">{currentWeather.condition}</p>
                                    </div>
                                </div>
                                <div className="hidden md:flex flex-1 justify-around">
                                    <div className="flex items-center gap-2">
                                        <Droplets className="h-5 w-5 text-blue-500" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Humidity</p>
                                            <p className="font-medium">{Math.round(currentWeather.humidity)}%</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Wind className="h-5 w-5 text-gray-500" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Wind</p>
                                            <p className="font-medium">{Math.round(currentWeather.windSpeed)} km/h</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Droplets className="h-5 w-5 text-cyan-500" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Rainfall</p>
                                            <p className="font-medium">{currentWeather.rainfall?.toFixed(1) || '0'} mm</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Active Crops */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-lg font-semibold">Active Crops</CardTitle>
                            <Link to="/crops">
                                <Button variant="ghost" size="sm">
                                    View All
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {activeCrops.length > 0 ? (
                                <div className="space-y-4">
                                    {activeCrops.map((crop) => (
                                        <div
                                            key={crop.fieldId}
                                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                                    <Wheat className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{crop.crop || 'Unknown Crop'}</p>
                                                    <p className="text-sm text-muted-foreground">{crop.fieldName}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge variant="secondary" className="mb-1">
                                                    {(crop.stage || 'ACTIVE').replace('_', ' ')}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Wheat className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                                    <p className="text-muted-foreground">No active crops yet</p>
                                    <p className="text-sm text-muted-foreground">Create a farm and add fields to start tracking crops</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Alerts & Actions */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                Recent Alerts
                            </CardTitle>
                            <Link to="/notifications">
                                <Button variant="ghost" size="sm">View All</Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {alerts.length > 0 ? (
                                <div className="space-y-3">
                                    {alerts.map((alert) => (
                                        <div
                                            key={alert._id}
                                            className="p-3 rounded-lg border-l-4 bg-muted/50"
                                            style={{
                                                borderLeftColor:
                                                    alert.severity === 'HIGH' || alert.severity === 'CRITICAL'
                                                        ? 'rgb(239, 68, 68)'
                                                        : alert.severity === 'MEDIUM'
                                                            ? 'rgb(245, 158, 11)'
                                                            : 'rgb(34, 197, 94)',
                                            }}
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <p className="font-medium text-sm">{alert.title}</p>
                                                <Badge variant={getSeverityVariant(alert.severity) as any} className="text-[10px]">
                                                    {alert.severity}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-1">{alert.message}</p>
                                            <p className="text-xs text-muted-foreground">{timeAgo(alert.createdAt)}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <Bell className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">No unread alerts</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-2">
                            <Link to="/pest">
                                <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                                    <Bug className="h-5 w-5 text-red-500" />
                                    <span className="text-xs">Report Pest</span>
                                </Button>
                            </Link>
                            <Link to="/soil">
                                <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                                    <TrendingUp className="h-5 w-5 text-amber-500" />
                                    <span className="text-xs">Soil Report</span>
                                </Button>
                            </Link>
                            <Link to="/farms">
                                <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                                    <MapPin className="h-5 w-5 text-green-500" />
                                    <span className="text-xs">Add Farm</span>
                                </Button>
                            </Link>
                            <Link to="/weather">
                                <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                                    <CloudSun className="h-5 w-5 text-blue-500" />
                                    <span className="text-xs">Weather</span>
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
