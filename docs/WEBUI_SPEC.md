# Crop Digital Twin — WebUI Specification

> **Version:** 1.0  
> **Last Updated:** 2026-03-11  
> **Aesthetic:** Enterprise SaaS · Clean · Modern · Rounded Cards · Minimalist Flat-Vector GIS

---

## 1. Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS 3 + `tailwindcss-animate` |
| Component Library | shadcn/ui (Radix UI primitives) |
| Animation | Framer Motion |
| Mapping | Leaflet + react-leaflet (Carto basemap) |
| Charts | Recharts |
| Routing | React Router v6 |
| State | React hooks (`useState`, `useCallback`, `useMemo`) |
| Icons | Lucide React |

---

## 2. Typography

| Role | Font | Weights | Usage |
|------|------|---------|-------|
| Display | `Space Grotesk` | 400–700 | Headings (h1–h6), brand, panel titles |
| Body | `Inter` | 300–800 | Body text, labels, tables, inputs |

**CSS Variables:**
```css
--font-display: 'Space Grotesk', sans-serif;
--font-body: 'Inter', sans-serif;
```

**Tailwind Classes:** `font-display`, `font-body`

---

## 3. Color System

All colors are defined as **HSL values** in CSS custom properties and consumed via `hsl(var(--token))`.

### 3.1 Core Palette (Light Mode)

| Token | HSL Value | Hex (approx) | Usage |
|-------|-----------|---------------|-------|
| `--background` | `140 10% 97%` | `#F4F6F4` | Page background, neutral grey |
| `--foreground` | `150 30% 10%` | `#121E14` | Primary text |
| `--card` | `0 0% 100%` | `#FFFFFF` | Card surfaces |
| `--card-foreground` | `150 30% 10%` | `#121E14` | Card text |
| `--primary` | `123 55% 24%` | `#1B5E20` | Deep Green — brand, CTAs, active states |
| `--primary-foreground` | `0 0% 98%` | `#FAFAFA` | Text on primary |
| `--secondary` | `200 70% 50%` | `#1E7FBF` | Deep Blue — secondary actions, info |
| `--secondary-foreground` | `0 0% 100%` | `#FFFFFF` | Text on secondary |
| `--muted` | `140 10% 93%` | `#ECEFEC` | Muted backgrounds |
| `--muted-foreground` | `150 10% 45%` | `#697069` | Subdued text, placeholders |
| `--accent` | `30 40% 35%` | `#7D6339` | Earth tone accent |
| `--accent-foreground` | `0 0% 98%` | `#FAFAFA` | Text on accent |
| `--destructive` | `0 72% 51%` | `#DC2626` | Error, destructive actions |
| `--border` | `140 10% 88%` | `#DEE1DE` | Borders, dividers |
| `--input` | `140 10% 88%` | `#DEE1DE` | Input borders |
| `--ring` | `123 55% 24%` | `#1B5E20` | Focus rings |

### 3.2 Semantic Colors

| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--success` | `142 70% 40%` | Positive states, crop health |
| `--warning` | `38 92% 50%` | Alerts, caution states |
| `--info` | `200 70% 50%` | Informational, secondary data |

### 3.3 Heatmap Gradient

Used for acreage choropleth visualization (Yellow → Red):

| Token | HSL Value | Hex (approx) | Level |
|-------|-----------|---------------|-------|
| `--heatmap-low` | `48 96% 53%` | `#FEF08A` | Low density |
| `--heatmap-mid` | `25 95% 53%` | `#F97316` | Medium density |
| `--heatmap-high` | `0 72% 51%` | `#EF4444` | High density |

### 3.4 Cluster Visualization Colors

Distinct colors per cluster for GIS planning mode:

| Cluster | Color | Hex |
|---------|-------|-----|
| CL01 | Green | `#16A34A` |
| CL02 | Blue | `#2563EB` |
| CL03 | Purple | `#9333EA` |
| CL04 | Orange | `#EA580C` |

### 3.5 Sidebar Theme

| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--sidebar-background` | `150 20% 12%` | Dark sidebar bg |
| `--sidebar-foreground` | `140 10% 90%` | Sidebar text |
| `--sidebar-primary` | `123 55% 40%` | Active sidebar icon |
| `--sidebar-accent` | `150 15% 18%` | Hover/active bg |
| `--sidebar-border` | `150 15% 20%` | Sidebar dividers |

### 3.6 Dark Mode

All tokens are overridden under `.dark` class. Key shifts:
- Background darkens to `150 20% 8%`
- Cards shift to `150 15% 12%`
- Primary brightens to `123 55% 40%`
- Borders darken to `150 10% 20%`

---

## 4. Spacing & Border Radius

| Token | Value |
|-------|-------|
| `--radius` | `0.625rem` (10px) |
| `border-radius-lg` | `var(--radius)` |
| `border-radius-md` | `calc(var(--radius) - 2px)` |
| `border-radius-sm` | `calc(var(--radius) - 4px)` |

Container: centered, `max-width: 1400px`, `padding: 2rem`

---

## 5. Shadows & Depth

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-card` | `0 1px 3px hsl(…/0.06), 0 1px 2px hsl(…/0.04)` | Default card elevation |
| `--shadow-elevated` | `0 10px 25px hsl(…/0.08), 0 4px 10px hsl(…/0.04)` | Hover/elevated cards |
| `--shadow-glow` | `0 0 20px hsl(123 55% 24% / 0.15)` | Primary glow accent |

---

## 6. Gradients

| Token | Definition | Usage |
|-------|-----------|-------|
| `--gradient-primary` | `linear-gradient(135deg, primary, primary-light)` | Buttons, brand accents |
| `--gradient-hero` | `linear-gradient(135deg, dark/0.85, primary/0.75)` | Hero overlays |
| `--gradient-card` | `linear-gradient(180deg, white, background)` | Subtle card bg |

---

## 7. Animations

### Tailwind Keyframes

| Name | Description |
|------|-------------|
| `accordion-down` | Expand accordion content (0.2s ease-out) |
| `accordion-up` | Collapse accordion content (0.2s ease-out) |
| `pulse-glow` | Pulsing scale + opacity effect (2s infinite) |
| `fade-in-up` | Fade in from 10px below (0.4s ease-out) |

### Framer Motion Patterns

- **Panel transitions:** `AnimatePresence` with `mode="wait"`, opacity fade
- **List items:** `layout` prop for smooth reordering
- **Sidebar modules:** `initial={{ opacity: 0, scale: 0.95 }}` → `animate={{ opacity: 1, scale: 1 }}`
- **Cluster panels:** Slide-in from left with `x: -320` → `x: 0`

---

## 8. Layout Architecture

```
┌─────────────────────────────────────────────────┐
│  TopNavbar (h-14, bg-card, border-b)            │
│  [Logo] [Crop ▾] [FY ▾] [Run Analysis]         │
├────┬────────────────────────────────────────────┤
│    │                                            │
│ S  │  Main Content Area                         │
│ i  │  ┌──────────────────────┬────────────────┐ │
│ d  │  │                      │                │ │
│ e  │  │   Leaflet Map        │  Right Panel   │ │
│ b  │  │   (flex-1)           │  (w-96/gis)    │ │
│ a  │  │                      │                │ │
│ r  │  └──────────────────────┴────────────────┘ │
│(w16)│                                           │
├────┴────────────────────────────────────────────┤
```

### Key Layout Rules
- **Full viewport:** `h-screen flex flex-col overflow-hidden`
- **Sidebar:** Fixed width `w-16`, dark theme, icon-only navigation
- **Top Navbar:** `h-14`, sticky, contains crop/FY selectors + Run Analysis CTA
- **Map:** `flex-1 relative`, fills remaining space
- **Right Panel (DataPanel):** `w-96`, scrollable, `gis-panel` class
- **Cluster Panel (left):** Animated slide-in, `w-80`, overlays map edge

---

## 9. Component Library (shadcn/ui)

### Installed Primitives

| Category | Components |
|----------|-----------|
| **Feedback** | Alert, AlertDialog, Toast, Toaster, Sonner, Progress, Skeleton |
| **Data Display** | Avatar, Badge, Card, HoverCard, Table, Separator |
| **Input** | Button, Checkbox, Input, Label, RadioGroup, Select, Slider, Switch, Textarea, Toggle, ToggleGroup, Calendar, DatePicker (react-day-picker), InputOTP |
| **Navigation** | Accordion, Breadcrumb, DropdownMenu, ContextMenu, Menubar, NavigationMenu, Pagination, Tabs |
| **Overlay** | Dialog, Drawer (vaul), Popover, Sheet, Tooltip, Command (cmdk) |
| **Layout** | AspectRatio, Collapsible, ResizablePanels, ScrollArea, Carousel (embla) |

