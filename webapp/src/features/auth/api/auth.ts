import api from '@/lib/api'

export interface LoginResponse {
    message: string
    otpSent: boolean
}

export interface VerifyOtpResponse {
    accessToken: string
    refreshToken: string
    user: {
        id: string
        name: string
        role: string
        mobile: string
    }
}

export interface DirectLoginResponse {
    accessToken: string
    refreshToken: string
    user: {
        id: string
        name: string
        role: string
        mobile: string
    }
}

/** Send OTP to mobile number */
export async function sendOtp(mobile: string): Promise<LoginResponse> {
    const { data } = await api.post('/auth/login', { mobile })
    return data
}

/** Verify OTP and get tokens */
export async function verifyOtp(mobile: string, otp: string): Promise<VerifyOtpResponse> {
    const { data } = await api.post('/auth/verify-otp', { mobile, otp })
    return data
}

/** Direct login (dev mode — skip OTP) */
export async function directLogin(mobile: string, name?: string, role?: string): Promise<DirectLoginResponse> {
    const { data } = await api.post('/auth/direct-login', { mobile, name, role })
    return data
}

/** Fetch user profile */
export async function getProfile() {
    const { data } = await api.get('/auth/profile')
    return data
}

/** Logout */
export async function logout() {
    const { data } = await api.post('/auth/logout')
    return data
}
