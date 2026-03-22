import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'

// Auth pages
import { LoginPage } from '@/features/auth/pages/LoginPage'

// Feature pages
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { FarmsPage } from '@/features/farms/pages/FarmsPage'
import { FarmDetailPage } from '@/features/farms/pages/FarmDetailPage'
import { CropsPage } from '@/features/crops/pages/CropsPage'
import { WeatherPage } from '@/features/weather/pages/WeatherPage'
import { PestReportsPage } from '@/features/pest/pages/PestReportsPage'
import { SoilReportsPage } from '@/features/soil/pages/SoilReportsPage'
import { NotificationsPage } from '@/features/notifications/pages/NotificationsPage'
import { DDEPage } from '@/features/dde/pages/DDEPage'
import { IntegrationsPage } from '@/features/integrations/pages/IntegrationsPage'
import { CropPlanDashboard } from '@/features/dashboard/pages/CropPlanDashboard'

export const router = createBrowserRouter([
    // Public routes
    {
        path: '/login',
        element: <LoginPage />,
    },

    // Protected routes with app layout
    {
        path: '/',
        element: (
            <ProtectedRoute>
                <AppLayout />
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: <Navigate to="/dashboard" replace />,
            },
            {
                path: 'dashboard',
                element: <DashboardPage />,
            },
            {
                path: 'farms',
                element: <FarmsPage />,
            },
            {
                path: 'farms/:farmId',
                element: <FarmDetailPage />,
            },
            {
                path: 'crops',
                element: <CropsPage />,
            },
            {
                path: 'weather',
                element: <WeatherPage />,
            },
            {
                path: 'pest',
                element: <PestReportsPage />,
            },
            {
                path: 'soil',
                element: <SoilReportsPage />,
            },
            {
                path: 'notifications',
                element: <NotificationsPage />,
            },
            {
                path: 'dde',
                element: <DDEPage />,
            },
            {
                path: 'integrations',
                element: <IntegrationsPage />,
            },
            {
                path: 'admin/crop-plan',
                element: <CropPlanDashboard />,
            },
        ],
    },

    // Catch-all redirect
    {
        path: '*',
        element: <Navigate to="/dashboard" replace />,
    },
])
