import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Wheat, Calendar, ChevronRight, Loader2, Sprout } from 'lucide-react'
import { getActiveCrops } from '@/features/crops/api/crops'

interface ActiveCrop {
    fieldId: string
    fieldName: string
    farmName: string
    crop: {
        cropId?: string
        cropName?: string
        season?: string
        sowingDate?: string
        expectedHarvestDate?: string
        status?: string
    }
    currentStage?: string
    healthScore?: number
}

export function CropsPage() {
    const [crops, setCrops] = useState<ActiveCrop[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchCrops() {
            try {
                setLoading(true)
                const data = await getActiveCrops()
                setCrops(Array.isArray(data) ? data : [])
            } catch (err: any) {
                // If no data or unauthorized, show empty state
                setCrops([])
            } finally {
                setLoading(false)
            }
        }
        fetchCrops()
    }, [])

    const getStageColor = (stage: string) => {
        const colors: Record<string, string> = {
            SOWING: 'bg-amber-500', GERMINATION: 'bg-lime-500', VEGETATIVE: 'bg-green-500',
            FLOWERING: 'bg-pink-500', FRUITING: 'bg-orange-500', MATURATION: 'bg-yellow-500', HARVEST: 'bg-emerald-600',
        }
        return colors[stage] || 'bg-gray-500'
    }

    const getStageProgress = (stage?: string) => {
        const stages = ['SOWING', 'GERMINATION', 'VEGETATIVE', 'FLOWERING', 'FRUITING', 'MATURATION', 'HARVEST']
        const idx = stages.indexOf(stage || '')
        return idx >= 0 ? Math.round(((idx + 1) / stages.length) * 100) : 0
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading crops...</span>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">My Crops</h1>
                    <p className="text-muted-foreground">Track your active crops and their growth stages</p>
                </div>
                {crops.length > 0 && (
                    <Badge variant="secondary" className="text-sm">
                        {crops.length} active crop{crops.length !== 1 ? 's' : ''}
                    </Badge>
                )}
            </div>

            {/* Summary cards */}
            {crops.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                    <Sprout className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{crops.length}</p>
                                    <p className="text-xs text-muted-foreground">Active Crops</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                                    <Wheat className="h-5 w-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">
                                        {new Set(crops.map(c => c.crop?.cropName).filter(Boolean)).size}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Crop Varieties</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                    <Calendar className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">
                                        {crops.filter(c => c.currentStage === 'HARVEST' || c.currentStage === 'MATURATION').length}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Near Harvest</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Crop list */}
            <div className="grid gap-4">
                {crops.map((crop) => {
                    const progress = getStageProgress(crop.currentStage)
                    return (
                        <Card key={crop.fieldId} className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                            <Wheat className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{crop.crop?.cropName || 'Unknown Crop'}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {crop.fieldName} • {crop.farmName}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        {crop.crop?.sowingDate && (
                                            <div className="hidden md:block text-center">
                                                <p className="text-xs text-muted-foreground">Sowing</p>
                                                <p className="text-sm font-medium">
                                                    {new Date(crop.crop.sowingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex flex-col items-center min-w-[120px]">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className={`h-2 w-2 rounded-full ${getStageColor(crop.currentStage || '')}`} />
                                                <span className="text-sm font-medium">{crop.currentStage || 'N/A'}</span>
                                            </div>
                                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">{progress}% complete</p>
                                        </div>

                                        {crop.crop?.expectedHarvestDate && (
                                            <div className="hidden md:flex items-center gap-2 text-sm">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <span>{new Date(crop.crop.expectedHarvestDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                            </div>
                                        )}

                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Empty state */}
            {crops.length === 0 && (
                <div className="text-center py-16">
                    <Wheat className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No active crops</h3>
                    <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                        Assign crops to your fields to start tracking growth stages, get advisories, and monitor health.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Go to <strong>Farms → Field → Assign Crop</strong> to get started.
                    </p>
                </div>
            )}
        </div>
    )
}
