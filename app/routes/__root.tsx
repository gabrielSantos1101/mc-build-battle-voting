import { Outlet, createRootRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import '../styles.css'

export const Route = createRootRoute({
  validateSearch: z.object({
    color: z.string().optional(),
  }).optional(),
  component: RootComponent,
})

function RootComponent() {
  const [bgColor, setBgColor] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const rawColor = params.get('color')?.replace('#', '') ?? ''
      const hasColor = rawColor.length > 0
      return hasColor ? `#${rawColor}` : 'transparent'
    }
    return 'transparent'
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const rawColor = params.get('color')?.replace('#', '') ?? ''
    const hasColor = rawColor.length > 0
    const color = hasColor ? `#${rawColor}` : 'transparent'
    console.log('[Root] color param:', rawColor, '->', color)
    setBgColor(color)
  }, [])

  return (
    <div
      className="min-h-screen text-[#e0e0e0]"
      style={{ background: bgColor }}
    >
      <Outlet />
    </div>
  )
}

