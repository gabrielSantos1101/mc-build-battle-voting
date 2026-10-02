import { Outlet, createRootRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { z } from 'zod'
import '../styles.css'

export const Route = createRootRoute({
  validateSearch: z.object({
    color: z.string().optional(),
  }).optional(),
  component: RootComponent,
})

function RootComponent() {
  const search = Route.useSearch()
  const rawColor = search.color?.replace('#', '') ?? ''
  const hasColor = rawColor.length > 0
  const bgColor = hasColor ? `#${rawColor}` : 'transparent'

  return (
    <div 
      className="min-h-screen text-[#e0e0e0]"
      style={{ background: bgColor }}
    >
      <Outlet />
    </div>
  )
}

