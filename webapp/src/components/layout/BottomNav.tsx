import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    MapPin,
    Wheat,
    CloudSun,
    Bug,
} from 'lucide-react'

const navItems = [
    { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { path: '/farms', label: 'Farms', icon: MapPin },
    { path: '/crops', label: 'Crops', icon: Wheat },
    { path: '/weather', label: 'Weather', icon: CloudSun },
    { path: '/pest', label: 'Pests', icon: Bug },
]

export function BottomNav() {
    const location = useLocation()

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t lg:hidden">
            <div className="flex items-center justify-around h-16 px-2">
                {navItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path)
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={cn(
                                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]',
                                isActive
                                    ? 'text-primary'
                                    : 'text-muted-foreground'
                            )}
                        >
                            <item.icon
                                className={cn(
                                    'h-5 w-5 transition-transform',
                                    isActive && 'scale-110'
                                )}
                            />
                            <span className="text-xs font-medium">{item.label}</span>
                        </NavLink>
                    )
                })}
            </div>
            {/* Safe area for iOS */}
            <div className="h-safe-area-inset-bottom bg-card" />
        </nav>
    )
}
