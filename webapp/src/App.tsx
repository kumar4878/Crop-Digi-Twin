import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { router } from './router'
import { useEffect } from 'react'
import 'leaflet/dist/leaflet.css';
import { useAuthStore } from './stores/authStore'

function App() {
  const { setLoading } = useAuthStore()

  useEffect(() => {
    // Check for existing session on app load
    const accessToken = localStorage.getItem('accessToken')
    if (accessToken) {
      // In production, validate token with backend
      // For now, just mark as loaded
      setLoading(false)
    } else {
      setLoading(false)
    }
  }, [setLoading])

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

export default App
