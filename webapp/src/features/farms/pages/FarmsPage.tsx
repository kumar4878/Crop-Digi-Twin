import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, MapPin, Wheat, ChevronDown, ChevronUp, ChevronRight, Loader2, X, Leaf } from 'lucide-react'
import { getFarms, getFarmById, createFarm, createField } from '@/features/farms/api/farms'
import type { FarmListItem, FarmDetail } from '@/features/farms/api/farms'
import { EventTimeline } from '@/components/features/events/EventTimeline'
import { GDDProgress } from '@/components/features/gdd/GDDProgress'

import { MapContainer, TileLayer, Polygon as LeafletPolygon, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

export function FarmsPage() {
    const [farms, setFarms] = useState<FarmListItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showAddDialog, setShowAddDialog] = useState(false)

    async function fetchFarms() {
        try {
            setLoading(true)
            const response = await getFarms()
            setFarms(response.farms)
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to load farms')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchFarms() }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading farms...</span>
            </div>
        )
    }

    const totalFields = farms.reduce((acc, farm) => acc + (farm.activeFields || 0), 0)
    const totalArea = farms.reduce((acc, farm) => acc + (farm.totalArea || 0), 0)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">My Farms</h1>
                    <p className="text-muted-foreground">Manage your farms and fields</p>
                </div>
                <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Farm
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                <MapPin className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{farms.length}</p>
                                <p className="text-sm text-muted-foreground">Total Farms</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                <MapPin className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{totalFields}</p>
                                <p className="text-sm text-muted-foreground">Active Fields</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                                <Wheat className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{totalArea.toFixed(1)}</p>
                                <p className="text-sm text-muted-foreground">Total Acres</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Farm Cards */}
            <div className="grid grid-cols-1 gap-4">
                {farms.map((farm) => (
                    <ExpandableFarmCard key={farm.id} farm={farm} />
                ))}

                {/* Add Farm Card */}
                <Card
                    className="border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
                    onClick={() => setShowAddDialog(true)}
                >
                    <CardContent className="flex flex-col items-center justify-center h-full min-h-[280px] text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                            <Plus className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="font-medium">Add New Farm</p>
                        <p className="text-sm text-muted-foreground mt-1">Click to add a new farm</p>
                    </CardContent>
                </Card>
            </div>

            {farms.length === 0 && !error && (
                <div className="text-center py-12">
                    <MapPin className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No farms yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first farm to start managing your fields and crops</p>
                    <Button onClick={() => setShowAddDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" /> Create Your First Farm
                    </Button>
                </div>
            )}

            {/* Add Farm Dialog */}
            {showAddDialog && (
                <AddFarmDialog
                    onClose={() => setShowAddDialog(false)}
                    onCreated={() => { setShowAddDialog(false); fetchFarms() }}
                />
            )}
        </div>
    )
}

