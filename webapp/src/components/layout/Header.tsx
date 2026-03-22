import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import { cn, getInitials } from '@/lib/utils'
import { Button } from '../ui/button'
import {
    Bell,
    Menu,
    Search,
    Settings,
    LogOut,
    User,
    Sprout,
} from 'lucide-react'

export function Header() {
    const { user, logout } = useAuthStore()
    const { unreadNotifications, toggleSidebar } = useAppStore()

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-4 lg:px-6">
            {/* Mobile menu button */}
            <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={toggleSidebar}
            >
                <Menu className="h-5 w-5" />
            </Button>

            {/* Mobile logo */}
            <Link to="/dashboard" className="flex items-center gap-2 lg:hidden">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                    <Sprout className="h-5 w-5 text-white" />
                </div>
                <span className="font-semibold">CropFarm</span>
            </Link>

            {/* Search (desktop) */}
            <div className="hidden lg:flex flex-1 max-w-md">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="search"
                        placeholder="Search farms, crops, reports..."
                        className={cn(
                            'w-full h-10 rounded-lg border border-input bg-background pl-10 pr-4',
                            'text-sm placeholder:text-muted-foreground',
                            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
                        )}
                    />
                </div>
            </div>

            {/* Right side actions */}
            <div className="ml-auto flex items-center gap-2">
                {/* Search button (mobile) */}
                <Button variant="ghost" size="icon" className="lg:hidden">
                    <Search className="h-5 w-5" />
                </Button>

                {/* Notifications */}
                <Link to="/notifications">
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        {unreadNotifications > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                                {unreadNotifications > 9 ? '9+' : unreadNotifications}
                            </span>
                        )}
                    </Button>
                </Link>

                {/* User menu */}
                <div className="flex items-center gap-3 border-l pl-4 ml-2">
                    <div className="hidden md:block text-right">
                        <p className="text-sm font-medium">{user?.name || 'User'}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                            {user?.role?.toLowerCase().replace('_', ' ') || 'Farmer'}
                        </p>
                    </div>
                    <div className="relative group">
                        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium text-sm">
                            {user?.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="h-full w-full rounded-full object-cover"
                                />
                            ) : (
                                getInitials(user?.name || 'U')
                            )}
                        </button>

                        {/* Dropdown */}
                        <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border bg-card shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                            <div className="p-2">
                                <Link
                                    to="/profile"
                                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                                >
                                    <User className="h-4 w-4" />
                                    Profile
                                </Link>
                                <Link
                                    to="/settings"
                                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                                >
                                    <Settings className="h-4 w-4" />
                                    Settings
                                </Link>
                                <hr className="my-2" />
                                <button
                                    onClick={logout}
                                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}
