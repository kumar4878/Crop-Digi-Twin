import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { useAppStore } from '@/stores/appStore'
import { cn } from '@/lib/utils'

export function AppLayout() {
    const { sidebarOpen } = useAppStore()

    return (
        <div className="min-h-screen bg-background">
            {/* Desktop Sidebar */}
            <Sidebar />

            {/* Main content area */}
            <div
                className={cn(
                    'transition-all duration-300',
                    // Responsive padding for sidebar
                    'lg:pl-20',
                    sidebarOpen && 'lg:pl-64'
                )}
            >
                {/* Header */}
                <Header />

                {/* Page content */}
                <main className="min-h-[calc(100vh-4rem)] pb-20 lg:pb-8">
                    <div className="container mx-auto p-4 lg:p-6">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Mobile bottom navigation */}
            <BottomNav />
        </div>
    )
}
