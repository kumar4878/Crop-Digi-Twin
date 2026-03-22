import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
    ChevronLeft, 
    Search, 
    Download, 
    Play, 
    Layers, 
    Plus,
    Clock,
    Activity,
    Sprout,
    Star
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
type ViewMode = 'national' | 'state' | 'cluster';

interface StateData {
    id: string;
    name: string;
    acreage: number;
    yield: number;
    clusters: number;
    coords: [number, number];
}

interface DistrictData {
    id: string;
    name: string;
    acreage: number;
    soil: string;
    water: string;
    yield: number;
    clusters: number;
    coords: [number, number];
}

interface ClusterData {
    id: string;
    name: string;
    villages: string;
    acreage: number;
    spread: string;
    status: 'Draft' | 'Active';
}

// Mock Data targeting the precise UI
const statesData: StateData[] = [
    { id: 'TG', name: 'Telangana', acreage: 48500, yield: 28.5, clusters: 5, coords: [17.8, 79.0] },
    { id: 'MH', name: 'Maharashtra', acreage: 38700, yield: 24.8, clusters: 4, coords: [19.0, 75.5] },
    { id: 'KA', name: 'Karnataka', acreage: 42300, yield: 26.2, clusters: 4, coords: [14.5, 76.0] },
    { id: 'AP', name: 'Andhra Pradesh', acreage: 36200, yield: 27.1, clusters: 4, coords: [16.0, 80.0] },
    { id: 'MP', name: 'Madhya Pradesh', acreage: 28400, yield: 22.3, clusters: 3, coords: [23.0, 78.5] },
    { id: 'GJ', name: 'Gujarat', acreage: 25100, yield: 21.5, clusters: 3, coords: [22.5, 71.5] },
    { id: 'TN', name: 'Tamil Nadu', acreage: 22800, yield: 25.4, clusters: 2, coords: [11.0, 78.0] },
    { id: 'RJ', name: 'Rajasthan', acreage: 18600, yield: 19.8, clusters: 2, coords: [26.5, 73.5] },
    { id: 'OD', name: 'Odisha', acreage: 16400, yield: 20.6, clusters: 2, coords: [20.5, 84.5] },
    { id: 'UP', name: 'Uttar Pradesh', acreage: 14200, yield: 21.0, clusters: 2, coords: [27.0, 80.5] },
    { id: 'BR', name: 'Bihar', acreage: 12100, yield: 18.5, clusters: 1, coords: [25.5, 85.5] },
    { id: 'JH', name: 'Jharkhand', acreage: 10500, yield: 17.8, clusters: 1, coords: [23.5, 85.0] },
    { id: 'AS', name: 'Assam', acreage: 8400, yield: 19.2, clusters: 1, coords: [26.0, 92.5] },
    { id: 'WB', name: 'West Bengal', acreage: 11200, yield: 20.1, clusters: 1, coords: [24.0, 88.0] },
    { id: 'PB', name: 'Punjab', acreage: 9500, yield: 24.5, clusters: 1, coords: [30.5, 75.5] },
];

