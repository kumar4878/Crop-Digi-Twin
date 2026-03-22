import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Brain, Wheat, Droplets, CloudRain, ThermometerSun,
    Loader2, AlertTriangle, CheckCircle, Zap, TrendingUp, ArrowRight,
} from 'lucide-react'
import { getActiveCropFields } from '@/features/dde/api/dde'
import { getFarms } from '@/features/farms/api/farms'
import { getOpenMeteoWeather } from '@/features/weather/api/weather'

const CROP_STAGES = ['SOWING', 'GERMINATION', 'VEGETATIVE', 'FLOWERING', 'FRUITING', 'MATURATION', 'HARVEST']

interface ActiveCrop {
    fieldId: string
    fieldName: string
    cropName: string
    currentStage: string
    sowingDate: string
    expectedHarvestDate: string
    healthScore: number
    farmName?: string
}

export function DDEPage() {
    const [crops, setCrops] = useState<ActiveCrop[]>([])
    const [loading, setLoading] = useState(true)
    const [weather, setWeather] = useState<any>(null)
    const [selectedCrop, setSelectedCrop] = useState<ActiveCrop | null>(null)

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true)
                const [cropsData, farmsData, weatherData] = await Promise.all([
                    getActiveCropFields().catch(() => []),
                    getFarms().catch(() => ({ farms: [] })),
                    getOpenMeteoWeather(17.385, 78.4867).catch(() => null),
                ])

                const farmMap: Record<string, string> = {}
                ;(farmsData.farms || []).forEach((f: any) => { farmMap[f._id || f.id] = f.name })

                const enriched = (cropsData || []).map((c: any) => ({
                    ...c,
                    farmName: farmMap[c.farmId] || 'Unknown Farm',
                }))

                setCrops(enriched)
                if (enriched.length > 0) setSelectedCrop(enriched[0])
                if (weatherData) setWeather(weatherData)
            } catch { /* silent */ } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const getStageIndex = (stage: string) => {
        const idx = CROP_STAGES.indexOf(stage)
        return idx >= 0 ? idx : 0
    }

    const getDaysSinceSowing = (sowingDate: string) => {
        const diff = Date.now() - new Date(sowingDate).getTime()
        return Math.floor(diff / (1000 * 60 * 60 * 24))
    }

    const getDaysToHarvest = (harvestDate: string) => {
        const diff = new Date(harvestDate).getTime() - Date.now()
        return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
    }

    const getIrrigationGateResult = () => {
        if (!weather) return { allowed: true, reason: 'Weather data unavailable' }
        const next48hrRain = weather.daily?.precipitation?.slice(0, 2)?.reduce((s: number, v: number) => s + v, 0) || 0
        if (next48hrRain > 5) {
            return { allowed: false, reason: `${next48hrRain.toFixed(1)}mm rainfall predicted in next 48hrs — irrigation NOT recommended` }
        }
        return { allowed: true, reason: `Only ${next48hrRain.toFixed(1)}mm predicted in 48hrs — irrigation allowed` }
    }

    const irrigationGate = getIrrigationGateResult()

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading Decision Engine...</span>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Brain className="h-7 w-7 text-primary" /> Digital Decision Engine
                </h1>
                <p className="text-muted-foreground">GDD-based crop progression • Irrigation gate • Stage advisories</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-emerald-100 text-sm">Active Crops</p>
                                <p className="text-3xl font-bold">{crops.length}</p>
                            </div>
                            <Wheat className="h-10 w-10 text-emerald-200" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm">Temperature</p>
                                <p className="text-3xl font-bold">{weather ? `${Math.round(weather.current?.temperature || 0)}°C` : '--'}</p>
                            </div>
                            <ThermometerSun className="h-10 w-10 text-blue-200" />
                        </div>
                    </CardContent>
                </Card>
                <Card className={`bg-gradient-to-br ${irrigationGate.allowed ? 'from-cyan-500 to-cyan-600' : 'from-amber-500 to-amber-600'} text-white border-0`}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/80 text-sm">Irrigation Gate</p>
                                <p className="text-xl font-bold">{irrigationGate.allowed ? '✅ OPEN' : '⛔ BLOCKED'}</p>
                            </div>
                            <Droplets className="h-10 w-10 text-white/50" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 text-sm">48hr Rainfall</p>
                                <p className="text-3xl font-bold">{weather ? `${(weather.daily?.precipitation?.slice(0, 2)?.reduce((s: number, v: number) => s + v, 0) || 0).toFixed(1)}mm` : '--'}</p>
                            </div>
                            <CloudRain className="h-10 w-10 text-purple-200" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left: Active Crops List */}
                <div className="space-y-4">
                    <h2 className="font-semibold text-lg">Active Crops</h2>
                    {crops.length > 0 ? crops.map(crop => (
                        <Card
                            key={crop.fieldId}
                            className={`cursor-pointer transition-all hover:shadow-md ${selectedCrop?.fieldId === crop.fieldId ? 'ring-2 ring-primary border-primary' : ''}`}
                            onClick={() => setSelectedCrop(crop)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Wheat className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{crop.cropName || 'Unknown'}</p>
                                            <p className="text-xs text-muted-foreground">{crop.fieldName} • {crop.farmName}</p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary">{(crop.currentStage || 'ACTIVE').replace('_', ' ')}</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    )) : (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <Wheat className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-muted-foreground">No active crops</p>
                            <p className="text-sm text-muted-foreground">Assign crops to fields to use the Decision Engine</p>
                        </div>
                    )}
                </div>

                {/* Right: Selected Crop Detail */}
                <div className="lg:col-span-2 space-y-6">
                    {selectedCrop ? (
                        <>
                            {/* Stage Timeline */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-primary" />
                                        Crop Stage Progression — {selectedCrop.cropName}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-2">
                                        {CROP_STAGES.map((stage, idx) => {
                                            const current = getStageIndex(selectedCrop.currentStage || 'SOWING')
                                            const isActive = idx === current
                                            const isCompleted = idx < current
                                            return (
                                                <div key={stage} className="flex items-center">
                                                    <div className={`flex flex-col items-center min-w-[80px]`}>
                                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                                                            isActive ? 'bg-primary text-white border-primary scale-110 shadow-lg shadow-primary/30' :
                                                            isCompleted ? 'bg-green-500 text-white border-green-500' :
                                                            'bg-muted border-border text-muted-foreground'
                                                        }`}>
                                                            {isCompleted ? <CheckCircle className="h-4 w-4" /> : idx + 1}
                                                        </div>
                                                        <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-muted-foreground'}`}>
                                                            {stage}
                                                        </span>
                                                    </div>
                                                    {idx < CROP_STAGES.length - 1 && (
                                                        <div className={`h-0.5 w-6 ${isCompleted ? 'bg-green-500' : 'bg-border'}`} />
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div className="bg-muted/50 p-3 rounded-lg">
                                            <p className="text-muted-foreground text-xs">Days Since Sowing</p>
                                            <p className="font-bold text-lg">{getDaysSinceSowing(selectedCrop.sowingDate)}</p>
                                        </div>
                                        <div className="bg-muted/50 p-3 rounded-lg">
                                            <p className="text-muted-foreground text-xs">Days to Harvest</p>
                                            <p className="font-bold text-lg">{getDaysToHarvest(selectedCrop.expectedHarvestDate)}</p>
                                        </div>
                                        <div className="bg-muted/50 p-3 rounded-lg">
                                            <p className="text-muted-foreground text-xs">Health Score</p>
                                            <p className="font-bold text-lg">{selectedCrop.healthScore || 0}%</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Irrigation Gate Widget */}
                            <Card className={irrigationGate.allowed ? 'border-cyan-500/30' : 'border-amber-500/30'}>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Droplets className={`h-5 w-5 ${irrigationGate.allowed ? 'text-cyan-500' : 'text-amber-500'}`} />
                                        48hr Irrigation Gate
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className={`p-4 rounded-lg flex items-start gap-3 ${irrigationGate.allowed ? 'bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800' : 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800'}`}>
                                        {irrigationGate.allowed
                                            ? <CheckCircle className="h-5 w-5 text-cyan-600 mt-0.5" />
                                            : <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                                        }
                                        <div>
                                            <p className={`font-semibold ${irrigationGate.allowed ? 'text-cyan-700 dark:text-cyan-300' : 'text-amber-700 dark:text-amber-300'}`}>
                                                {irrigationGate.allowed ? 'Irrigation Recommended' : 'Irrigation Not Recommended'}
                                            </p>
                                            <p className="text-sm text-muted-foreground mt-1">{irrigationGate.reason}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Stage Advisory Panel */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Zap className="h-5 w-5 text-amber-500" />
                                        Stage Advisory — {selectedCrop.currentStage || 'ACTIVE'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {getStageAdvisories(selectedCrop.currentStage || 'SOWING').map((adv, i) => (
                                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                                                <ArrowRight className="h-3 w-3 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{adv.title}</p>
                                                <p className="text-xs text-muted-foreground">{adv.description}</p>
                                            </div>
                                            <Badge variant="outline" className="ml-auto shrink-0 text-[10px]">{adv.priority}</Badge>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <div className="text-center py-16 border-2 border-dashed rounded-lg">
                            <Brain className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Select a Crop</h3>
                            <p className="text-muted-foreground">Choose an active crop from the list to view stage progression and advisories</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

/** Stage-specific advisory data */
function getStageAdvisories(stage: string) {
    const advisories: Record<string, Array<{ title: string; description: string; priority: string }>> = {
        SOWING: [
            { title: 'Soil Preparation', description: 'Ensure proper land preparation with 2-3 ploughings. Add FYM @ 10 tonnes/ha.', priority: 'HIGH' },
            { title: 'Seed Treatment', description: 'Treat seeds with fungicide (Carbendazim 2g/kg) before sowing.', priority: 'HIGH' },
            { title: 'Spacing & Depth', description: 'Maintain recommended row spacing. Optimal sowing depth: 3-5 cm.', priority: 'MEDIUM' },
        ],
        GERMINATION: [
            { title: 'Moisture Management', description: 'Maintain adequate soil moisture for uniform germination. Light irrigation if needed.', priority: 'HIGH' },
            { title: 'Gap Filling', description: 'Fill gaps within 7-10 days of germination to maintain plant population.', priority: 'MEDIUM' },
        ],
        VEGETATIVE: [
            { title: 'Nitrogen Top Dressing', description: 'Apply urea @ 30-40 kg/ha as top dressing 25-30 days after sowing.', priority: 'HIGH' },
            { title: 'Weed Management', description: 'Hand weeding or herbicide application. Critical period: 20-45 DAS.', priority: 'HIGH' },
            { title: 'Pest Scouting', description: 'Regular field scouting for early pest detection. Check ETL thresholds.', priority: 'MEDIUM' },
        ],
        FLOWERING: [
            { title: 'Irrigation Critical', description: 'Flowering is a moisture-sensitive stage. Ensure adequate water supply.', priority: 'HIGH' },
            { title: 'Micronutrient Spray', description: 'Foliar spray of ZnSO₄ (0.5%) + FeSO₄ (1%) for improved fruit set.', priority: 'MEDIUM' },
            { title: 'Pollination Support', description: 'Avoid insecticide spray during peak flowering to protect pollinators.', priority: 'HIGH' },
        ],
        FRUITING: [
            { title: 'Potassium Application', description: 'Apply MOP @ 20-30 kg/ha for improved grain/fruit filling.', priority: 'HIGH' },
            { title: 'Disease Watch', description: 'Monitor for fungal diseases. Preventive spray if humidity > 80%.', priority: 'MEDIUM' },
        ],
        MATURATION: [
            { title: 'Reduce Irrigation', description: 'Withhold irrigation 15-20 days before harvest for proper maturity.', priority: 'HIGH' },
            { title: 'Harvest Planning', description: 'Arrange labor, machinery, and post-harvest storage facilities.', priority: 'MEDIUM' },
        ],
        HARVEST: [
            { title: 'Optimal Moisture', description: 'Harvest at recommended grain moisture (14-16%) to minimize losses.', priority: 'HIGH' },
            { title: 'Post-Harvest', description: 'Sun-dry produce to safe moisture levels. Store in clean, dry warehouses.', priority: 'MEDIUM' },
        ],
    }
    return advisories[stage] || advisories['SOWING']
}
