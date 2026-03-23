import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Satellite, Plane, ShieldCheck, Link2, CheckCircle, XCircle,
    Globe, Eye, BarChart3, Clock, FileCheck,
} from 'lucide-react'

type Tab = 'eo' | 'drone' | 'agristack'

export function IntegrationsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('eo')

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'eo', label: 'EO Satellite', icon: <Satellite className="h-4 w-4" /> },
        { id: 'drone', label: 'Drone Operations', icon: <Plane className="h-4 w-4" /> },
        { id: 'agristack', label: 'AgriStack', icon: <Link2 className="h-4 w-4" /> },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Integrations</h1>
                <p className="text-muted-foreground">EO satellite adapters, drone operations, and government data exchange</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === tab.id
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                        }`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'eo' && <EOSatelliteTab />}
            {activeTab === 'drone' && <DroneOperationsTab />}
            {activeTab === 'agristack' && <AgriStackTab />}
        </div>
    )
}

/* ═══════ EO SATELLITE TAB ═══════ */
function EOSatelliteTab() {
    const ndviTimeline = [
        { date: 'Mar 1', value: 0.32 },
        { date: 'Mar 5', value: 0.38 },
        { date: 'Mar 10', value: 0.45 },
        { date: 'Mar 15', value: 0.52 },
        { date: 'Mar 20', value: 0.58 },
    ]

    return (
        <div className="space-y-6">
            {/* Status Banner */}
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                    <p className="font-semibold text-green-800 dark:text-green-300">Integrations Active</p>
                    <p className="text-sm text-green-700/80 dark:text-green-400/80">EO adapters successfully connected to PostGIS spatial boundaries, Google Earth Engine, and Sentinel Hub APIs.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* NDVI Index Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Eye className="h-5 w-5 text-green-500" /> NDVI Vegetation Index
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {ndviTimeline.map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="text-xs text-muted-foreground w-14">{item.date}</span>
                                    <div className="flex-1 h-6 bg-muted/50 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-600 transition-all"
                                            style={{ width: `${item.value * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-mono font-medium w-10 text-right">{item.value.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* VCI Drought Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-blue-500" /> VCI Drought Monitor
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 text-center">
                                <p className="text-xs text-muted-foreground">Current VCI</p>
                                <p className="text-2xl font-bold text-green-600">72</p>
                                <Badge variant="secondary" className="text-[10px]">Normal</Badge>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/50 border text-center">
                                <p className="text-xs text-muted-foreground">30-day Trend</p>
                                <p className="text-2xl font-bold text-primary">↑5%</p>
                                <Badge variant="secondary" className="text-[10px]">Improving</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Data Sources */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Globe className="h-5 w-5 text-indigo-500" /> Configured Data Sources
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-3 gap-4">
                            {[
                                { name: 'Google Earth Engine (GCP)', desc: 'Cloud-based geospatial analysis and algorithms', status: 'connected' },
                                { name: 'Copernicus Sentinel-2', desc: 'High-resolution optical satellite imagery via CDSE', status: 'connected' },
                                { name: 'Survey of India (PostGIS)', desc: 'Village boundaries and acreage shapefiles', status: 'connected' },
                            ].map((source) => (
                                <div key={source.name} className="p-4 rounded-lg border flex items-start gap-3">
                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                                        <Satellite className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{source.name}</p>
                                        <p className="text-xs text-muted-foreground">{source.desc}</p>
                                        <Badge variant="outline" className="mt-2 text-[10px]">
                                            <Clock className="h-3 w-3 mr-1" /> {source.status === 'pending' ? 'Awaiting Config' : 'Connected'}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

/* ═══════ DRONE OPERATIONS TAB ═══════ */
function DroneOperationsTab() {
    const [sopChecklist, setSopChecklist] = useState({
        rpc: false,
        uin: false,
        windCheck: false,
        driftBuffer: false,
        flightPlan: false,
    })

    const allChecked = Object.values(sopChecklist).every(Boolean)
    const toggle = (key: keyof typeof sopChecklist) => setSopChecklist(prev => ({ ...prev, [key]: !prev[key] }))

    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                {/* SOP Gate */}
                <Card className="border-indigo-500/20">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-indigo-500" /> Drone SOP Compliance Gate
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">DGCA & DA&FW mandatory compliance checks</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {[
                            { key: 'rpc' as const, label: 'Remote Pilot Certificate (RPC)', desc: 'Valid DGCA-issued RPC for drone operator' },
                            { key: 'uin' as const, label: 'Unique Identification Number (UIN)', desc: 'Registered drone UIN with serial number' },
                            { key: 'windCheck' as const, label: 'Wind Speed Check', desc: 'Wind speed < 15 km/h for safe spraying' },
                            { key: 'driftBuffer' as const, label: 'Drift Buffer Zone', desc: 'Minimum 100m buffer from habitation/water' },
                            { key: 'flightPlan' as const, label: 'Flight Plan Filed', desc: 'Digital sky permit and flight path approved' },
                        ].map(item => (
                            <div
                                key={item.key}
                                className={`p-3 rounded-lg border cursor-pointer transition-colors ${sopChecklist[item.key] ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'hover:bg-muted/50'}`}
                                onClick={() => toggle(item.key)}
                            >
                                <div className="flex items-center gap-3">
                                    {sopChecklist[item.key]
                                        ? <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                                        : <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                                    }
                                    <div>
                                        <p className="font-medium text-sm">{item.label}</p>
                                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <Button
                            className="w-full mt-4"
                            disabled={!allChecked}
                            variant={allChecked ? 'default' : 'outline'}
                        >
                            <Plane className="h-4 w-4 mr-2" />
                            {allChecked ? 'Activate Drone Spray Mission' : `Complete ${5 - Object.values(sopChecklist).filter(Boolean).length} remaining checks`}
                        </Button>
                    </CardContent>
                </Card>

                {/* Spray Log */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FileCheck className="h-5 w-5 text-green-500" /> Recent Spray Missions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12">
                            <Plane className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                            <p className="text-muted-foreground">No drone missions recorded</p>
                            <p className="text-sm text-muted-foreground mt-1">Complete SOP compliance gate to activate drone operations</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

/* ═══════ AGRISTACK TAB ═══════ */
function AgriStackTab() {
    const [form, setForm] = useState({ state: '', farmerId: '', farmerName: '' })
    const [linking, setLinking] = useState(false)
    const [linkResult, setLinkResult] = useState<string | null>(null)

    const handleLink = async () => {
        if (!form.state || !form.farmerId || !form.farmerName) return
        setLinking(true)
        setLinkResult(null)
        // Simulate API call
        setTimeout(() => {
            setLinkResult('success')
            setLinking(false)
        }, 1500)
    }

    return (
        <div className="space-y-6">
            {/* Status Banner */}
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
                <Link2 className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                    <p className="font-semibold text-blue-800 dark:text-blue-300">AgriStack Integration</p>
                    <p className="text-sm text-blue-700/80 dark:text-blue-400/80">Link farmer IDs with State Farmer Registry and Crop-Sown Database for government data alignment and PMFBY support.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Farmer ID Linking Form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Link2 className="h-5 w-5 text-primary" /> Farmer ID Linking
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>State</Label>
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })}>
                                <option value="">Select state...</option>
                                <option value="AP">Andhra Pradesh</option>
                                <option value="KA">Karnataka</option>
                                <option value="MH">Maharashtra</option>
                                <option value="MP">Madhya Pradesh</option>
                                <option value="TN">Tamil Nadu</option>
                                <option value="TS">Telangana</option>
                                <option value="UP">Uttar Pradesh</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Farmer ID</Label>
                            <Input placeholder="e.g. FID-2024-XXXX" value={form.farmerId} onChange={e => setForm({ ...form, farmerId: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Farmer Name (as per Aadhaar)</Label>
                            <Input placeholder="Full name" value={form.farmerName} onChange={e => setForm({ ...form, farmerName: e.target.value })} />
                        </div>
                        <Button className="w-full" onClick={handleLink} disabled={linking || !form.state || !form.farmerId}>
                            {linking ? <span className="animate-spin mr-2">⏳</span> : <Link2 className="h-4 w-4 mr-2" />}
                            Link with AgriStack
                        </Button>

                        {linkResult === 'success' && (
                            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 text-center">
                                <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                                <p className="font-semibold text-green-700 dark:text-green-300 text-sm">Linking Request Submitted</p>
                                <p className="text-xs text-muted-foreground mt-1">Verification pending with State Registry</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* PMFBY Export */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FileCheck className="h-5 w-5 text-amber-500" /> PMFBY Export Module
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Generate NCIP/YES-TECH compliant JSON bundles with GeoPackage evidence for crop insurance claims.
                        </p>
                        <div className="space-y-3">
                            {[
                                { label: 'Farmer KYC Bundle', desc: 'Aadhaar, land records, bank details', ready: true },
                                { label: 'Crop Evidence Pack', desc: 'Geo-tagged photos, stage logs, sensor data', ready: false },
                                { label: 'Loss Assessment', desc: 'NDVI anomaly report + field photos', ready: false },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                                    <div>
                                        <p className="font-medium text-sm">{item.label}</p>
                                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                                    </div>
                                    <Button variant="outline" size="sm" disabled={!item.ready}>
                                        Export
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
