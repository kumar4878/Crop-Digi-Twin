import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
    return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
    return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date))
}

export function formatArea(acres: number): string {
    if (acres >= 1) {
        return `${acres.toFixed(2)} acres`
    }
    return `${(acres * 43560).toFixed(0)} sq ft`
}

export function formatTemperature(celsius: number): string {
    return `${Math.round(celsius)}°C`
}

export function formatPercentage(value: number): string {
    return `${Math.round(value)}%`
}

export function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

export function truncate(str: string, length: number): string {
    if (str.length <= length) return str
    return str.slice(0, length) + '...'
}

export function getSeverityColor(severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): string {
    const colors = {
        LOW: 'text-green-600 bg-green-100',
        MEDIUM: 'text-yellow-600 bg-yellow-100',
        HIGH: 'text-orange-600 bg-orange-100',
        CRITICAL: 'text-red-600 bg-red-100',
    }
    return colors[severity]
}

export function getStageColor(stage: string): string {
    const colors: Record<string, string> = {
        SOWING: 'bg-amber-500',
        GERMINATION: 'bg-lime-500',
        VEGETATIVE: 'bg-green-500',
        FLOWERING: 'bg-pink-500',
        FRUITING: 'bg-orange-500',
        MATURATION: 'bg-yellow-500',
        HARVEST: 'bg-emerald-600',
    }
    return colors[stage] || 'bg-gray-500'
}
