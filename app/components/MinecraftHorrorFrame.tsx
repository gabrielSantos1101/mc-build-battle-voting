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
    image: '/frames/warden-sculk-cropped.png',
    borderColor: '#00c9a7',
    glowColor: 'rgba(0, 201, 167, 0.4)',
    accentColor: '#00e5ff',
    outset: { top: '-24px', bottom: '-20px', x: '-16px' },
  },
  'pale-garden': {
    label: 'Pale Garden / Creaking',
    image: '/frames/pale-garden.jpg',
    borderColor: '#8c8c79',
    glowColor: 'rgba(255, 140, 0, 0.4)',
    accentColor: '#ff8c00',
    outset: { top: '-20px', bottom: '-20px', x: '-18px' },
  },
  'jack-pumpkin': {
    label: 'Jack-o-Lantern & Soul Fire',
    image: '/frames/jack-pumpkin.jpg',
    borderColor: '#ff7800',
    glowColor: 'rgba(255, 120, 0, 0.4)',
    accentColor: '#00e5ff',
    outset: { top: '-24px', bottom: '-20px', x: '-18px' },
  },
  'wither': {
    label: 'Wither Boss',
    image: '/frames/wither.jpg',
    borderColor: '#555555',
    glowColor: 'rgba(160, 160, 255, 0.4)',
    accentColor: '#ffd700',
    outset: { top: '-24px', bottom: '-22px', x: '-16px' },
  },
  'ender-dragon': {
    label: 'Ender Dragon',
    image: '/frames/ender-dragon.jpg',
    borderColor: '#7928ca',
    glowColor: 'rgba(157, 80, 219, 0.4)',
    accentColor: '#d2a8ff',
    outset: { top: '-26px', bottom: '-22px', x: '-16px' },
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
      className={`relative select-none transition-transform duration-200 hover:-translate-y-1.5 cursor-pointer my-4 ${className}`}
      style={{
        filter: selected
          ? `drop-shadow(0 0 25px ${config.glowColor})`
          : 'drop-shadow(0 8px 20px rgba(0,0,0,0.85))',
      }}
    >
      {/* 1. CORPO INTERNO DO CARD - Contém 100% do conteúdo com segurança */}
      <div
        className="relative w-full rounded-sm p-3.5 flex flex-col justify-between z-10"
        style={{
          background: 'linear-gradient(180deg, #0f0d1a 0%, #08070d 100%)',
          border: `3px solid ${config.borderColor}`,
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.95), 0 4px 15px rgba(0,0,0,0.8)',
        }}
      >
        {children}
      </div>

      {/* 2. MOLDURA PROJETADA PARA FORA (OVERLAY) - Fica por cima e expande para além do card */}
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
            // Suave máscara central para que o conteúdo interno brilhe com clareza
            filter: 'contrast(1.05)',
          }}
        />
      </div>
    </div>
  )
}

export function getFrameLabel(theme: FrameTheme): string {
  return FRAME_CONFIGS[theme]?.label ?? theme
}
