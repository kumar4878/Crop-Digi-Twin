import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SpinnerProps {
    size?: "sm" | "default" | "lg"
    className?: string
}

const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-6 w-6",
    lg: "h-8 w-8",
}

export function Spinner({ size = "default", className }: SpinnerProps) {
    return (
        <Loader2
            className={cn("animate-spin text-primary", sizeClasses[size], className)}
        />
    )
}

interface LoadingOverlayProps {
    message?: string
}

export function LoadingOverlay({ message = "Loading..." }: LoadingOverlayProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
                <Spinner size="lg" />
                <p className="text-sm text-muted-foreground">{message}</p>
            </div>
        </div>
    )
}

interface LoadingCardProps {
    className?: string
}

export function LoadingCard({ className }: LoadingCardProps) {
    return (
        <div
            className={cn(
                "flex h-32 items-center justify-center rounded-lg border bg-card",
                className
            )}
        >
            <Spinner />
        </div>
    )
}
