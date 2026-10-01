import { Outlet, createRootRoute } from '@tanstack/react-router'
import React from 'react'
import '../styles.css'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <div className="min-h-screen bg-[#0e0d13] text-[#e0e0e0]">
      <Outlet />
    </div>
  )
}

