import React from 'react'
import type { FrameTheme } from '~/lib/supabase'

interface FrameConfig {
  label: string
  image: string
  borderColor: string
  glowColor: string
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
    image: '/frames/warden-sculk-cropped.png',
    borderColor: '#00c9a7',
    glowColor: 'rgba(0, 201, 167, 0.6)',
    inset: { top: '15%', bottom: '12%', left: '13%', right: '13%' },
  },
  'pale-garden': {
    label: 'Pale Garden / Creaking',
    image: '/frames/pale-garden-cropped.png',
    borderColor: '#c8c8b0',
    glowColor: 'rgba(255, 140, 0, 0.6)',
    inset: { top: '14%', bottom: '12%', left: '14%', right: '14%' },
  },
  'jack-pumpkin': {
    label: 'Jack-o-Lantern & Soul Fire',
    image: '/frames/jack-pumpkin-cropped.png',
    borderColor: '#ff7800',
    glowColor: 'rgba(255, 120, 0, 0.6)',
    inset: { top: '15%', bottom: '12%', left: '13%', right: '13%' },
  },
  'wither': {
    label: 'Wither Boss',
    image: '/frames/wither-cropped.png',
    borderColor: '#a0a0ff',
    glowColor: 'rgba(160, 160, 255, 0.6)',
    inset: { top: '15%', bottom: '14%', left: '13%', right: '13%' },
  },
  'ender-dragon': {
    label: 'Ender Dragon',
    image: '/frames/ender-dragon-cropped.png',
    borderColor: '#9d50db',
    glowColor: 'rgba(157, 80, 219, 0.6)',
    inset: { top: '16%', bottom: '14%', left: '13%', right: '13%' },
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
      className={`relative select-none transition-transform duration-200 hover:-translate-y-1.5 cursor-pointer ${className}`}
      style={{
        filter: selected
          ? `drop-shadow(0 0 25px ${config.glowColor})`
          : 'drop-shadow(0 10px 25px rgba(0,0,0,0.95))',
      }}
    >
      {/* Container Exato do Card - sem respiro cinza ao redor */}
      <div className="relative w-full aspect-[3/4.2] overflow-hidden rounded bg-transparent">
        {/* Moldura Ilustrada Croppada Preenchendo Exatamente */}
        <img
          src={config.image}
          alt={config.label}
          className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Janela Interna de Conteúdo */}
        <div
          className="absolute z-10 flex flex-col justify-between"
          style={{
            top: config.inset.top,
            bottom: config.inset.bottom,
            left: config.inset.left,
            right: config.inset.right,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export function getFrameLabel(theme: FrameTheme): string {
  return FRAME_CONFIGS[theme]?.label ?? theme
}