/* ═══════ EXPANDABLE FARM CARD ═══════ */
function ExpandableFarmCard({ farm }: { farm: FarmListItem }) {
    const [expanded, setExpanded] = useState(false)
    const [detail, setDetail] = useState<FarmDetail | null>(null)
    const [loading, setLoading] = useState(false)

    const handleToggle = async () => {
        if (!expanded && !detail) {
            setLoading(true)
            try {
                const res = await getFarmById(farm.id)
                setDetail(res)
            } finally {
                setLoading(false)
            }
        }
        setExpanded(!expanded)
    }

    return (
        <Card className="overflow-hidden transition-all duration-300">
            {/* Summary Header (Always Visible) */}
            <div 
                className="p-6 cursor-pointer hover:bg-muted/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                onClick={handleToggle}
            >
                <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                        {farm.name}
                        <Badge variant="success" className="ml-2">{farm.status}</Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {farm.district ? `${farm.district}, ${farm.state}` : farm.state || 'Location not set'}
                    </p>
                </div>
                
                <div className="flex items-center gap-8 border-l pl-8">
                    <div>
                        <p className="text-sm text-muted-foreground">Fields</p>
                        <p className="text-lg font-bold">{farm.activeFields}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Area</p>
                        <p className="text-lg font-bold">{farm.totalArea} acres</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Overall Health</p>
                        <div className="flex items-center gap-2">
                            <div className="w-24 bg-muted rounded-full h-2">
                                <div className="bg-primary rounded-full h-2" style={{ width: `${Math.min(100, farm.healthScore)}%` }} />
                            </div>
                            <p className="text-sm font-bold">{farm.healthScore > 0 ? `${farm.healthScore}%` : 'N/A'}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 ml-2">
                        {expanded ? <ChevronUp className="h-5 w-5 text-primary" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                    </Button>
                </div>
            </div>

            {/* Expanded Detailed Content */}
            {expanded && (
                <div className="border-t bg-muted/10 p-6 animate-in slide-in-from-top-2 duration-300">
                    {loading ? (
                        <div className="flex items-center justify-center py-8 text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin mr-2 text-primary" /> Loading fields...
                        </div>
                    ) : detail ? (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-primary" /> Fields & Crop Status
                                </h3>
                                <div className="flex gap-2">
                                    <Link to={`/farms/${farm.id}`}>
                                        <Button variant="outline" size="sm">View Full Farm Details</Button>
                                    </Link>
                                    <Button size="sm">
                                        <Plus className="h-4 w-4 mr-2" /> Add Field (Pending API)
                                    </Button>
                                </div>
                            </div>
                            
                            {detail.fields.length === 0 ? (
                                <div className="text-center py-6 bg-background rounded-lg border border-dashed border-border text-muted-foreground text-sm">
                                    No fields added to this farm yet.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {detail.fields.map((field) => (
                                        <Card key={field._id} className="bg-background shadow-sm border-primary/10 hover:border-primary/30 transition-colors">
                                            <CardContent className="p-4 space-y-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h4 className="font-semibold flex items-center gap-2">
                                                            {field.name}
                                                            {field.villageCode && (
                                                                <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200">
                                                                    <MapPin className="h-3 w-3 mr-1 inline" /> Geo-Verified ({field.villageMatchConfidence}%)
                                                                </Badge>
                                                            )}
                                                        </h4>
                                                        <p className="text-xs text-muted-foreground">{field.area} Acres • {field.status}</p>
                                                    </div>
                                                    {field.healthMetrics ? (
                                                        <Badge variant={field.healthMetrics.stressLevel === 'CRITICAL' ? 'destructive' : 'success'} className="shadow-sm">
                                                            {field.healthMetrics.stressLevel}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary">NO DATA</Badge>
                                                    )}
                                                </div>

                                                <div className="bg-muted/40 p-3 rounded-lg flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                        <Leaf className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div className="w-full">
                                                        <p className="text-sm font-medium">{field.currentCrop?.cropName || 'Fallow / No Crop Assigned'}</p>
                                                        <p className="text-xs text-muted-foreground">{field.currentCrop?.currentStage || 'No active digital twin tracking'}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="mt-4 space-y-4">
                                                    {field.currentCrop ? (
                                                        <GDDProgress fieldId={field._id} />
                                                    ) : (
                                                        <div className="text-[10px] text-muted-foreground italic px-1">
                                                            GDD Engine ready (Waiting for crop assignment)
                                                        </div>
                                                    )}
                                                    
                                                    <div className="pt-2 border-t">
                                                        <details className="text-xs group">
                                                            <summary className="cursor-pointer font-medium text-primary hover:text-primary/80 mb-2 list-none flex items-center gap-1">
                                                                <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                                                                View Immutable Digital Twin Ledger
                                                            </summary>
                                                            <div className="mt-2 border rounded-md p-2 bg-slate-50">
                                                                <EventTimeline plotId={field._id} season={field.currentCrop?.season || 'KHARIF-2024'} />
                                                            </div>
                                                        </details>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 pt-2 border-t border-border/50">
                                                    <Button variant="outline" size="sm" className="w-full text-xs h-8">Reports</Button>
                                                    <Button variant="outline" size="sm" className="w-full text-xs h-8">Tasks</Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-6 text-center text-destructive">Failed to load farm details.</div>
                    )}
                </div>
            )}
        </Card>
    )
}

/* ═══════ ADD FARM WIZARD (Farm + First Field + Map) ═══════ */
function PolygonDrawer({ positions, setPositions }: { positions: [number, number][]; setPositions: (p: [number, number][]) => void }) {
    useMapEvents({
        click(e) {
            setPositions([...positions, [e.latlng.lat, e.latlng.lng]])
        },
    })
    return positions.length >= 3 ? <LeafletPolygon positions={positions} pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.2, weight: 2 }} /> : null
}

function AddFarmDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const [step, setStep] = useState(1)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    // Step 1: Farm Details
    const [farmForm, setFarmForm] = useState({
        name: '',
        village: '',
        district: '',
        state: '',
        pincode: '',
        totalArea: '',
        ownershipType: 'OWNED',
    })

    // Step 2: First Field Details & Boundary
    const [positions, setPositions] = useState<[number, number][]>([])
    const [fieldForm, setFieldForm] = useState({
        name: 'Block A',
        soilType: 'LOAM',
        irrigationType: 'DRIP',
    })

    const updateFarm = (field: string, value: string) => setFarmForm(prev => ({ ...prev, [field]: value }))
    const updateField = (field: string, value: string) => setFieldForm(prev => ({ ...prev, [field]: value }))

    const handleNext = () => {
        setError('')
        if (!farmForm.name.trim()) { setError('Farm name is required'); return }
        if (!farmForm.village.trim()) { setError('Village is required'); return }
        if (!farmForm.district.trim()) { setError('District is required'); return }
        if (!farmForm.state.trim()) { setError('State is required'); return }
        if (!farmForm.totalArea || parseFloat(farmForm.totalArea) <= 0) { setError('Enter a valid area'); return }
        setStep(2)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!fieldForm.name.trim()) { setError('Field name is required'); return }
        if (positions.length < 3) { setError('Draw at least 3 points on the map to define the field boundary'); return }

        const coords = positions.map(p => [p[1], p[0]])
        coords.push(coords[0])

        setSaving(true)
        try {
            // 1. Create Farm
            const farmRes = await createFarm({
                name: farmForm.name.trim(),
                address: {
                    line1: farmForm.village,
                    village: farmForm.village.trim(),
                    district: farmForm.district.trim(),
                    state: farmForm.state.trim(),
                    pincode: farmForm.pincode.trim() || '000000',
                    country: 'IN',
                },
                totalArea: parseFloat(farmForm.totalArea),
                ownershipType: farmForm.ownershipType as 'OWNED' | 'LEASED' | 'SHARED',
            })

            const farmId = farmRes.farm?._id || farmRes._id || (farmRes as any).id

            // 2. Create Field
            await createField({
                farmId,
                name: fieldForm.name.trim(),
                soilType: fieldForm.soilType,
                irrigationType: fieldForm.irrigationType,
                boundary: {
                    type: 'Polygon',
                    coordinates: [coords]
                }
            })

            onCreated()
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to create farm and field')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-2xl shadow-2xl border-primary/20 overflow-hidden bg-background/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b flex items-start justify-between">
                    <div>
                        <CardTitle className="text-2xl font-bold">
                            {step === 1 ? 'Step 1: New Farm Details' : 'Step 2: Draw Your First Field'}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            {step === 1 ? 'Enter your farm details to get started' : 'Define your first subdivision tracking boundary'}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-black/5 dark:hover:bg-white/10" onClick={onClose}><X className="h-5 w-5" /></Button>
                </div>
                <CardContent className="p-6">
                    {error && (
                        <div className="mb-6 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
                            <span className="font-semibold text-lg leading-none">!</span>
                            <p>{error}</p>
                        </div>
                    )}

                    {step === 1 ? (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="farm-name" className="text-foreground/80 font-medium">Farm Name <span className="text-destructive">*</span></Label>
                                <Input id="farm-name" className="h-11 bg-background/50 focus-visible:ring-primary/30 transition-all" placeholder="e.g. Green Valley Farm" value={farmForm.name} onChange={e => updateFarm('name', e.target.value)} />
                            </div>

                            <div className="bg-muted/30 rounded-xl p-4 border border-border/50 space-y-4">
                                <p className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-primary" /> Location Details
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="village" className="text-xs text-muted-foreground uppercase tracking-wider">Village / Tehsil <span className="text-destructive">*</span></Label>
                                        <Input id="village" className="h-11 bg-background/50" placeholder="Village name" value={farmForm.village} onChange={e => updateFarm('village', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="district" className="text-xs text-muted-foreground uppercase tracking-wider">District <span className="text-destructive">*</span></Label>
                                        <Input id="district" className="h-11 bg-background/50" placeholder="District name" value={farmForm.district} onChange={e => updateFarm('district', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="state" className="text-xs text-muted-foreground uppercase tracking-wider">State <span className="text-destructive">*</span></Label>
                                        <Input id="state" className="h-11 bg-background/50" placeholder="State name" value={farmForm.state} onChange={e => updateFarm('state', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="total-area" className="text-xs text-muted-foreground uppercase tracking-wider">Total Area (Acres) <span className="text-destructive">*</span></Label>
                                        <Input id="total-area" type="number" step="0.1" className="h-11 bg-background/50" placeholder="e.g. 10.5" value={farmForm.totalArea} onChange={e => updateFarm('totalArea', e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                                <Button type="button" variant="outline" className="px-6 rounded-full" onClick={onClose}>Cancel</Button>
                                <Button type="button" className="px-6 rounded-full shadow-lg shadow-primary/25 transition-transform hover:scale-105" onClick={handleNext}>
                                    Next: Draw Field <ChevronRight className="h-4 w-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-foreground/80 font-medium flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-primary" /> Draw Field Boundary <span className="text-destructive">*</span>
                                </Label>
                                <p className="text-xs text-muted-foreground">Click on the map to place vertices for your first crop block. Minimum 3 points required.</p>
                                <div className="rounded-xl overflow-hidden border border-border/50 h-[250px] relative">
                                    <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }} className="z-0">
                                        <TileLayer attribution='&copy; OSM' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        <PolygonDrawer positions={positions} setPositions={setPositions} />
                                    </MapContainer>
                                    <div className="absolute top-2 right-2 z-[1000] bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border text-xs font-medium shadow-md">
                                        {positions.length} point{positions.length !== 1 ? 's' : ''} placed
                                    </div>
                                </div>
                                {positions.length > 0 && (
                                    <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setPositions([])}>
                                        Clear Points
                                    </Button>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="field-name" className="text-foreground/80 font-medium">Field Name / Block Number <span className="text-destructive">*</span></Label>
                                    <Input id="field-name" className="h-11 bg-background/50" placeholder="e.g. Block A" value={fieldForm.name} onChange={e => updateField('name', e.target.value)} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="soil-type" className="text-foreground/80 font-medium">Soil</Label>
                                        <select id="soil-type" className="flex h-11 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30" value={fieldForm.soilType} onChange={e => updateField('soilType', e.target.value)}>
                                            <option value="CLAY">Clay</option>
                                            <option value="LOAM">Loam</option>
                                            <option value="SANDY">Sandy</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="irrigation" className="text-foreground/80 font-medium">Irrig.</Label>
                                        <select id="irrigation" className="flex h-11 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30" value={fieldForm.irrigationType} onChange={e => updateField('irrigationType', e.target.value)}>
                                            <option value="DRIP">Drip System</option>
                                            <option value="SPRINKLER">Sprinkler</option>
                                            <option value="FLOOD">Flood / Canal</option>
                                            <option value="RAINFED">Rainfed (Dry)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-border/50">
                                <Button type="button" variant="ghost" className="px-6 rounded-full" onClick={() => setStep(1)}>Back</Button>
                                <div className="flex gap-3">
                                    <Button type="button" variant="outline" className="px-6 rounded-full" onClick={onClose}>Cancel</Button>
                                    <Button type="submit" className="px-6 rounded-full shadow-lg shadow-primary/25 transition-transform hover:scale-105" disabled={saving}>
                                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                        Create Farm & Field
                                    </Button>
                                </div>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
