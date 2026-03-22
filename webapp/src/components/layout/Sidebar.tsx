import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import {
    LayoutDashboard,
    MapPin,
    Wheat,
    CloudSun,
    Bug,
    FlaskConical,
    Bell,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Sprout,
    Brain,
    Plug,
    Map
} from 'lucide-react'
import { Button } from '../ui/button'

const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/dde', label: 'Decision Engine', icon: Brain },
    { path: '/admin/crop-plan', label: 'Crop Plan', icon: Map },
    { path: '/farms', label: 'Farms', icon: MapPin },
    { path: '/crops', label: 'My Crops', icon: Wheat },
    { path: '/integrations', label: 'Integrations', icon: Plug },
    { path: '/weather', label: 'Weather', icon: CloudSun },
    { path: '/pest', label: 'Pest Reports', icon: Bug },
    { path: '/soil', label: 'Soil Reports', icon: FlaskConical },
    { path: '/notifications', label: 'Notifications', icon: Bell },
]

const bottomNavItems = [
    { path: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
    const { logout } = useAuthStore()
    const { sidebarOpen, toggleSidebar } = useAppStore()

    return (
        <aside
            className={cn(
                'fixed left-0 top-0 z-40 h-screen bg-card border-r transition-all duration-300 hidden lg:flex flex-col',
                sidebarOpen ? 'w-64' : 'w-20'
            )}
        >
            {/* Logo */}
            <div className="flex h-16 items-center justify-between px-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                        <Sprout className="h-6 w-6 text-white" />
                    </div>
                    {sidebarOpen && (
                        <span className="font-semibold text-lg">CropFarm</span>
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="h-8 w-8"
                >
                    {sidebarOpen ? (
                        <ChevronLeft className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4">
                <ul className="space-y-2">
                    {navItems.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) =>
                                    cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                                        isActive
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                    )
                                }
                            >
                                <item.icon className="h-5 w-5 shrink-0" />
                                {sidebarOpen && <span>{item.label}</span>}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Bottom section */}
            <div className="border-t p-4">
                <ul className="space-y-2">
                    {bottomNavItems.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) =>
                                    cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                                        isActive
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                    )
                                }
                            >
                                <item.icon className="h-5 w-5 shrink-0" />
                                {sidebarOpen && <span>{item.label}</span>}
                            </NavLink>
                        </li>
                    ))}
                    <li>
                        <button
                            onClick={logout}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                            <LogOut className="h-5 w-5 shrink-0" />
                            {sidebarOpen && <span>Logout</span>}
                        </button>
                    </li>
                </ul>
            </div>
        </aside>
    )
}
