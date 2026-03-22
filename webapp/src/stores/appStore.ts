import { create } from 'zustand'

interface AppState {
    // Sidebar state
    sidebarOpen: boolean
    setSidebarOpen: (open: boolean) => void
    toggleSidebar: () => void

    // Mobile bottom sheet
    bottomSheetOpen: boolean
    bottomSheetContent: React.ReactNode | null
    openBottomSheet: (content: React.ReactNode) => void
    closeBottomSheet: () => void

    // Global loading
    globalLoading: boolean
    setGlobalLoading: (loading: boolean) => void

    // Notifications
    unreadNotifications: number
    setUnreadNotifications: (count: number) => void
    incrementUnreadNotifications: () => void
    clearUnreadNotifications: () => void
}

export const useAppStore = create<AppState>((set) => ({
    // Sidebar
    sidebarOpen: true,
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

    // Bottom sheet
    bottomSheetOpen: false,
    bottomSheetContent: null,
    openBottomSheet: (content) => set({ bottomSheetOpen: true, bottomSheetContent: content }),
    closeBottomSheet: () => set({ bottomSheetOpen: false, bottomSheetContent: null }),

    // Global loading
    globalLoading: false,
    setGlobalLoading: (loading) => set({ globalLoading: loading }),

    // Notifications
    unreadNotifications: 0,
    setUnreadNotifications: (count) => set({ unreadNotifications: count }),
    incrementUnreadNotifications: () =>
        set((state) => ({ unreadNotifications: state.unreadNotifications + 1 })),
    clearUnreadNotifications: () => set({ unreadNotifications: 0 }),
}))
