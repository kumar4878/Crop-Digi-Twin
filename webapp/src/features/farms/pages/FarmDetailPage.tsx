import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    ArrowLeft, MapPin, Wheat, Plus, MoreVertical, Droplets, ThermometerSun, Loader2, X, Trash2, Edit2
} from 'lucide-react'
import { getFarmById, createField, deleteField, assignCropToField } from '@/features/farms/api/farms'
import { EventTimeline } from '@/components/features/events/EventTimeline'
import { GDDProgress } from '@/components/features/gdd/GDDProgress'

export function FarmDetailPage() {
    const { farmId } = useParams()
    const [farm, setFarm] = useState<any>(null)
    const [fields, setFields] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [assignCropFieldId, setAssignCropFieldId] = useState<string | null>(null)
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

    const fetchFarm = async () => {
        if (!farmId) return
        try {
            setLoading(true)
            const data = await getFarmById(farmId)
            setFarm(data)
            setFields(data.fields || [])
        } catch {
            setFarm({ _id: farmId, name: 'Farm', address: {}, totalArea: 0, ownershipType: 'OWNED', status: 'ACTIVE' })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchFarm()
    }, [farmId])

    const handleDeleteField = async (id: string) => {
        if (!confirm('Are you sure you want to delete this field?')) return
        try {
            await deleteField(id)
            fetchFarm()
        } catch (error) {
            console.error('Failed to delete field:', error)
            alert('Failed to delete field')
        }
    }

    const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
    const fieldBeingEdited = fields.find(f => f._id === editingFieldId)

    const getStressColor = (level: string) => {
        switch (level) {
            case 'LOW': return 'default'
            case 'MEDIUM': return 'secondary'
            case 'HIGH': return 'destructive'
            default: return 'secondary'
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading farm...</span>
            </div>
        )
    }

    if (!farm) {
        return (
            <div className="text-center py-16">
                <p className="text-muted-foreground">Farm not found</p>
                <Link to="/farms"><Button variant="outline" className="mt-4">Back to Farms</Button></Link>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/farms">
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">{farm.name}</h1>
                        <p className="text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {farm.address?.village && `${farm.address.village}, `}
                            {farm.address?.district && `${farm.address.district}, `}
                            {farm.address?.state || 'Location not set'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Edit Farm</Button>
                    <Button onClick={() => setShowAddDialog(true)}><Plus className="h-4 w-4 mr-2" />Add Field</Button>
                </div>
            </div>

            {/* Farm Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Total Area</p>
                        <p className="text-2xl font-bold">{farm.totalArea} acres</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Fields</p>
                        <p className="text-2xl font-bold">{fields.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Land Type</p>
                        <p className="text-2xl font-bold capitalize">{(farm.landType || farm.ownershipType || '').toLowerCase()}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge variant="default" className="text-lg mt-1">{farm.status}</Badge>
                    </CardContent>
                </Card>
            </div>

            {/* Fields List */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Fields</h2>
                </div>

                {fields.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                        {fields.map((field: any) => (
                            <Card key={field._id} className="hover:shadow-md transition-shadow relative">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-base">{field.name}</CardTitle>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                {field.area} acres • {(field.soilType || '').replace(/_/g, ' ')}
                                            </p>
                                            
                                            {field.villageCode ? (
                                                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                                                    <MapPin className="h-3 w-3 mr-1 inline" />
                                                    Geo-Verified: {field.villageName} ({field.villageMatchConfidence}%)
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[10px] text-amber-600 bg-amber-50">
                                                    Pending Geo-Verification
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 relative">
                                            <Badge variant={field.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                                {field.status}
                                            </Badge>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8"
                                                onClick={() => setActiveMenuId(activeMenuId === field._id ? null : field._id)}
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>

                                            {activeMenuId === field._id && (
                                                <div className="absolute right-0 top-10 w-36 bg-background border border-border rounded-md shadow-lg z-10 py-1 flex flex-col">
                                                    <button 
                                                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left"
                                                        onClick={() => { setEditingFieldId(field._id); setActiveMenuId(null); }}
                                                    >
                                                        <Edit2 className="h-4 w-4" /> Edit
                                                    </button>
                                                    <button 
                                                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-destructive/10 text-destructive text-left"
                                                        onClick={() => { handleDeleteField(field._id); setActiveMenuId(null); }}
                                                    >
                                                        <Trash2 className="h-4 w-4" /> Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {field.currentCrop ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                                <div className="flex items-center gap-3">
                                                    <Wheat className="h-5 w-5 text-primary" />
                                                    <div>
                                                        <p className="font-medium text-sm">{field.currentCrop.cropName}</p>
                                                        <p className="text-xs text-muted-foreground">Stage: {field.currentCrop.status || 'ACTIVE'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* GDD Engine Component */}
                                            <div className="mt-2">
                                                <GDDProgress fieldId={field._id} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-3 rounded-lg border-2 border-dashed text-center">
                                            <p className="text-sm text-muted-foreground">No crop assigned</p>
                                            <Button variant="link" size="sm" className="mt-1" onClick={() => setAssignCropFieldId(field._id)}>Assign Crop</Button>
                                        </div>
                                    )}

                                    {field.healthMetrics && (
                                        <div className="flex gap-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <ThermometerSun className="h-4 w-4 text-green-600" />
                                                <span>NDVI: {field.healthMetrics.ndvi?.toFixed(2) || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span>Stress:</span>
                                                <Badge variant={getStressColor(field.healthMetrics.stressLevel) as any}>
                                                    {field.healthMetrics.stressLevel}
                                                </Badge>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Droplets className="h-4 w-4" />
                                            <span>{(field.irrigationType || '').replace(/_/g, ' ')} Irrigation</span>
                                        </div>
                                    </div>
                                    
                                    {/* Event Ledger Components */}
                                    {field.currentCrop && (
                                        <div className="pt-2 border-t mt-4">
                                            <EventTimeline plotId={field._id} season={field.currentCrop.season} />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}

                        {/* Add Field Card */}
                        <Card 
                            className="border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer flex items-center justify-center min-h-[200px]"
                            onClick={() => setShowAddDialog(true)}
                        >
                            <CardContent className="text-center">
                                <Plus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                <p className="font-medium">Add New Field</p>
                                <p className="text-sm text-muted-foreground">Draw field boundary on map</p>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                     <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <MapPin className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <h3 className="font-semibold mb-1">No fields added yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">Add fields to this farm to start managing your crops</p>
                        <Button onClick={() => setShowAddDialog(true)}><Plus className="h-4 w-4 mr-2" />Add First Field</Button>
                    </div>
                )}
            </div>

            {showAddDialog && (
                <AddFieldDialog 
                    farmId={farm._id}
                    onClose={() => setShowAddDialog(false)}
                    onCreated={() => { setShowAddDialog(false); fetchFarm() }}
                />
            )}

            {assignCropFieldId && (
                <AssignCropDialog 
                    fieldId={assignCropFieldId}
                    onClose={() => setAssignCropFieldId(null)}
                    onAssigned={() => { setAssignCropFieldId(null); fetchFarm() }}
                />
            )}

            {editingFieldId && fieldBeingEdited && (
                <EditFieldDialog 
                    field={fieldBeingEdited}
                    onClose={() => setEditingFieldId(null)}
                    onUpdated={() => { setEditingFieldId(null); fetchFarm() }}
                />
            )}
        </div>
    )
}

/* ═══════ EDIT FIELD DIALOG ═══════ */
import { updateField } from '@/features/farms/api/farms'

function EditFieldDialog({ field, onClose, onUpdated }: { field: any; onClose: () => void; onUpdated: () => void }) {
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [form, setForm] = useState({
        name: field.name || '',
        soilType: field.soilType || 'LOAM',
        irrigationType: field.irrigationType || 'DRIP',
    })

    const update = (f: string, value: string) => setForm(prev => ({ ...prev, [f]: value }))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!form.name.trim()) { setError('Field name is required'); return }

        setSaving(true)
        try {
            await updateField(field._id, {
                name: form.name.trim(),
                soilType: form.soilType,
                irrigationType: form.irrigationType,
            })
            onUpdated()
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to update field')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-lg shadow-2xl border-primary/20 overflow-hidden bg-background/95 backdrop-blur-xl">
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b flex items-start justify-between">
                    <div>
                        <CardTitle className="text-2xl font-bold">Edit Field</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Update field details</p>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-black/5 dark:hover:bg-white/10" onClick={onClose}><X className="h-5 w-5" /></Button>
                </div>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="edit-field-name" className="text-foreground/80 font-medium">Field Name / Block Number <span className="text-destructive">*</span></Label>
                            <Input id="edit-field-name" className="h-11 bg-background/50 focus-visible:ring-primary/30 transition-all" value={form.name} onChange={e => update('name', e.target.value)} />
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-muted/30 rounded-xl p-4 border border-border/50">
                            <div className="space-y-2">
                                <Label htmlFor="edit-soil-type" className="text-xs text-muted-foreground uppercase tracking-wider">Soil Type</Label>
                                <select id="edit-soil-type" className="flex h-11 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30" value={form.soilType} onChange={e => update('soilType', e.target.value)}>
                                    <option value="CLAY">Clay</option>
                                    <option value="LOAM">Loam</option>
                                    <option value="SANDY">Sandy</option>
                                    <option value="SILT">Silt</option>
                                    <option value="PEATY">Peaty</option>
                                    <option value="CHALKY">Chalky</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-irrigation" className="text-xs text-muted-foreground uppercase tracking-wider">Irrigation</Label>
                                <select id="edit-irrigation" className="flex h-11 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30" value={form.irrigationType} onChange={e => update('irrigationType', e.target.value)}>
                                    <option value="DRIP">Drip System</option>
                                    <option value="SPRINKLER">Sprinkler</option>
                                    <option value="FLOOD">Flood / Canal</option>
                                    <option value="RAINFED">Rainfed (Dry)</option>
                                </select>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
                                <span className="font-semibold text-lg leading-none">!</span>
                                <p>{error}</p>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                            <Button type="button" variant="outline" className="px-6 rounded-full" onClick={onClose}>Cancel</Button>
                            <Button type="submit" className="px-6 rounded-full shadow-lg shadow-primary/25 transition-transform hover:scale-105" disabled={saving}>
                                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Edit2 className="h-4 w-4 mr-2" />}
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

/* ═══════ ADD FIELD DIALOG (with Leaflet Map Drawing) ═══════ */
import { MapContainer, TileLayer, Polygon, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

function PolygonDrawer({ positions, setPositions }: { positions: [number, number][]; setPositions: (p: [number, number][]) => void }) {
    useMapEvents({
        click(e) {
            setPositions([...positions, [e.latlng.lat, e.latlng.lng]])
        },
    })
    return positions.length >= 3 ? <Polygon positions={positions} pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.2, weight: 2 }} /> : null
}

function AddFieldDialog({ farmId, onClose, onCreated }: { farmId: string; onClose: () => void; onCreated: () => void }) {
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [positions, setPositions] = useState<[number, number][]>([])
    const [form, setForm] = useState({
        name: '',
        soilType: 'LOAM',
        irrigationType: 'DRIP',
    })

    const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!form.name.trim()) { setError('Field name is required'); return }
        if (positions.length < 3) { setError('Draw at least 3 points on the map to define field boundary'); return }

        // Convert lat/lng to GeoJSON [lng, lat] and close the polygon
        const coords = positions.map(p => [p[1], p[0]])
        coords.push(coords[0]) // close ring

        setSaving(true)
        try {
            await createField({
                farmId,
                name: form.name.trim(),
                soilType: form.soilType,
                irrigationType: form.irrigationType,
                boundary: {
                    type: 'Polygon',
                    coordinates: [coords]
                }
            })
            onCreated()
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to create field')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-2xl shadow-2xl border-primary/20 overflow-hidden bg-background/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b flex items-start justify-between">
                    <div>
                        <CardTitle className="text-2xl font-bold">Add New Field</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Draw field boundary on the map, then fill in details</p>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-black/5 dark:hover:bg-white/10" onClick={onClose}><X className="h-5 w-5" /></Button>
                </div>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Map Drawing Area */}
                        <div className="space-y-2">
                            <Label className="text-foreground/80 font-medium flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary" /> Draw Field Boundary <span className="text-destructive">*</span>
                            </Label>
                            <p className="text-xs text-muted-foreground">Click on the map to place vertices. Minimum 3 points required.</p>
                            <div className="rounded-xl overflow-hidden border border-border/50 h-[300px] relative">
                                <MapContainer
                                    center={[20.5937, 78.9629]}
                                    zoom={5}
                                    style={{ height: '100%', width: '100%' }}
                                    className="z-0"
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <PolygonDrawer positions={positions} setPositions={setPositions} />
                                </MapContainer>
                                {/* Point counter overlay */}
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

                        <div className="space-y-2">
                            <Label htmlFor="field-name" className="text-foreground/80 font-medium">Field Name / Block Number <span className="text-destructive">*</span></Label>
                            <Input id="field-name" className="h-11 bg-background/50 focus-visible:ring-primary/30 transition-all" placeholder="e.g. Block A" value={form.name} onChange={e => update('name', e.target.value)} />
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-muted/30 rounded-xl p-4 border border-border/50">
                            <div className="space-y-2">
                                <Label htmlFor="soil-type" className="text-xs text-muted-foreground uppercase tracking-wider">Soil Type</Label>
                                <select id="soil-type" className="flex h-11 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30" value={form.soilType} onChange={e => update('soilType', e.target.value)}>
                                    <option value="CLAY">Clay</option>
                                    <option value="LOAM">Loam</option>
                                    <option value="SANDY">Sandy</option>
                                    <option value="SILT">Silt</option>
                                    <option value="PEATY">Peaty</option>
                                    <option value="CHALKY">Chalky</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="irrigation" className="text-xs text-muted-foreground uppercase tracking-wider">Irrigation</Label>
                                <select id="irrigation" className="flex h-11 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30" value={form.irrigationType} onChange={e => update('irrigationType', e.target.value)}>
                                    <option value="DRIP">Drip System</option>
                                    <option value="SPRINKLER">Sprinkler</option>
                                    <option value="FLOOD">Flood / Canal</option>
                                    <option value="RAINFED">Rainfed (Dry)</option>
                                </select>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
                                <span className="font-semibold text-lg leading-none">!</span>
                                <p>{error}</p>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                            <Button type="button" variant="outline" className="px-6 rounded-full" onClick={onClose}>Cancel</Button>
                            <Button type="submit" className="px-6 rounded-full shadow-lg shadow-primary/25 transition-transform hover:scale-105" disabled={saving}>
                                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                Create Field
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}


/* ═══════ ASSIGN CROP DIALOG ═══════ */
import { getCropMaster } from '@/features/crops/api/crops'

function AssignCropDialog({ fieldId, onClose, onAssigned }: { fieldId: string; onClose: () => void; onAssigned: () => void }) {
    const [saving, setSaving] = useState(false)
    const [loadingCrops, setLoadingCrops] = useState(true)
    const [error, setError] = useState('')
    const [crops, setCrops] = useState<any[]>([])
    
    // Default dates
    const today = new Date().toISOString().split('T')[0]
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const [form, setForm] = useState({
        cropId: '',
        season: 'KHARIF',
        sowingDate: today,
        expectedHarvestDate: nextMonth,
        targetYield: '',
        seedVariety: ''
    })

    useEffect(() => {
        async function loadCrops() {
            try {
                const data = await getCropMaster()
                setCrops(data.crops || data || [])
                if (data && data.length > 0) {
                    setForm(prev => ({ ...prev, cropId: data[0]._id }))
                } else if (data && data.crops && data.crops.length > 0) {
                    setForm(prev => ({ ...prev, cropId: data.crops[0]._id }))
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoadingCrops(false)
            }
        }
        loadCrops()
    }, [])

    const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!form.cropId) { setError('Please select a crop'); return }
        if (!form.sowingDate || !form.expectedHarvestDate) { setError('Sowing and harvest dates are required'); return }

        setSaving(true)
        try {
            await assignCropToField(fieldId, {
                cropId: form.cropId,
                season: form.season,
                sowingDate: form.sowingDate,
                expectedHarvestDate: form.expectedHarvestDate,
                targetYield: form.targetYield ? Number(form.targetYield) : undefined,
                seedVariety: form.seedVariety || undefined
            })
            onAssigned()
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to assign crop')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-lg shadow-2xl border-primary/20 overflow-hidden bg-background/95 backdrop-blur-xl">
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b flex items-start justify-between">
                    <div>
                        <CardTitle className="text-2xl font-bold">Assign Crop</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Start tracking a new crop cycle on this field</p>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-black/5 dark:hover:bg-white/10" onClick={onClose}><X className="h-5 w-5" /></Button>
                </div>
                <CardContent className="p-6">
                    {loadingCrops ? (
                        <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label className="text-foreground/80 font-medium">Select Crop <span className="text-destructive">*</span></Label>
                                <select 
                                    className="flex h-11 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30" 
                                    value={form.cropId} 
                                    onChange={e => update('cropId', e.target.value)}
                                >
                                    <option value="" disabled>-- Select a crop --</option>
                                    {crops.map((c: any) => (
                                        <option key={c._id} value={c._id}>{c.cropName} ({c.scientificName || 'Crop'})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Season</Label>
                                    <select 
                                        className="flex h-11 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30" 
                                        value={form.season} 
                                        onChange={e => update('season', e.target.value)}
                                    >
                                        <option value="KHARIF">Kharif (Monsoon)</option>
                                        <option value="RABI">Rabi (Winter)</option>
                                        <option value="ZAID">Zaid (Summer)</option>
                                        <option value="ANNUAL">Annual</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Seed Variety</Label>
                                    <Input className="h-11 bg-background/50" placeholder="e.g. Hybrid X1" value={form.seedVariety} onChange={e => update('seedVariety', e.target.value)} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 bg-muted/30 rounded-xl p-4 border border-border/50">
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Sowing Date <span className="text-destructive">*</span></Label>
                                    <Input type="date" className="h-11 bg-background/50" value={form.sowingDate} onChange={e => update('sowingDate', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Exp. Harvest <span className="text-destructive">*</span></Label>
                                    <Input type="date" className="h-11 bg-background/50" value={form.expectedHarvestDate} onChange={e => update('expectedHarvestDate', e.target.value)} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Target Yield (quintals/acre)</Label>
                                <Input type="number" step="0.1" className="h-11 bg-background/50" placeholder="e.g. 25.5" value={form.targetYield} onChange={e => update('targetYield', e.target.value)} />
                            </div>

                            {error && (
                                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
                                    <span className="font-semibold text-lg leading-none">!</span>
                                    <p>{error}</p>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                                <Button type="button" variant="outline" className="px-6 rounded-full" onClick={onClose}>Cancel</Button>
                                <Button type="submit" className="px-6 rounded-full shadow-lg shadow-primary/25 transition-transform hover:scale-105" disabled={saving || !form.cropId}>
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wheat className="h-4 w-4 mr-2" />}
                                    Assign Crop
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
