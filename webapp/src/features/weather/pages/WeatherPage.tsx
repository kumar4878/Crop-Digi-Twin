import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Droplets, Wind, Sun, AlertTriangle, Loader2, MapPin, Thermometer,
    Eye, CloudRain, Sunrise, Sunset, Clock, Gauge, Leaf,
} from 'lucide-react'
import { getOpenMeteoWeather, reverseGeocode, degreesToCompass } from '@/features/weather/api/weather'
import type { OpenMeteoCurrentWeather, HourlyData, DailyData, LocationInfo } from '@/features/weather/api/weather'

export function WeatherPage() {
    const [current, setCurrent] = useState<OpenMeteoCurrentWeather | null>(null)
    const [allHourly, setAllHourly] = useState<HourlyData[]>([])
    const [daily, setDaily] = useState<DailyData[]>([])
    const [location, setLocation] = useState<LocationInfo | null>(null)
    const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [selectedDateIdx, setSelectedDateIdx] = useState(0)

    const DEFAULT_LAT = 17.385
    const DEFAULT_LON = 78.4867

    useEffect(() => {
        let cancelled = false
        async function fetchAll() {
            try {
                setLoading(true)
                let lat = DEFAULT_LAT, lon = DEFAULT_LON
                if (navigator.geolocation) {
                    try {
                        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
                            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
                        )
                        lat = pos.coords.latitude
                        lon = pos.coords.longitude
                    } catch { /* fallback */ }
                }
                if (cancelled) return
                setCoords({ lat, lon })
                const [weather, loc] = await Promise.all([
                    getOpenMeteoWeather(lat, lon),
                    reverseGeocode(lat, lon),
                ])
                if (!cancelled) {
                    setCurrent(weather.current)
                    setAllHourly(weather.hourly)
                    setDaily(weather.daily)
                    setLocation(loc)
                }
            } catch (err: any) {
                if (!cancelled) setError(err?.message || 'Failed to load weather')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        fetchAll()
        return () => { cancelled = true }
    }, [])

    const selectedDay = daily[selectedDateIdx] ?? null
    const hourlyForSelectedDay = useMemo(() => {
        if (!selectedDay) return []
        return allHourly.filter(h => h.time.startsWith(selectedDay.date))
    }, [allHourly, selectedDay])

    // Helpers
    const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    const fmtSunTime = (iso: string) => iso ? new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '--'
    const getDayLabel = (dateStr: string, i: number) => {
        if (i === 0) return 'Today'
        if (i === 1) return 'Tomorrow'
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Fetching weather data...</span>
            </div>
        )
    }

    if (error || !current || daily.length === 0) {
        return (
            <div className="space-y-6">
                <div><h1 className="text-2xl font-bold">Weather</h1></div>
                <Card className="border-l-4 border-l-red-500">
                    <CardContent className="flex items-center gap-3 py-6">
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                        <div>
                            <p className="font-medium">Unable to load weather data</p>
                            <p className="text-sm text-muted-foreground">{error || 'Please try again later.'}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Use today's daily data for advisories (always based on today)
    const todayDaily = daily[0]

    return (
        <div className="space-y-6">
            {/* ═══════ HEADER ═══════ */}
            <div>
                <h1 className="text-2xl font-bold">Weather</h1>
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4" />
                    <span>{location?.displayName || 'Your Location'}</span>
                    {coords && (
                        <span className="text-xs text-muted-foreground/60">
                            ({coords.lat.toFixed(2)}°N, {coords.lon.toFixed(2)}°E)
                        </span>
                    )}
                </div>
            </div>

            {/* ═══════ CURRENT WEATHER ═══════ */}
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 overflow-hidden">
                <CardContent className="pt-6 relative">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm">Right Now</p>
                            <p className="text-6xl font-bold">{Math.round(current.temperature)}°C</p>
                            <p className="text-xl text-blue-100 mt-1">{current.conditionIcon} {current.condition}</p>
                            <p className="text-sm text-blue-200 mt-1">Feels like {Math.round(current.feelsLike)}°C</p>
                        </div>
                        <div className="text-8xl opacity-80">{current.conditionIcon}</div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/20">
                        <Stat icon={<Droplets className="h-4 w-4" />} label="Humidity" value={`${Math.round(current.humidity)}%`} />
                        <Stat icon={<Wind className="h-4 w-4" />} label="Wind" value={`${Math.round(current.windSpeed)} km/h ${degreesToCompass(current.windDirection)}`} />
                        <Stat icon={<CloudRain className="h-4 w-4" />} label="Precipitation" value={`${current.rainfall.toFixed(1)} mm`} />
                        <Stat icon={<Sun className="h-4 w-4" />} label="UV Index" value={`${current.uvIndex.toFixed(1)}`} />
                        <Stat icon={<Gauge className="h-4 w-4" />} label="Pressure" value={`${Math.round(current.pressure)} hPa`} />
                        <Stat icon={<Thermometer className="h-4 w-4" />} label="Dew Point" value={`${Math.round(current.dewPoint)}°C`} />
                        <Stat icon={<Eye className="h-4 w-4" />} label="Cloud Cover" value={`${current.cloudCover}%`} />
                        <Stat icon={<Wind className="h-4 w-4" />} label="Gusts" value={`${Math.round(current.windGusts)} km/h`} />
                    </div>
                </CardContent>
            </Card>

            {/* ═══════ ALERTS ═══════ */}
            {current.rainfall > 10 && (
                <Card className="border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/20">
                    <CardContent className="flex items-center gap-3 py-4">
                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                        <div>
                            <p className="font-medium text-amber-800 dark:text-amber-200">Heavy Precipitation</p>
                            <p className="text-sm text-amber-600 dark:text-amber-400">{current.rainfall.toFixed(1)}mm detected. Check drainage and delay fertilizer.</p>
                        </div>
                    </CardContent>
                </Card>
            )}
            {current.temperature > 40 && (
                <Card className="border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/20">
                    <CardContent className="flex items-center gap-3 py-4">
                        <Thermometer className="h-5 w-5 text-red-600 shrink-0" />
                        <div>
                            <p className="font-medium text-red-800 dark:text-red-200">Extreme Heat Warning</p>
                            <p className="text-sm text-red-600 dark:text-red-400">Temperature exceeds 40°C. Increase irrigation frequency.</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ═══════ FARMING ADVISORIES (Today-based) ═══════ */}
            {todayDaily && (
                <div>
                    <h2 className="text-lg font-semibold mb-3">Today's Farming Advisories</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AdvisoryCard
                            icon={<Droplets className="h-5 w-5 text-blue-500" />}
                            title="Irrigation Advisory"
                            severity={todayDaily.rainfall > 5 ? 'skip' : todayDaily.et0Evapotranspiration > 5 ? 'increase' : 'normal'}
                            content={
                                todayDaily.rainfall > 5
                                    ? `${todayDaily.rainfall.toFixed(1)}mm of rain expected — skip irrigation today.`
                                    : todayDaily.et0Evapotranspiration > 5
                                        ? `High evapotranspiration (${todayDaily.et0Evapotranspiration.toFixed(1)}mm ET₀). Increase irrigation by ~${Math.round(todayDaily.et0Evapotranspiration * 0.8)}mm.`
                                        : `Normal conditions. Apply ~${Math.round(todayDaily.et0Evapotranspiration * 0.7)}mm irrigation per ET₀ reference.`
                            }
                        />
                        <AdvisoryCard
                            icon={<Wind className="h-5 w-5 text-gray-500" />}
                            title="Spray Advisory"
                            severity={todayDaily.windSpeedMax > 20 || todayDaily.precipitationProbabilityMax > 60 ? 'avoid' : 'good'}
                            content={
                                todayDaily.windSpeedMax > 20
                                    ? `Wind gusts up to ${Math.round(todayDaily.windGustsMax)} km/h — avoid spraying. Pesticide drift likely.`
                                    : todayDaily.precipitationProbabilityMax > 60
                                        ? `${todayDaily.precipitationProbabilityMax}% chance of rain — postpone spraying to avoid washoff.`
                                        : `Wind ${Math.round(todayDaily.windSpeedMax)} km/h, low rain chance. Good for spraying. Best: early morning.`
                            }
                        />
                        <AdvisoryCard
                            icon={<Sun className="h-5 w-5 text-amber-500" />}
                            title="UV & Fieldwork"
                            severity={todayDaily.uvIndexMax > 8 ? 'danger' : todayDaily.uvIndexMax > 5 ? 'caution' : 'safe'}
                            content={
                                todayDaily.uvIndexMax > 8
                                    ? `Very high UV (${todayDaily.uvIndexMax.toFixed(0)}). Avoid outdoor work 10am–3pm.`
                                    : todayDaily.uvIndexMax > 5
                                        ? `Moderate UV (${todayDaily.uvIndexMax.toFixed(0)}). Wear protective clothing for extended work.`
                                        : `Low UV (${todayDaily.uvIndexMax.toFixed(0)}). Safe for outdoor activities.`
                            }
                        />
                        <AdvisoryCard
                            icon={<Leaf className="h-5 w-5 text-green-600" />}
                            title="Soil Conditions"
                            severity={(() => {
                                const soilHrs = allHourly.filter(h => h.time.startsWith(todayDaily.date) && (h.time.includes('T06:') || h.time.includes('T12:') || h.time.includes('T18:')))
                                const avg = soilHrs.length > 0 ? soilHrs.reduce((s, h) => s + h.soilMoisture, 0) / soilHrs.length : 0
                                return avg > 0.4 ? 'wet' : avg < 0.15 ? 'dry' : 'good'
                            })()}
                            content={(() => {
                                const soilHrs = allHourly.filter(h => h.time.startsWith(todayDaily.date) && (h.time.includes('T06:') || h.time.includes('T12:') || h.time.includes('T18:')))
                                const avgM = soilHrs.length > 0 ? soilHrs.reduce((s, h) => s + h.soilMoisture, 0) / soilHrs.length : 0
                                const avgT = soilHrs.length > 0 ? soilHrs.reduce((s, h) => s + h.soilTemperature, 0) / soilHrs.length : 0
                                return `Soil ~${avgT.toFixed(1)}°C, moisture ~${(avgM * 100).toFixed(0)}%. ${avgM > 0.4 ? 'Saturated — avoid heavy machinery.' : avgM < 0.15 ? 'Dry — mulching recommended.' : 'Good for field operations.'}`
                            })()}
                        />
                        <AdvisoryCard
                            icon={<Sun className="h-5 w-5 text-orange-500" />}
                            title="Harvest & Drying"
                            severity={todayDaily.precipitationProbabilityMax < 30 && todayDaily.windSpeedMax > 5 ? 'good' : 'caution'}
                            content={
                                todayDaily.precipitationProbabilityMax < 30
                                    ? `Low rain chance (${todayDaily.precipitationProbabilityMax}%). ${(todayDaily.daylightDuration / 3600).toFixed(1)}h daylight — good for drying.`
                                    : `Rain likely (${todayDaily.precipitationProbabilityMax}%). Postpone or arrange covered drying.`
                            }
                        />
                        <AdvisoryCard
                            icon={<Thermometer className="h-5 w-5 text-cyan-500" />}
                            title="Frost & Cold Stress"
                            severity={todayDaily.tempMin < 5 ? 'danger' : todayDaily.tempMin < 12 ? 'caution' : 'safe'}
                            content={
                                todayDaily.tempMin < 5
                                    ? `Min ${Math.round(todayDaily.tempMin)}°C — frost risk! Cover nurseries. Avoid early irrigation.`
                                    : todayDaily.tempMin < 12
                                        ? `Cool night (${Math.round(todayDaily.tempMin)}°C). Monitor cold-sensitive crops.`
                                        : `Night ${Math.round(todayDaily.tempMin)}°C — no frost risk.`
                            }
                        />
                    </div>
                </div>
            )}

            {/* ═══════ CALENDAR ═══════ */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between">
                        <span className="text-lg">16-Day Forecast Calendar</span>
                        <Badge variant="secondary" className="font-normal text-xs">
                            <Eye className="h-3 w-3 mr-1" /> Open-Meteo
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ForecastCalendar
                        daily={daily}
                        selectedIdx={selectedDateIdx}
                        onSelect={setSelectedDateIdx}
                    />
                </CardContent>
            </Card>

            {/* ═══════ SELECTED DAY DETAIL ═══════ */}
            {selectedDay && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">
                            {getDayLabel(selectedDay.date, selectedDateIdx)} — {new Date(selectedDay.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <DayStatBox icon={<Thermometer className="h-3 w-3" />} label="Temperature" value={`${Math.round(selectedDay.tempMax)}° / ${Math.round(selectedDay.tempMin)}°`} sub={`Feels ${Math.round(selectedDay.feelsLikeMax)}° / ${Math.round(selectedDay.feelsLikeMin)}°`} />
                            <DayStatBox icon={<CloudRain className="h-3 w-3" />} label="Rainfall" value={`${selectedDay.rainfall.toFixed(1)} mm`} sub={`${selectedDay.precipitationProbabilityMax}% chance · ${selectedDay.precipitationHours.toFixed(0)}h`} />
                            <DayStatBox icon={<Wind className="h-3 w-3" />} label="Wind" value={`${Math.round(selectedDay.windSpeedMax)} km/h`} sub={`Gusts ${Math.round(selectedDay.windGustsMax)} km/h · ${degreesToCompass(selectedDay.windDirectionDominant)}`} />
                            <DayStatBox icon={<Sun className="h-3 w-3" />} label="UV Index" value={selectedDay.uvIndexMax.toFixed(1)} sub={selectedDay.uvIndexMax > 8 ? 'Very High' : selectedDay.uvIndexMax > 5 ? 'High' : selectedDay.uvIndexMax > 2 ? 'Moderate' : 'Low'} />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="flex items-center gap-2 p-2"><Sunrise className="h-4 w-4 text-amber-500" /><div><p className="text-xs text-muted-foreground">Sunrise</p><p className="font-medium text-sm">{fmtSunTime(selectedDay.sunrise)}</p></div></div>
                            <div className="flex items-center gap-2 p-2"><Sunset className="h-4 w-4 text-orange-500" /><div><p className="text-xs text-muted-foreground">Sunset</p><p className="font-medium text-sm">{fmtSunTime(selectedDay.sunset)}</p></div></div>
                            <div className="flex items-center gap-2 p-2"><Clock className="h-4 w-4 text-blue-500" /><div><p className="text-xs text-muted-foreground">Daylight</p><p className="font-medium text-sm">{(selectedDay.daylightDuration / 3600).toFixed(1)} hrs</p></div></div>
                            <div className="flex items-center gap-2 p-2"><Leaf className="h-4 w-4 text-green-500" /><div><p className="text-xs text-muted-foreground">ET₀</p><p className="font-medium text-sm">{selectedDay.et0Evapotranspiration.toFixed(1)} mm</p></div></div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ═══════ HOURLY BREAKDOWN ═══════ */}
            {hourlyForSelectedDay.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Hourly Breakdown — {getDayLabel(selectedDay!.date, selectedDateIdx)}</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[800px]">
                            <thead>
                                <tr className="border-b text-muted-foreground text-xs">
                                    <th className="text-left py-2 px-2 font-medium">Time</th>
                                    <th className="text-left py-2 px-2 font-medium">Condition</th>
                                    <th className="text-right py-2 px-2 font-medium">Temp</th>
                                    <th className="text-right py-2 px-2 font-medium">Feels</th>
                                    <th className="text-right py-2 px-2 font-medium">Humidity</th>
                                    <th className="text-right py-2 px-2 font-medium">Rain</th>
                                    <th className="text-right py-2 px-2 font-medium">Rain %</th>
                                    <th className="text-right py-2 px-2 font-medium">Wind</th>
                                    <th className="text-right py-2 px-2 font-medium">UV</th>
                                    <th className="text-right py-2 px-2 font-medium">Soil °C</th>
                                    <th className="text-right py-2 px-2 font-medium">Soil Moist</th>
                                </tr>
                            </thead>
                            <tbody>
                                {hourlyForSelectedDay.map((h, i) => {
                                    const isNow = selectedDateIdx === 0 && new Date(h.time).getHours() === new Date().getHours()
                                    return (
                                        <tr key={h.time} className={`border-b last:border-0 transition-colors ${isNow ? 'bg-primary/10 font-medium' : i % 2 === 0 ? 'bg-muted/30' : ''}`}>
                                            <td className="py-2 px-2 whitespace-nowrap">
                                                {isNow && <span className="inline-block w-2 h-2 rounded-full bg-primary mr-1" />}
                                                {fmtTime(h.time)}
                                            </td>
                                            <td className="py-2 px-2 whitespace-nowrap">{h.conditionIcon} {h.condition}</td>
                                            <td className="py-2 px-2 text-right">{Math.round(h.temperature)}°C</td>
                                            <td className="py-2 px-2 text-right">{Math.round(h.feelsLike)}°C</td>
                                            <td className="py-2 px-2 text-right">{Math.round(h.humidity)}%</td>
                                            <td className="py-2 px-2 text-right">{h.precipitation > 0 ? `${h.precipitation.toFixed(1)}mm` : '—'}</td>
                                            <td className="py-2 px-2 text-right">{h.precipitationProbability}%</td>
                                            <td className="py-2 px-2 text-right whitespace-nowrap">{Math.round(h.windSpeed)} {degreesToCompass(h.windDirection)}</td>
                                            <td className="py-2 px-2 text-right">{h.uvIndex > 0 ? h.uvIndex.toFixed(1) : '—'}</td>
                                            <td className="py-2 px-2 text-right">{h.soilTemperature.toFixed(1)}°C</td>
                                            <td className="py-2 px-2 text-right">{(h.soilMoisture * 100).toFixed(0)}%</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}

            <p className="text-xs text-muted-foreground text-center pb-4">
                ℹ️ Forecast accuracy decreases beyond 7 days. Maximum reliable forecast is 16 days. Data from Open-Meteo.
            </p>
        </div>
    )
}

/* ═════════════════════════════════════════
   SUB-COMPONENTS
   ═════════════════════════════════════════ */

/** White stat item for the current weather card */
function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center gap-2">
            {icon}
            <div>
                <p className="text-xs text-blue-100">{label}</p>
                <p className="font-semibold text-sm">{value}</p>
            </div>
        </div>
    )
}

/** Stat box for the selected-day detail panel */
function DayStatBox({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
    return (
        <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">{icon} {label}</div>
            <p className="font-bold text-lg">{value}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
    )
}

/* ═════════════════════════════════════════
   FORECAST CALENDAR
   ═════════════════════════════════════════ */

function ForecastCalendar({ daily, selectedIdx, onSelect }: {
    daily: DailyData[]
    selectedIdx: number
    onSelect: (idx: number) => void
}) {
    if (daily.length === 0) return null

    // Group forecast days into calendar weeks
    const firstDate = new Date(daily[0].date + 'T00:00:00')
    const startDow = firstDate.getDay() // 0=Sun

    // Build a lookup: YYYY-MM-DD -> index in daily[]
    const dateToIdx: Record<string, number> = {}
    daily.forEach((d, i) => { dateToIdx[d.date] = i })

    // Build calendar grid rows
    const calendarWeeks: (DailyData | null)[][] = []
    let currentWeek: (DailyData | null)[] = []

    // Fill leading blanks
    for (let i = 0; i < startDow; i++) currentWeek.push(null)

    for (let i = 0; i < daily.length; i++) {
        currentWeek.push(daily[i])
        if (currentWeek.length === 7) {
            calendarWeeks.push(currentWeek)
            currentWeek = []
        }
    }
    // Fill trailing blanks
    if (currentWeek.length > 0) {
        while (currentWeek.length < 7) currentWeek.push(null)
        calendarWeeks.push(currentWeek)
    }

    // Month/year label
    const lastDate = new Date(daily[daily.length - 1].date + 'T00:00:00')
    const monthLabel = firstDate.getMonth() === lastDate.getMonth()
        ? firstDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : `${firstDate.toLocaleDateString('en-US', { month: 'short' })} – ${lastDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    // Color helper for temp
    const tempColor = (t: number) => {
        if (t > 40) return 'text-red-600'
        if (t > 35) return 'text-orange-500'
        if (t > 25) return 'text-amber-600'
        if (t > 15) return 'text-green-600'
        return 'text-blue-600'
    }

    return (
        <div>
            <p className="text-center font-semibold mb-3">{monthLabel}</p>
            <div className="grid grid-cols-7 gap-1">
                {/* Day-of-week headers */}
                {daysOfWeek.map(d => (
                    <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
                ))}

                {/* Calendar cells */}
                {calendarWeeks.flat().map((day, cellIdx) => {
                    if (!day) {
                        return <div key={`empty-${cellIdx}`} className="p-1" />
                    }

                    const idx = dateToIdx[day.date]
                    const isSelected = idx === selectedIdx
                    const isToday = idx === 0
                    const dt = new Date(day.date + 'T00:00:00')

                    return (
                        <button
                            key={day.date}
                            onClick={() => onSelect(idx)}
                            className={`relative flex flex-col items-center p-2 rounded-lg text-xs transition-all
                                ${isSelected
                                    ? 'bg-primary text-white shadow-lg ring-2 ring-primary/30 scale-[1.02]'
                                    : 'hover:bg-muted'
                                }
                                ${isToday && !isSelected ? 'ring-1 ring-primary/50' : ''}
                            `}
                        >
                            {/* Date number */}
                            <span className={`font-semibold text-sm ${isSelected ? 'text-white' : isToday ? 'text-primary' : ''}`}>
                                {dt.getDate()}
                            </span>
                            {/* Weather icon */}
                            <span className="text-base my-0.5">{day.conditionIcon}</span>
                            {/* Temp */}
                            <span className={`font-bold ${isSelected ? 'text-white' : tempColor(day.tempMax)}`}>
                                {Math.round(day.tempMax)}°
                            </span>
                            <span className={`${isSelected ? 'text-white/70' : 'text-muted-foreground'}`}>
                                {Math.round(day.tempMin)}°
                            </span>
                            {/* Rain indicator */}
                            {day.rainfall > 0 && (
                                <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-blue-500'}`}>
                                    {day.rainfall.toFixed(1)}mm
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

/* ═════════════════════════════════════════
   ADVISORY CARD
   ═════════════════════════════════════════ */

const severityBadges: Record<string, { label: string; className: string }> = {
    skip: { label: 'Skip', className: 'bg-blue-100 text-blue-800' },
    increase: { label: 'Increase', className: 'bg-amber-100 text-amber-800' },
    normal: { label: 'Normal', className: 'bg-green-100 text-green-800' },
    avoid: { label: 'Avoid', className: 'bg-red-100 text-red-800' },
    good: { label: 'Favorable', className: 'bg-green-100 text-green-800' },
    danger: { label: 'Danger', className: 'bg-red-100 text-red-800' },
    caution: { label: 'Caution', className: 'bg-amber-100 text-amber-800' },
    safe: { label: 'Safe', className: 'bg-green-100 text-green-800' },
    wet: { label: 'Wet', className: 'bg-blue-100 text-blue-800' },
    dry: { label: 'Dry', className: 'bg-amber-100 text-amber-800' },
}

function AdvisoryCard({ icon, title, severity, content }: {
    icon: React.ReactNode; title: string; severity: string; content: string
}) {
    const badge = severityBadges[severity] ?? severityBadges.normal
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    {icon} {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Badge className={`${badge.className} mb-2`}>{badge.label}</Badge>
                <p className="text-sm text-muted-foreground">{content}</p>
            </CardContent>
        </Card>
    )
}
