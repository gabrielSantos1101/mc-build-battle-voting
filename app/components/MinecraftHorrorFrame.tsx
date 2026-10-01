import React from 'react'
import type { FrameTheme } from '~/lib/supabase'
import { cn } from '~/lib/cn'

interface FrameConfig {
  label: string
  image: string
  borderColor: string
  glowColor: string
  accentColor: string
  // Área interna onde o conteúdo do card aparece (sob o frame)
  inset: {
    top: string
    bottom: string
    left: string
    right: string
  }
}

export const FRAME_CONFIGS: Record<FrameTheme, FrameConfig> = {
  'warden-sculk': {
    label: 'Deep Dark / Warden',
    image: '/frames/Warden-frame.webp',
    borderColor: '#00c9a7',
    glowColor: 'rgba(0, 201, 167, 0.6)',
    accentColor: '#00e5ff',
    inset: { top: '18%', bottom: '13%', left: '13%', right: '13%' },
  },
  'pale-garden': {
    label: 'Pale Garden / Creaking',
    image: '/frames/Pale-garden-frame.webp',
    borderColor: '#c8c8b0',
    glowColor: 'rgba(255, 140, 0, 0.6)',
    accentColor: '#ff8c00',
    inset: { top: '16%', bottom: '13%', left: '13%', right: '13%' },
  },
  'jack-pumpkin': {
    label: 'Jack-o-Lantern & Soul Fire',
    image: '/frames/Jack-o-Lanter-frame.webp',
    borderColor: '#ff7800',
    glowColor: 'rgba(255, 120, 0, 0.6)',
    accentColor: '#00e5ff',
    inset: { top: '18%', bottom: '13%', left: '13%', right: '13%' },
  },
  'wither': {
    label: 'Wither Boss',
    image: '/frames/Wither-boss-frame.webp',
    borderColor: '#a0a0ff',
    glowColor: 'rgba(160, 160, 255, 0.6)',
    accentColor: '#ffd700',
    inset: { top: '18%', bottom: '14%', left: '13%', right: '13%' },
  },
  'ender-dragon': {
    label: 'Ender Dragon',
    image: '/frames/Ender-dragon-frame.webp',
    borderColor: '#9d50db',
    glowColor: 'rgba(157, 80, 219, 0.6)',
    accentColor: '#d2a8ff',
    inset: { top: '19%', bottom: '14%', left: '13%', right: '13%' },
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
      className={cn('relative select-none transition-transform duration-200 cursor-pointer', className)}
      style={{
        filter: selected
          ? `drop-shadow(0 0 25px ${config.glowColor})`
          : 'drop-shadow(0 10px 25px rgba(0,0,0,0.95))',
      }}
    >
      {/* Container com proporção do card */}
      <div className="relative w-full aspect-[3/4.2]">

        {/* Conteúdo do card na área interna (fica ATRÁS do frame) */}
        <div
          className="absolute z-10 flex flex-col justify-between p-10"
          style={{
            top: config.inset.top,
            bottom: config.inset.bottom,
            left: config.inset.left,
            right: config.inset.right,
          }}
        >
          {children}
        </div>

        {/* Frame ilustrado por CIMA do conteúdo (z-20) — quando o verde for removido
            o centro ficará transparente e o conteúdo aparece através dele */}
        <img
          src={config.image}
          alt={config.label}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-20"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
    </div>
  )
}

export function getFrameLabel(theme: FrameTheme): string {
  return FRAME_CONFIGS[theme]?.label ?? theme
}
