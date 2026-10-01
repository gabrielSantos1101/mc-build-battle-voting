import React from 'react'
import type { FrameTheme } from '~/lib/supabase'

interface FrameConfig {
  label: string
  image: string
  borderColor: string
  glowColor: string
  accentColor: string
  // Margens de projeção para fora do card (top, bottom, sides)
  outset: {
    top: string
    bottom: string
    x: string
  }
}

export const FRAME_CONFIGS: Record<FrameTheme, FrameConfig> = {
  'warden-sculk': {
    label: 'Deep Dark / Warden',
    image: '/frames/warden-sculk-transparent.png',
    borderColor: '#00c9a7',
    glowColor: 'rgba(0, 201, 167, 0.4)',
    accentColor: '#00e5ff',
    outset: { top: '-18px', bottom: '-16px', x: '-14px' },
  },
  'pale-garden': {
    label: 'Pale Garden / Creaking',
    image: '/frames/pale-garden-transparent.png',
    borderColor: '#8c8c79',
    glowColor: 'rgba(255, 140, 0, 0.4)',
    accentColor: '#ff8c00',
    outset: { top: '-16px', bottom: '-16px', x: '-14px' },
  },
  'jack-pumpkin': {
    label: 'Jack-o-Lantern & Soul Fire',
    image: '/frames/jack-pumpkin-transparent.png',
    borderColor: '#ff7800',
    glowColor: 'rgba(255, 120, 0, 0.4)',
    accentColor: '#00e5ff',
    outset: { top: '-18px', bottom: '-16px', x: '-14px' },
  },
  'wither': {
    label: 'Wither Boss',
    image: '/frames/wither-transparent.png',
    borderColor: '#555555',
    glowColor: 'rgba(160, 160, 255, 0.4)',
    accentColor: '#ffd700',
    outset: { top: '-18px', bottom: '-18px', x: '-14px' },
  },
  'ender-dragon': {
    label: 'Ender Dragon',
    image: '/frames/ender-dragon-transparent.png',
    borderColor: '#7928ca',
    glowColor: 'rgba(157, 80, 219, 0.4)',
    accentColor: '#d2a8ff',
    outset: { top: '-20px', bottom: '-18px', x: '-14px' },
  },
}

interface MinecraftHorrorFrameProps {
  theme: FrameTheme
  children: React.ReactNode
  className?: string
  selected?: boolean
  onClick?: () => void
}

export function MinecraftHorrorFrame({
  theme,
  children,
  className = '',
  selected = false,
  onClick,
}: MinecraftHorrorFrameProps) {
  const config = FRAME_CONFIGS[theme] || FRAME_CONFIGS['jack-pumpkin']

  return (
    <div
      onClick={onClick}
      className={`relative select-none transition-transform duration-200 hover:-translate-y-1.5 cursor-pointer my-3 ${className}`}
      style={{
        filter: selected
          ? `drop-shadow(0 0 20px ${config.glowColor})`
          : 'drop-shadow(0 8px 20px rgba(0,0,0,0.85))',
      }}
    >
      {/* 1. CORPO INTERNO DO CARD - Fundo sólido de Deepslate com borda do tema */}
      <div
        className="relative w-full rounded-sm p-4 flex flex-col justify-between z-10"
        style={{
          background: 'linear-gradient(180deg, #100e1c 0%, #08070d 100%)',
          border: `2px solid ${config.borderColor}66`,
          boxShadow: 'inset 0 0 15px rgba(0,0,0,0.9), 0 4px 12px rgba(0,0,0,0.8)',
        }}
      >
        {children}
      </div>

      {/* 2. MOLDURA PROJETADA TRANSPARENTE (OVERLAY) */}
      <div
        className="absolute pointer-events-none select-none z-20"
        style={{
          top: config.outset.top,
          bottom: config.outset.bottom,
          left: config.outset.x,
          right: config.outset.x,
        }}
      >
        <img
          src={config.image}
          alt={config.label}
          className="w-full h-full object-fill pointer-events-none"
          style={{
            imageRendering: 'pixelated',
          }}
        />
      </div>
    </div>
  )
}

export function getFrameLabel(theme: FrameTheme): string {
  return FRAME_CONFIGS[theme]?.label ?? theme
}
