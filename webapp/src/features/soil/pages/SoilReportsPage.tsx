import { useEffect, useState } from 'react'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FlaskConical, Plus, FileText, Loader2, X, Beaker, Leaf, CheckCircle } from 'lucide-react'
import { createSoilReport } from '@/features/soil/api/soil'
import { getFarms } from '@/features/farms/api/farms'

interface SoilReportItem {
    _id: string
    fieldId: string
    reportDate: string
    testingLab: string
    results?: {
        ph?: number
        nitrogen?: number
        phosphorus?: number
        potassium?: number
        organicCarbon?: number
    }
    interpretation?: {
        npkRating?: string
        phRating?: string
        overallScore?: number
    }
    recommendations?: {
        fertilizers?: Array<{ name: string; quantity: number; applicationStage?: string; notes?: string }>
        amendments?: Array<{ type: string; quantity: number; reason: string }>
    }
    status?: string
}

export function SoilReportsPage() {
    const [reports, setReports] = useState<SoilReportItem[]>([])
    const [loading, setLoading] = useState(true)
    const [showUploadDialog, setShowUploadDialog] = useState(false)

    useEffect(() => {
        async function fetchReports() {
            try {
                setLoading(true)
                // Soil reports are field-specific — without a fieldId, we show empty
                await getFarms() // just to verify connectivity
                setReports([])
            } catch {
                setReports([])
            } finally {
                setLoading(false)
            }
        }
        fetchReports()
    }, [])

    const getHealthColor = (score?: number) => {
        if (!score) return 'secondary'
        if (score >= 80) return 'success'
        if (score >= 60) return 'default'
        if (score >= 40) return 'secondary'
        return 'destructive'
    }

    const getHealthLabel = (score?: number) => {
        if (!score) return 'N/A'
        if (score >= 80) return 'EXCELLENT'
        if (score >= 60) return 'GOOD'
        if (score >= 40) return 'FAIR'
        return 'POOR'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading soil reports...</span>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Soil Reports</h1>
                    <p className="text-muted-foreground">Soil analysis, NPK levels, and fertilizer recommendations</p>
                </div>
                <Button onClick={() => setShowUploadDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Report
                </Button>
            </div>

            {/* Summary */}
            {reports.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                                    <FlaskConical className="h-5 w-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{reports.length}</p>
                                    <p className="text-xs text-muted-foreground">Total Reports</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                    <Beaker className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">
                                        {reports.filter(r => r.status === 'VERIFIED').length}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Verified</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                    <Leaf className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">
                                        {reports.length > 0
                                            ? Math.round(reports.reduce((s, r) => s + (r.interpretation?.overallScore || 0), 0) / reports.length)
                                            : 0}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Avg Health Score</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Reports list */}
            <div className="grid gap-4">
                {reports.map((report) => (
                    <Card key={report._id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                                        <FlaskConical className="h-6 w-6 text-amber-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Field: {report.fieldId.slice(-6)}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            pH: {report.results?.ph || 'N/A'} •
                                            Lab: {report.testingLab} •
                                            {new Date(report.reportDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge variant={getHealthColor(report.interpretation?.overallScore) as any}>
                                        {getHealthLabel(report.interpretation?.overallScore)}
                                    </Badge>
                                    <Badge variant={report.status === 'VERIFIED' ? 'default' : 'secondary'}>
                                        {report.status}
                                    </Badge>
                                    <Button variant="outline" size="sm">
                                        <FileText className="h-4 w-4 mr-2" /> View
                                    </Button>
                                </div>
                            </div>
                            {/* NPK and recommendations */}
                            {report.results && (
                                <div className="mt-3 pt-3 border-t grid grid-cols-4 gap-4 text-sm">
                                    <div><span className="text-muted-foreground">Nitrogen:</span> <span className="font-medium">{report.results.nitrogen} kg/ha</span></div>
                                    <div><span className="text-muted-foreground">Phosphorus:</span> <span className="font-medium">{report.results.phosphorus} kg/ha</span></div>
                                    <div><span className="text-muted-foreground">Potassium:</span> <span className="font-medium">{report.results.potassium} kg/ha</span></div>
                                    <div><span className="text-muted-foreground">Organic C:</span> <span className="font-medium">{report.results.organicCarbon || 'N/A'}%</span></div>
                                </div>
                            )}
                            {report.recommendations?.fertilizers && report.recommendations.fertilizers.length > 0 && (
                                <div className="mt-2">
                                    <p className="text-xs text-muted-foreground mb-1">Recommendations:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {report.recommendations.fertilizers.map((f, i) => (
                                            <Badge key={i} variant="outline" className="text-xs">
                                                {f.name} — {f.quantity} kg/acre
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Empty state */}
            {reports.length === 0 && (
                <div className="text-center py-16">
                    <FlaskConical className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No soil reports yet</h3>
                    <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                        Upload soil test results to get AI-powered NPK analysis, fertilizer recommendations, and soil health scores.
                    </p>
                    <Button onClick={() => setShowUploadDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" /> Upload Your First Report
                    </Button>
                </div>
            )}

            {showUploadDialog && (
                <UploadSoilDialog
                    onClose={() => setShowUploadDialog(false)}
                    onCreated={() => { setShowUploadDialog(false) }}
                />
            )}
        </div>
    )
}

/* ═══════ UPLOAD SOIL REPORT DIALOG ═══════ */
function UploadSoilDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [result, setResult] = useState<any>(null)
    const [farms, setFarms] = useState<any[]>([])
    const [fields, setFields] = useState<any[]>([])
    const [selectedFarmId, setSelectedFarmId] = useState('')
    const [form, setForm] = useState({
        fieldId: '',
        reportDate: new Date().toISOString().split('T')[0],
        testingLab: '',
        ph: '',
        nitrogen: '',
        phosphorus: '',
        potassium: '',
        organicCarbon: '',
    })

    useEffect(() => {
        getFarms().then(d => setFarms(d.farms || [])).catch(() => {})
    }, [])

    useEffect(() => {
        if (!selectedFarmId) { setFields([]); return }
        const farm = farms.find((f: any) => (f._id || f.id) === selectedFarmId)
        if (farm?.fields) { setFields(farm.fields); return }
        import('@/features/farms/api/farms').then(m => m.getFarmById(selectedFarmId))
            .then(d => setFields(d.fields || []))
            .catch(() => setFields([]))
    }, [selectedFarmId, farms])

    const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!form.fieldId) { setError('Please select a farm and field'); return }
        if (!form.testingLab.trim()) { setError('Testing lab name is required'); return }
        if (!form.ph || parseFloat(form.ph) < 3 || parseFloat(form.ph) > 10) { setError('Enter valid pH (3-10)'); return }

        setSaving(true)
        try {
            const data = await createSoilReport({
                fieldId: form.fieldId,
                reportDate: form.reportDate,
                testingLab: form.testingLab.trim(),
                manualEntry: {
                    ph: parseFloat(form.ph),
                    nitrogen: parseFloat(form.nitrogen) || 0,
                    phosphorus: parseFloat(form.phosphorus) || 0,
                    potassium: parseFloat(form.potassium) || 0,
                    organicCarbon: form.organicCarbon ? parseFloat(form.organicCarbon) : undefined,
                },
            })
            setResult(data)
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to upload soil report')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-xl shadow-2xl border-amber-500/20 overflow-hidden bg-background/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
                <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent p-6 border-b flex items-start justify-between">
                    <div>
                        <CardTitle className="text-2xl font-bold flex items-center gap-2">
                            <FlaskConical className="h-6 w-6 text-amber-600" />
                            Upload Soil Report
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Enter lab test results for AI-driven nutrient analysis</p>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-black/5 dark:hover:bg-white/10" onClick={onClose}><X className="h-5 w-5" /></Button>
                </div>
                <CardContent className="p-6">
                    {result ? (
                        <div className="space-y-6 animate-in zoom-in duration-300">
                            <div className="p-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 border border-green-200 dark:border-green-800 text-center">
                                <div className="h-16 w-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                                </div>
                                <h4 className="text-xl font-bold text-green-800 dark:text-green-300">Analysis Complete!</h4>
                                <p className="text-sm text-green-600/80 dark:text-green-400/80 mt-1">Report ID: {result.reportId}</p>
                                
                                {result.interpretation && (
                                    <div className="mt-6 grid grid-cols-3 gap-3">
                                        <div className="bg-white/60 dark:bg-black/20 p-3 rounded-xl">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider">pH Level</p>
                                            <p className="font-bold text-lg mt-1">{result.interpretation.phRating}</p>
                                        </div>
                                        <div className="bg-white/60 dark:bg-black/20 p-3 rounded-xl">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Nutrients</p>
                                            <p className="font-bold text-lg mt-1">{result.interpretation.npkRating}</p>
                                        </div>
                                        <div className="bg-white/60 dark:bg-black/20 p-3 rounded-xl">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Health</p>
                                            <p className="font-bold text-xl text-primary mt-1">{result.interpretation.overallScore}<span className="text-sm text-muted-foreground">/100</span></p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <Button className="w-full h-12 rounded-full text-base font-medium shadow-lg shadow-primary/20" onClick={onCreated}>
                                View Recommendations
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label className="text-foreground/80 font-medium">Farm <span className="text-destructive">*</span></Label>
                                    <select className="flex h-11 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30" value={selectedFarmId} onChange={e => { setSelectedFarmId(e.target.value); update('fieldId', '') }}>
                                        <option value="">Select farm...</option>
                                        {farms.map((f: any) => (
                                            <option key={f._id || f.id} value={f._id || f.id}>{f.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-foreground/80 font-medium">Field <span className="text-destructive">*</span></Label>
                                    <select className="flex h-11 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30" value={form.fieldId} onChange={e => update('fieldId', e.target.value)} disabled={!selectedFarmId}>
                                        <option value="">Select field...</option>
                                        {fields.map((f: any) => (
                                            <option key={f._id} value={f._id}>{f.name} ({f.area} acres)</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label className="text-foreground/80 font-medium">Report Date <span className="text-destructive">*</span></Label>
                                    <Input type="date" className="h-11 bg-background/50 focus-visible:ring-amber-500/30 px-3 cursor-pointer" value={form.reportDate} onChange={e => update('reportDate', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-foreground/80 font-medium">Testing Lab <span className="text-destructive">*</span></Label>
                                    <Input className="h-11 bg-background/50 focus-visible:ring-amber-500/30" placeholder="e.g. State Agricultural Lab" value={form.testingLab} onChange={e => update('testingLab', e.target.value)} />
                                </div>
                            </div>

                            <div className="bg-muted/30 rounded-2xl p-5 border border-border/50">
                                <p className="text-sm font-semibold text-foreground/80 mb-4 flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-amber-600" /> Test Results
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">pH Level <span className="text-destructive">*</span></Label>
                                        <Input type="number" step="0.1" min="3" max="10" className="h-10 bg-background/50" placeholder="6.8" value={form.ph} onChange={e => update('ph', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Nitrogen (kg/ha)</Label>
                                        <Input type="number" className="h-10 bg-background/50" placeholder="180" value={form.nitrogen} onChange={e => update('nitrogen', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Phosphorus (kg/ha)</Label>
                                        <Input type="number" className="h-10 bg-background/50" placeholder="22" value={form.phosphorus} onChange={e => update('phosphorus', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Potassium (kg/ha)</Label>
                                        <Input type="number" className="h-10 bg-background/50" placeholder="145" value={form.potassium} onChange={e => update('potassium', e.target.value)} />
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-border/50">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Organic Carbon (%)</Label>
                                        <Input type="number" step="0.01" className="h-10 bg-background/50 w-full sm:w-1/2" placeholder="0.65" value={form.organicCarbon} onChange={e => update('organicCarbon', e.target.value)} />
                                    </div>
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
                                <Button type="submit" className="px-6 rounded-full bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/25 transition-transform hover:scale-105" disabled={saving}>
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FlaskConical className="h-4 w-4 mr-2" />}
                                    Upload & Analyze
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

