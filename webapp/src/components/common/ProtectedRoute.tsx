import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Spinner } from '@/components/ui/spinner'
import type { UserRole } from '@/types'

interface ProtectedRouteProps {
    children: React.ReactNode
    allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, user } = useAuthStore()
    const location = useLocation()

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Spinner size="lg" />
            </div>
        )
    }

    if (!isAuthenticated) {
        // Redirect to login page with return URL
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    // Check role-based access
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // User doesn't have required role, redirect to dashboard
        return <Navigate to="/dashboard" replace />
    }

    return <>{children}</>
}
