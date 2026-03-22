import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Bug, Camera, AlertTriangle, CheckCircle, Loader2, X, Shield } from 'lucide-react'
import { reportPest } from '@/features/pest/api/pest'
import { getFarms } from '@/features/farms/api/farms'

interface PestReport {
    _id: string
    fieldId: string
    identification?: {
        pestName?: string
        scientificName?: string
        confidence?: number
        method?: string
    }
    severity: string
    status: string
    symptoms?: string[]
    createdAt?: string
    treatment?: {
        recommended?: Array<{
            productName: string
            activeIngredient?: string
            dosage?: string
            applicationMethod?: string
        }>
    }
}

export function PestReportsPage() {
    const [reports, setReports] = useState<PestReport[]>([])
    const [loading, setLoading] = useState(true)
    const [showReportDialog, setShowReportDialog] = useState(false)

    useEffect(() => {
        async function fetchReports() {
            try {
                setLoading(true)
                // Try to fetch from backend — pest incidents need a fieldId
                // For the listing page, we'll try to get all farms' fields' pest data
                const farmData = await getFarms()
                // For now, show empty if no farms exist
                if (!farmData.farms || farmData.farms.length === 0) {
                    setReports([])
                    return
                }
                // We don't have a "get all pest incidents" endpoint so show empty until user reports
                setReports([])
            } catch {
                setReports([])
            } finally {
                setLoading(false)
            }
        }
        fetchReports()
    }, [])

    const getSeverityVariant = (s: string) =>
        s === 'HIGH' || s === 'CRITICAL' ? 'destructive' : s === 'MEDIUM' ? 'secondary' : 'default'

    const getStatusIcon = (s: string) =>
        s === 'RESOLVED' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading pest reports...</span>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Pest Reports</h1>
                    <p className="text-muted-foreground">AI-powered pest detection and tracking</p>
                </div>
                <Button onClick={() => setShowReportDialog(true)}>
                    <Camera className="h-4 w-4 mr-2" />
                    Report Pest
                </Button>
            </div>

            {/* Summary */}
            {reports.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                                    <Bug className="h-5 w-5 text-red-600" />
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
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">
                                        {reports.filter(r => r.status !== 'RESOLVED').length}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Active</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                    <Shield className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">
                                        {reports.filter(r => r.status === 'RESOLVED').length}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Resolved</p>
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
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                                        <Bug className="h-6 w-6 text-red-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{report.identification?.pestName || 'Unknown Pest'}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            AI Confidence: {report.identification?.confidence || 0}%
                                            {report.createdAt && ` • ${new Date(report.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge variant={getSeverityVariant(report.severity) as any}>{report.severity}</Badge>
                                    <div className="flex items-center gap-1">
                                        {getStatusIcon(report.status)}
                                        <span className="text-sm">{report.status.replace(/_/g, ' ')}</span>
                                    </div>
                                </div>
                            </div>
                            {/* Treatment recommendations */}
                            {report.treatment?.recommended && report.treatment.recommended.length > 0 && (
                                <div className="mt-3 pt-3 border-t">
                                    <p className="text-xs font-medium text-muted-foreground mb-2">Recommended Treatment:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {report.treatment.recommended.map((t, i) => (
                                            <Badge key={i} variant="outline" className="text-xs">
                                                {t.productName} — {t.dosage}
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
                    <Bug className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No pest reports yet</h3>
                    <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                        Report pest sightings in your fields for AI-powered identification and treatment recommendations.
                    </p>
                    <Button onClick={() => setShowReportDialog(true)}>
                        <Camera className="h-4 w-4 mr-2" /> Report a Pest
                    </Button>
                </div>
            )}

            {showReportDialog && (
                <ReportPestDialog
                    onClose={() => setShowReportDialog(false)}
                    onCreated={() => { setShowReportDialog(false) }}
                />
            )}
        </div>
    )
}

/* ═══════ REPORT PEST DIALOG ═══════ */
function ReportPestDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [result, setResult] = useState<any>(null)
    const [farms, setFarms] = useState<any[]>([])
    const [fields, setFields] = useState<any[]>([])
    const [selectedFarmId, setSelectedFarmId] = useState('')
    const [form, setForm] = useState({
        fieldId: '',
        description: '',
        severity: 'MEDIUM',
        imageUrl: '',
    })

    useEffect(() => {
        getFarms().then(d => setFarms(d.farms || [])).catch(() => {})
    }, [])

    useEffect(() => {
        if (!selectedFarmId) { setFields([]); return }
        const farm = farms.find((f: any) => (f._id || f.id) === selectedFarmId)
        if (farm?.fields) { setFields(farm.fields); return }
        // Fetch fields for this farm from farm detail
        import('@/features/farms/api/farms').then(m => m.getFarmById(selectedFarmId))
            .then(d => setFields(d.fields || []))
            .catch(() => setFields([]))
    }, [selectedFarmId, farms])

    const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!form.fieldId) { setError('Please select a farm and field'); return }

        setSaving(true)
        try {
            const data = await reportPest({
                fieldId: form.fieldId,
                images: form.imageUrl ? [form.imageUrl] : ['https://placeholder.pest-image.jpg'],
                description: form.description,
                severity: form.severity as 'LOW' | 'MEDIUM' | 'HIGH',
            })
            setResult(data)
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to report pest')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-lg shadow-2xl">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Report Pest Sighting</CardTitle>
                        <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {result ? (
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200">
                                <h4 className="font-semibold text-green-700 dark:text-green-300">🔬 AI Detection Result</h4>
                                <p className="text-sm mt-2"><strong>Pest:</strong> {result.identification?.pestName || 'Analyzing...'}</p>
                                <p className="text-sm"><strong>Confidence:</strong> {result.identification?.confidence}%</p>
                                {result.needsReview && (
                                    <p className="text-xs text-amber-600 mt-2">⚠️ Low confidence — sent for expert review</p>
                                )}
                            </div>
                            {result.treatment && result.treatment.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-sm mb-2">Treatment Recommendations:</h4>
                                    {result.treatment.map((t: any, i: number) => (
                                        <div key={i} className="p-2 rounded bg-muted/50 text-sm mb-1">
                                            <strong>{t.productName}</strong> — {t.dosage} ({t.applicationMethod})
                                        </div>
                                    ))}
                                </div>
                            )}
                            <Button className="w-full" onClick={onCreated}>Done</Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Farm *</Label>
                                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={selectedFarmId} onChange={e => { setSelectedFarmId(e.target.value); update('fieldId', '') }}>
                                        <option value="">Select farm...</option>
                                        {farms.map((f: any) => (
                                            <option key={f._id || f.id} value={f._id || f.id}>{f.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Field *</Label>
                                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.fieldId} onChange={e => update('fieldId', e.target.value)} disabled={!selectedFarmId}>
                                        <option value="">Select field...</option>
                                        {fields.map((f: any) => (
                                            <option key={f._id} value={f._id}>{f.name} ({f.area} acres)</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Input placeholder="Describe symptoms..." value={form.description} onChange={e => update('description', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Severity</Label>
                                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.severity} onChange={e => update('severity', e.target.value)}>
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Image URL (optional)</Label>
                                <Input placeholder="https://..." value={form.imageUrl} onChange={e => update('imageUrl', e.target.value)} />
                            </div>
                            {error && <p className="text-sm text-destructive">{error}</p>}
                            <div className="flex justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                                <Button type="submit" disabled={saving}>
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Camera className="h-4 w-4 mr-2" />}
                                    Analyze & Report
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