const odishaDistricts: DistrictData[] = [
    { id: 'OD-RA', name: 'Rangareddy', acreage: 6200, soil: 'Red Sandy Loam', water: 'Canal + Borewell', yield: 30.2, clusters: 1, coords: [20.8, 84.2] },
    { id: 'OD-ME', name: 'Medak', acreage: 5800, soil: 'Black Soil', water: 'Borewell', yield: 29.5, clusters: 1, coords: [20.2, 84.8] },
    { id: 'OD-KH', name: 'Khurda', acreage: 5100, soil: 'Alluvial', water: 'Canal', yield: 28.1, clusters: 1, coords: [20.1, 85.5] },
    { id: 'OD-CT', name: 'Cuttack', acreage: 4800, soil: 'Alluvial', water: 'River', yield: 27.5, clusters: 1, coords: [20.5, 85.8] },
    { id: 'OD-PU', name: 'Puri', acreage: 4300, soil: 'Sandy', water: 'Canal', yield: 26.8, clusters: 1, coords: [19.8, 85.8] },
    { id: 'OD-GA', name: 'Ganjam', acreage: 3900, soil: 'Red Sandy', water: 'Borewell', yield: 25.4, clusters: 1, coords: [19.5, 84.8] },
    { id: 'OD-BA', name: 'Balasore', acreage: 3500, soil: 'Alluvial', water: 'Canal', yield: 24.9, clusters: 1, coords: [21.5, 86.9] },
    { id: 'OD-BH', name: 'Bhadrak', acreage: 3100, soil: 'Alluvial', water: 'Canal', yield: 24.2, clusters: 1, coords: [21.0, 86.5] },
    { id: 'OD-JA', name: 'Jajpur', acreage: 2800, soil: 'Laterite', water: 'Borewell', yield: 23.8, clusters: 1, coords: [20.8, 86.2] },
    { id: 'OD-AN', name: 'Angul', acreage: 2500, soil: 'Red Soil', water: 'River', yield: 22.5, clusters: 1, coords: [21.0, 85.0] },
];

const clusterData: ClusterData[] = [
    { id: 'TG-TOM-CLO1', name: 'TG-TOM-CLO1', villages: 'Shadnagar, Chevella, Siddipet', acreage: 14200, spread: '132 km', status: 'Draft' },
    { id: 'TG-TOM-CLO2', name: 'TG-TOM-CLO2', villages: 'Miryalaguda, Bhongir, Jangaon', acreage: 11800, spread: '104 km', status: 'Draft' },
];

// Helper to center map
function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
    const map = useMap();
    React.useEffect(() => {
        map.flyTo(center, zoom, { animate: true, duration: 1.5 });
    }, [center, zoom, map]);
    return null;
}

