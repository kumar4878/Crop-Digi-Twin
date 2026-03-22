# Crop Farming Platform - Frontend

A modern React-based web application for precision agriculture management.

## Tech Stack

- **React 18** + **Vite** + **TypeScript**
- **Tailwind CSS** with shadcn/ui components
- **React Router** for navigation
- **TanStack Query** for server state
- **Zustand** for global state
- **React Hook Form** + **Zod** for forms

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── ui/           # shadcn/ui components
│   ├── layout/       # Layout components
│   └── common/       # Shared components
├── features/
│   ├── auth/         # Authentication
│   ├── dashboard/    # Dashboard
│   ├── farms/        # Farm management
│   ├── crops/        # Crop lifecycle
│   ├── weather/      # Weather monitoring
│   ├── pest/         # Pest management
│   ├── soil/         # Soil reports
│   └── notifications/# Notifications
├── stores/           # Zustand stores
├── lib/              # Utilities
├── types/            # TypeScript types
└── router.tsx        # Route definitions
```

## Demo Login

- Enter any 10-digit mobile number
- Use OTP: `123456`
