import React from 'react'

interface TrophyBadgeProps {
  place: 1 | 2 | 3
  size?: 'sm' | 'md' | 'lg'
}

const TROPHY_CONFIGS = {
  1: { color: '#ffd700', label: '1°', icon: '★', glow: '#ffd70080' },
  2: { color: '#b8d4ff', label: '2°', icon: '◆', glow: '#b8d4ff60' },
  3: { color: '#cd7f32', label: '3°', icon: '▲', glow: '#cd7f3260' },
}

export function TrophyBadge({ place, size = 'md' }: TrophyBadgeProps) {
  const config = TROPHY_CONFIGS[place]
  const dim = size === 'sm' ? 28 : size === 'md' ? 40 : 56
  const fontSize = size === 'sm' ? 8 : size === 'md' ? 12 : 16

  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: dim,
        height: dim,
        background: '#111',
        border: `3px solid ${config.color}`,
        boxShadow: `0 0 12px ${config.glow}`,
        fontFamily: "'Press Start 2P', monospace",
        fontSize,
        color: config.color,
        imageRendering: 'pixelated',
      }}
    >
      {config.icon}
    </div>
  )
}