export function CropPlanDashboard() {
    const [view, setView] = useState<ViewMode>('national');
    const [selectedState, setSelectedState] = useState<StateData | null>(null);
    const [mapCenter, setMapCenter] = useState<[number, number]>([22.0, 79.0]);
    const [mapZoom, setMapZoom] = useState(5);
    const [searchTerm, setSearchTerm] = useState('');

    const handleStateClick = (state: StateData) => {
        setSelectedState(state);
        setView('state');
        setMapCenter(state.coords);
        setMapZoom(7);
    };

    const handleBackToNational = () => {
        setSelectedState(null);
        setView('national');
        setMapCenter([22.0, 79.0]);
        setMapZoom(5);
    };

    const handleEnableClusterMode = () => {
        setView('cluster');
        setMapZoom(8); // Zoom in a bit more for cluster rendering
    };

    const getRadius = (acreage: number) => Math.max(12, Math.min(45, acreage / 1000));
    
    const getColor = (acreage: number) => {
        if (acreage > 30000) return '#ef4444'; // High (Red)
        if (acreage > 15000) return '#f97316'; // Medium (Orange)
        return '#eab308'; // Low (Yellow)
    };

    const activeMapPoints = view === 'national' 
        ? statesData 
        : odishaDistricts; // Assuming we only hardcoded Odisha for this demo

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] w-full overflow-hidden bg-background">
            {/* Top Toolbar */}
            <header className="flex h-14 items-center justify-between px-6 border-b bg-card shrink-0">
                <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-1.5 rounded-md">
                        <Sprout className="h-5 w-5 text-primary" />
                    </div>
                    <h1 className="text-xl font-bold">Crop Digital Twin</h1>
                </div>
                <div className="flex items-center gap-3">
                    <select className="flex h-9 w-[150px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                        <option>Tomato</option>
                        <option>Potato</option>
                        <option>Onion</option>
                    </select>
                    <select className="flex h-9 w-[120px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                        <option>FY 24-25</option>
                        <option>FY 23-24</option>
                    </select>
                    <Button className="bg-green-700 hover:bg-green-800 text-white gap-2">
                        <Play className="h-4 w-4" fill="currentColor" /> Run Analysis
                    </Button>
                </div>
            </header>

            <div className="flex flex-1 relative overflow-hidden">
                {/* Cluster Management Left Pane Overlay */}
                {view === 'cluster' && (
                    <div className="absolute left-6 top-6 bottom-6 w-80 bg-card rounded-lg shadow-xl border z-[400] flex flex-col overflow-hidden animate-in slide-in-from-left-4 duration-300">
                        <div className="p-4 border-b bg-card flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-base">Cluster Management</h3>
                                <p className="text-xs text-muted-foreground">{clusterData.length} clusters • Operations Center</p>
                            </div>
                            <Button size="sm" className="bg-green-700 hover:bg-green-800 h-8 text-xs gap-1">
                                <Plus className="h-3.5 w-3.5" /> New Cluster
                            </Button>
                        </div>
                        <div className="flex-1 overflow-y-auto min-h-0 p-4">
                            <div className="space-y-4">
                                {clusterData.map((cluster, i) => (
                                    <Card key={cluster.id} className={cn("cursor-pointer transition-colors hover:border-primary", i === 0 && "border-primary ring-1 ring-primary/20 bg-primary/5")}>
                                        <CardContent className="p-4 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-semibold text-sm">{cluster.id}</h4>
                                                <Badge variant="outline" className="text-[10px] h-5 rounded-full px-2 font-normal flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> {cluster.status}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-1">{cluster.villages}</p>
                                            
                                            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t">
                                                <div>
                                                    <span className="text-muted-foreground block mb-0.5">Acreage</span>
                                                    <span className="font-medium">{cluster.acreage.toLocaleString()} Ha</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground block mb-0.5">Aerial Spread</span>
                                                    <span className="font-medium">{cluster.spread}</span>
                                                </div>
                                            </div>
                                            
                                            {i === 0 && (
                                                <div className="mt-2 bg-orange-50/50 border border-orange-100 rounded-md p-3 text-center cursor-pointer hover:bg-orange-50 transition-colors">
                                                    <p className="text-xs font-semibold text-orange-600 uppercase flex items-center justify-center gap-1 mb-2">
                                                        <Activity className="h-3.5 w-3.5" /> Start Data Collection
                                                    </p>
                                                    <div className="flex justify-between text-[10px] text-muted-foreground">
                                                        <span><strong className="block text-foreground text-sm">0</strong>Total Farms</span>
                                                        <span><strong className="block text-foreground text-sm">0%</strong>Data Progress</span>
                                                        <span><strong className="block text-foreground text-sm">0%</strong>Field Activity</span>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Map Container */}
                <div className="flex-1 relative z-0">
                    <MapContainer 
                        center={[22.0, 79.0]} 
                        zoom={5} 
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                    >
                        {/* CartoDB Positron - Light theme map highly matching the screenshots */}
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            subdomains='abcd'
                            maxZoom={19}
                        />
                        <MapController center={mapCenter} zoom={mapZoom} />
                        
                        {activeMapPoints.map((point) => (
                            <CircleMarker
                                key={point.id}
                                center={point.coords}
                                pathOptions={{ 
                                    fillColor: getColor(point.acreage), 
                                    color: getColor(point.acreage),
                                    fillOpacity: 0.6,
                                    weight: 2
                                }}
                                radius={getRadius(point.acreage)}
                                eventHandlers={{
                                    click: () => {
                                        if (view === 'national') {
                                            handleStateClick(point as StateData);
                                        }
                                    }
                                }}
                            >
                                <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                                    <div className="text-sm font-semibold mb-1">{point.name}</div>
                                    <div className="text-xs text-muted-foreground">Acreage: <span className="font-medium text-foreground">{point.acreage.toLocaleString()} Ha</span></div>
                                    <div className="text-xs text-muted-foreground">{view === 'national' ? 'Past Yield' : 'Yield'}: <span className="font-medium text-foreground">{point.yield} T/Ha</span></div>
                                </Tooltip>
                            </CircleMarker>
                        ))}
                    </MapContainer>

                    {/* View Controls Overlay */}
                    <div className="absolute top-4 left-6 z-[400] flex flex-col gap-2">
                        {view !== 'national' && (
                            <div className="bg-card rounded-full shadow-md border px-3 py-1.5 flex items-center text-sm font-medium animate-in fade-in cursor-pointer hover:bg-accent" onClick={handleBackToNational}>
                                <span className="text-green-700">{selectedState?.name}</span>
                                <span className="text-muted-foreground mx-1">•</span>
                                <span className="text-muted-foreground font-normal">State View</span>
                            </div>
                        )}
                        <div className="flex flex-col bg-card rounded-md shadow-md border py-1 w-10">
                            <button className="h-8 flex items-center justify-center hover:bg-accent border-b border-border/50 text-xl font-light">+</button>
                            <button className="h-8 flex items-center justify-center hover:bg-accent text-xl font-light">−</button>
                        </div>
                    </div>

                    {/* Legend Overlay */}
                    <div className="absolute bottom-6 left-6 z-[400] bg-card rounded-lg shadow-md border p-3">
                        <h4 className="text-xs font-semibold mb-2">Acreage Density</h4>
                        <div className="flex gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-yellow-400" /> Low</div>
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-orange-500" /> Medium</div>
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500" /> High</div>
                        </div>
                    </div>
                </div>

                {/* Right Panel Overlay */}
                <div className="w-[420px] bg-card shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] border-l z-[400] flex flex-col pt-2 pb-0 shrink-0">
                    {/* National View Panel */}
                    {view === 'national' && (
                        <div className="flex flex-col h-full animate-in fade-in duration-300">
                            <div className="p-5 pb-3">
                                <h2 className="font-bold text-base mb-1">National Tomato Crop Planning</h2>
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <span>15 states</span> • <span>362,400 Ha</span> • <span>~41 potential clusters</span>
                                </p>
                            </div>
                            <div className="px-5 pb-4 flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search states..." 
                                        className="bg-muted/50 border-transparent pl-9 h-9 text-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                                    <Download className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-12 px-5 py-2 border-y bg-muted/30 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                <div className="col-span-4">State</div>
                                <div className="col-span-3 text-right">Est. Acreage</div>
                                <div className="col-span-3 text-right">Past Yield</div>
                                <div className="col-span-2 text-right">Clusters</div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto min-h-0">
                                <div className="divide-y divide-border/50">
                                    {statesData
                                        .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                        .map((state) => (
                                        <div 
                                            key={state.id} 
                                            onClick={() => handleStateClick(state)}
                                            className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-accent/50 cursor-pointer transition-colors"
                                        >
                                            <div className="col-span-4 font-medium text-sm">{state.name}</div>
                                            <div className="col-span-3 text-right text-sm text-muted-foreground">{state.acreage.toLocaleString()} Ha</div>
                                            <div className="col-span-3 text-right text-sm text-muted-foreground">{state.yield} T/Ha</div>
                                            <div className="col-span-2 flex justify-end">
                                                <Badge variant="secondary" className="bg-green-100 hover:bg-green-100 text-green-800 font-semibold border-transparent">{state.clusters}</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* State & Cluster View Panel */}
                    {(view === 'state' || view === 'cluster') && selectedState && (
                        <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
                            <div className="p-5 pb-0 border-b">
                                <div className="flex items-center gap-2 mb-6">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 -ml-2" onClick={handleBackToNational}>
                                        <ChevronLeft className="h-5 w-5" />
                                    </Button>
                                    <h2 className="font-bold text-lg">{selectedState.name} Tomato Planning</h2>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <Card className="shadow-sm">
                                        <CardContent className="p-3">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Est. Acreage</p>
                                            <p className="text-xl font-bold text-green-700">{selectedState.acreage.toLocaleString()} Ha</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="shadow-sm">
                                        <CardContent className="p-3">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Avg Past Yield</p>
                                            <p className="text-xl font-bold text-blue-600">{selectedState.yield} T/Ha</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="shadow-sm">
                                        <CardContent className="p-3">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Districts</p>
                                            <p className="text-xl font-bold text-orange-500">10</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="shadow-sm">
                                        <CardContent className="p-3">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Expected Clusters</p>
                                            <p className="text-xl font-bold text-emerald-500">{selectedState.clusters}</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {view === 'state' && (
                                    <div className="mb-4">
                                        <Button 
                                            onClick={handleEnableClusterMode}
                                            variant="secondary" 
                                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 justify-start gap-2 h-10 border border-slate-200"
                                        >
                                            <Layers className="h-4 w-4 text-slate-500" /> Enable Cluster Mode
                                        </Button>
                                    </div>
                                )}
                                
                                {view === 'cluster' && (
                                    <div className="mb-6">
                                        <div className="w-full bg-green-800 text-white rounded-md flex items-center gap-2 h-10 px-4 font-medium shadow-md">
                                            <Layers className="h-4 w-4" opacity={0.8} /> Cluster Mode ON
                                        </div>
                                        
                                        <div className="mt-4 bg-green-50/80 border border-green-200 rounded-lg p-4 animate-in fade-in slide-in-from-bottom-2">
                                            <p className="text-xs font-bold text-green-700 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                                <Star className="h-3.5 w-3.5 fill-green-700" /> Recommended Cluster
                                            </p>
                                            <h3 className="text-lg font-bold text-gray-900 mb-2">TG-TOM-CLO1</h3>
                                            <p className="text-sm text-gray-600 leading-relaxed mb-3">
                                                Highest acreage density ({clusterData[0].acreage.toLocaleString()} Ha), excellent crop 
                                                health (89%), 74% irrigation coverage, and proximity to Hyderabad APMC market (32 km). 
                                                Strong NDVI index of 0.71 indicates healthy vegetative growth.
                                            </p>
                                            <div className="flex items-center gap-4 text-xs">
                                                <div><span className="text-muted-foreground mr-1">Acreage:</span><strong className="text-gray-900">{clusterData[0].acreage.toLocaleString()} Ha</strong></div>
                                                <div><span className="text-muted-foreground mr-1">Market:</span><strong className="text-gray-900">Hyderabad APMC</strong></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* State Drill Down - District Table */}
                            {view === 'state' && (
                                <>
                                    <div className="px-5 py-3 flex gap-2 border-b">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                placeholder="Search districts..." 
                                                className="bg-muted/50 border-transparent pl-9 h-9 text-sm"
                                            />
                                        </div>
                                        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                                            <Download className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-12 px-5 py-2 border-b bg-muted/30 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                        <div className="col-span-3">District</div>
                                        <div className="col-span-2">Acreage</div>
                                        <div className="col-span-3">Soil</div>
                                        <div className="col-span-2">Water</div>
                                        <div className="col-span-2 text-right">Yield</div>
                                    </div>
                                    
                                    <div className="flex-1 overflow-y-auto min-h-0">
                                        <div className="divide-y divide-border/50 pb-6">
                                            {odishaDistricts.map((district) => (
                                                <div 
                                                    key={district.id} 
                                                    className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-accent/50 transition-colors"
                                                >
                                                    <div className="col-span-3 font-semibold text-sm text-gray-900">{district.name}</div>
                                                    <div className="col-span-2 text-xs text-muted-foreground">{district.acreage.toLocaleString()} Ha</div>
                                                    <div className="col-span-3 text-xs text-muted-foreground pr-2">{district.soil}</div>
                                                    <div className="col-span-2 text-xs text-muted-foreground">{district.water}</div>
                                                    <div className="col-span-2 text-right text-xs font-medium text-gray-900">{district.yield} <span className="text-[10px] text-muted-foreground font-normal">T/Ha</span></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