### Custom Component Classes

| Class | Styles | Usage |
|-------|--------|-------|
| `.glass-card` | `bg-card/80 backdrop-blur-md border-border/50 rounded-xl` + card shadow | Map overlays, floating legends |
| `.stat-card` | `bg-card rounded-xl border p-4` + hover elevation | KPI metric cards |
| `.gis-panel` | `bg-card border-l overflow-y-auto` | Right-side data panels |
| `.nav-icon-btn` | `w-10 h-10 rounded-lg` + sidebar hover/active states | Sidebar navigation icons |

---

## 10. Map Specification

| Property | Value |
|----------|-------|
| Library | Leaflet 1.9 + react-leaflet 5 |
| Basemap | Carto Light (`cartodb-basemaps`) |
| Dark BG | `hsl(150 20% 12%)` |
| Center | `[22.5, 82.5]` (India) |
| Zoom | National: 5, State: 7–8, Cluster: 9–10 |

### View Modes

| Mode | Rendering |
|------|-----------|
| **National Heatmap** | Circle markers per state, sized by acreage, colored Yellow→Red |
| **State (District)** | Polygon boundaries, glow effects, district tooltips |
| **Cluster Mode** | Convex-hull polygons, village dot markers, centered 3-line labels, distinct cluster colors. Heatmap hidden. |

### Cluster Label Format
```
┌─────────────────┐
│  TG-TOM-CL01    │  (cluster name, bold, cluster color)
│  3 Villages      │  (count, grey)
│  14,200 Ha       │  (acreage, grey)
└─────────────────┘
```

---

## 11. Cluster Lifecycle Model

```
Stage 1: Planning       → ClusterSetupPanel (initialization tasks)
Stage 2: Onboarding     → ClusterSetupPanel (farmer registration)
Stage 3: Digitization   → ClusterAnalyticsPanel (farm mapping metrics)
Stage 4: Monitoring     → ClusterAnalyticsPanel (crop monitoring data)
Stage 5: Harvest        → ClusterAnalyticsPanel (yield tracking)
```

**Stage Detection Logic:** Based on `fieldMetrics` — zero farms/farmers = planning; farmers > 0 but no farms = onboarding; farms mapped but no monitoring = digitization; monitoring visits > 0 = monitoring.

---

## 12. Data Architecture

| Data File | Contents |
|-----------|----------|
| `cropData.ts` | State/district/cluster data, crops list, FY list, heat color/marker size helpers |
| `clusterData.ts` | `ManagedCluster` type, lifecycle stages, task templates, team assignments, `buildManagedClusters()` |

### Key Types
- `StateData` — National-level crop metrics per state
- `DistrictData` — District-level detail (Telangana)
- `ClusterData` — Base cluster definition
- `ManagedCluster` — Extended cluster with team, progress, timeline, metrics, tasks
- `ClusterStage` — `'planning' | 'onboarding' | 'digitization' | 'monitoring' | 'harvest'`

---

## 13. Routing

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `LoginPage` | Blurred satellite background login |
| `/dashboard` | `Dashboard` | Main application |
| `*` | `NotFound` | 404 fallback |

---

## 14. Leaflet CSS Overrides

```css
.leaflet-container        → full width/height, dark bg, body font
.leaflet-popup-*          → rounded-xl, card bg, card text, shadow-lg
.leaflet-control-zoom a   → card bg, foreground text, border
```

---

## 15. Design Principles

1. **Semantic tokens only** — Never use raw color values in components. Always reference design tokens.
2. **HSL everywhere** — All CSS variables store HSL channel values (no `#hex` in variables).
3. **Progressive disclosure** — Cluster panels show setup tasks before analytics, based on lifecycle stage.
4. **GIS-first** — Map is the primary interface; panels are secondary context.
5. **Enterprise clarity** — Clean borders, generous whitespace, subtle shadows, no decorative noise.
6. **Agricultural identity** — Deep greens, earth tones, satellite imagery accents on login.
