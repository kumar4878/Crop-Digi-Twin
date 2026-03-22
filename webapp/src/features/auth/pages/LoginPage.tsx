import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sprout, User, Shield, BarChart3, Settings } from 'lucide-react'
import { directLogin } from '@/features/auth/api/auth'
import type { User as UserType, UserRole } from '@/types'

interface RoleOption {
    role: UserRole
    label: string
    description: string
    icon: React.ReactNode
    color: string
    user: Omit<UserType, 'preferences'> & { preferences: UserType['preferences'] }
}

const STATIC_USERS: RoleOption[] = [
    {
        role: 'FARMER',
        label: 'Farmer',
        description: 'Manage farms, fields, crops, and view weather & advisories',
        icon: <Sprout className="h-8 w-8" />,
        color: 'from-green-500 to-emerald-600',
        user: {
            _id: 'farmer-001',
            mobile: '9876543210',
            email: 'farmer@cropfarm.dev',
            name: 'Rajesh Kumar',
            role: 'FARMER',
            status: 'ACTIVE',
            language: 'en',
            preferences: {
                notifications: { email: true, sms: true, push: true },
                theme: 'light',
                units: { temperature: 'celsius', area: 'acres', rainfall: 'mm' },
            },
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-03-20T00:00:00Z',
        },
    },
    {
        role: 'MANAGER',
        label: 'Manager',
        description: 'Regional oversight, approvals, and team management',
        icon: <User className="h-8 w-8" />,
        color: 'from-blue-500 to-indigo-600',
        user: {
            _id: 'manager-001',
            mobile: '9876543211',
            email: 'manager@cropfarm.dev',
            name: 'Priya Sharma',
            role: 'MANAGER',
            status: 'ACTIVE',
            language: 'en',
            preferences: {
                notifications: { email: true, sms: true, push: true },
                theme: 'light',
                units: { temperature: 'celsius', area: 'acres', rainfall: 'mm' },
            },
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-03-20T00:00:00Z',
        },
    },
    {
        role: 'CXO',
        label: 'CXO',
        description: 'Enterprise dashboards, analytics, and strategic reports',
        icon: <BarChart3 className="h-8 w-8" />,
        color: 'from-purple-500 to-violet-600',
        user: {
            _id: 'cxo-001',
            mobile: '9876543212',
            email: 'cxo@cropfarm.dev',
            name: 'Anil Reddy',
            role: 'CXO',
            status: 'ACTIVE',
            language: 'en',
            preferences: {
                notifications: { email: true, sms: true, push: true },
                theme: 'light',
                units: { temperature: 'celsius', area: 'acres', rainfall: 'mm' },
            },
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-03-20T00:00:00Z',
        },
    },
    {
        role: 'ADMIN',
        label: 'Admin',
        description: 'Full system access, user management, and master data',
        icon: <Shield className="h-8 w-8" />,
        color: 'from-amber-500 to-orange-600',
        user: {
            _id: 'admin-001',
            mobile: '9876543213',
            email: 'admin@cropfarm.dev',
            name: 'Suresh Patel',
            role: 'ADMIN',
            status: 'ACTIVE',
            language: 'en',
            preferences: {
                notifications: { email: true, sms: true, push: true },
                theme: 'light',
                units: { temperature: 'celsius', area: 'acres', rainfall: 'mm' },
            },
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-03-20T00:00:00Z',
        },
    },
]

export function LoginPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const { login } = useAuthStore()

    const from = location.state?.from?.pathname || '/dashboard'

    const handleRoleLogin = async (option: RoleOption) => {
        try {
            // Call the backend dev-login route to get a real JWT for this user
            const response = await directLogin(option.user.mobile, option.user.name, option.user.role)
            // Save the real tokens in Zustand so API calls succeed
            login(response.user as any, response.accessToken, response.refreshToken)
            navigate(from, { replace: true })
        } catch (error) {
            console.error('Failed to login:', error)
            alert('Failed to login to backend. Is the server running?')
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-primary-500/20 to-transparent rounded-full blur-3xl" />
                <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-primary-400/10 to-transparent rounded-full blur-3xl" />
            </div>

            {/* Logo */}
            <div className="flex items-center gap-3 mb-8 z-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-500 shadow-lg shadow-primary-500/30">
                    <Sprout className="h-7 w-7 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">CropFarm</h1>
                    <p className="text-sm text-primary-100/80">Precision Agriculture</p>
                </div>
            </div>

            {/* Role Selection */}
            <Card className="w-full max-w-2xl z-10 shadow-2xl border-0 bg-white/95 dark:bg-gray-900 backdrop-blur-xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Welcome to CropFarm</CardTitle>
                    <CardDescription>Select a role to sign in (Development Mode)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {STATIC_USERS.map((option) => (
                            <button
                                key={option.role}
                                onClick={() => handleRoleLogin(option)}
                                className="group relative flex flex-col items-center p-6 rounded-xl border-2 border-transparent hover:border-primary/30 bg-muted/30 hover:bg-muted/60 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] text-center"
                            >
                                {/* Icon with gradient background */}
                                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${option.color} text-white shadow-lg mb-3 group-hover:scale-110 transition-transform`}>
                                    {option.icon}
                                </div>

                                <h3 className="text-lg font-semibold">{option.label}</h3>
                                <Badge variant="secondary" className="mt-1 mb-2 text-xs">{option.role}</Badge>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {option.description}
                                </p>

                                {/* User name hint */}
                                <p className="mt-3 text-xs text-muted-foreground/70">
                                    Login as <span className="font-medium">{option.user.name}</span>
                                </p>
                            </button>
                        ))}
                    </div>

                    {/* Dev mode notice */}
                    <div className="mt-6 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-center">
                        <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-300">
                            <Settings className="h-4 w-4" />
                            <span className="text-xs font-medium">Development Mode — No authentication required</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Footer */}
            <p className="mt-8 text-sm text-primary-100/60 z-10">
                © 2026 CropFarm. All rights reserved.
            </p>
        </div>
    )
}
