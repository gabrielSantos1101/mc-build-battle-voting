import React from 'react'
import { getMinecraftAvatarUrl } from '~/lib/supabase'

// ============================================================
// Minecraft-style button
// ============================================================

interface MinecraftButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'pumpkin' | 'soul' | 'nether' | 'warden' | 'pale' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

const BUTTON_VARIANTS = {
  pumpkin: {
    bg: '#a04800',
    hover: '#c05a00',
    text: '#ffffff',
    shadow: '#ff780040',
    border: '#ff7800',
  },
  soul: {
    bg: '#004455',
    hover: '#005566',
    text: '#00e5ff',
    shadow: '#00e5ff40',
    border: '#00e5ff',
  },
  nether: {
    bg: '#3d0070',
    hover: '#4d0090',
    text: '#ffffff',
    shadow: '#9d50db40',
    border: '#7928ca',
  },
  warden: {
    bg: '#004d3d',
    hover: '#006650',
    text: '#00c9a7',
    shadow: '#00c9a740',
    border: '#00c9a7',
  },
  pale: {
    bg: '#3a3a30',
    hover: '#4a4a40',
    text: '#c8c8b0',
    shadow: 'transparent',
    border: '#6e6e5c',
  },
  danger: {
    bg: '#6b0000',
    hover: '#880000',
    text: '#ff4444',
    shadow: '#ff000040',
    border: '#cc0000',
  },
}

const BUTTON_SIZES = {
  sm: { padding: '6px 12px', fontSize: '8px' },
  md: { padding: '10px 20px', fontSize: '10px' },
  lg: { padding: '14px 28px', fontSize: '12px' },
}

export function MinecraftButton({
  variant = 'pumpkin',
  size = 'md',
  isLoading = false,
  children,
  disabled,
  style,
  ...props
}: MinecraftButtonProps) {
  const v = BUTTON_VARIANTS[variant]
  const s = BUTTON_SIZES[size]
  const isDisabled = disabled || isLoading

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`mc-btn ${props.className ?? ''}`}
      style={{
        background: isDisabled ? '#2a2a2a' : v.bg,
        color: isDisabled ? '#666' : v.text,
        border: `3px solid ${isDisabled ? '#444' : v.border}`,
        boxShadow: isDisabled ? 'none' : `0 4px 0 ${v.border}88, 0 0 12px ${v.shadow}`,
        padding: s.padding,
        fontSize: s.fontSize,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.1s, transform 0.1s, box-shadow 0.1s',
        fontFamily: "'Press Start 2P', monospace",
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        imageRendering: 'pixelated',
        ...style,
      }}
    >
      {isLoading ? '...' : children}
    </button>
  )
}

// ============================================================
// Minecraft player head avatar
// ============================================================

interface PlayerHeadProps {
  nick: string
  size?: number
  className?: string
}

export function PlayerHead({ nick, size = 32, className = '' }: PlayerHeadProps) {
  const [error, setError] = React.useState(false)

  if (error) {
    // Fallback: colored square with first letter
    return (
      <div
        className={`flex items-center justify-center bg-[#2a2a2a] border-2 border-[#444] ${className}`}
        style={{
          width: size,
          height: size,
          fontFamily: "'Press Start 2P', monospace",
          fontSize: size * 0.35,
          color: '#ff7800',
          imageRendering: 'pixelated',
        }}
      >
        {nick.charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <img
      src={getMinecraftAvatarUrl(nick, size)}
      alt={`${nick}'s Minecraft avatar`}
      width={size}
      height={size}
      className={`${className}`}
      style={{ imageRendering: 'pixelated' }}
      onError={() => setError(true)}
    />
  )
}

// ============================================================
// Vote progress bar (Minecraft-style)
// ============================================================

interface VoteBarProps {
  percentage: number
  count: number
  color?: string
  animated?: boolean
}

export function VoteBar({ percentage, count, color = '#ff7800', animated = true }: VoteBarProps) {
  return (
    <div className="w-full">
      {/* Bar container */}
      <div
        className="w-full h-4 relative"
        style={{
          background: '#111',
          border: '2px solid #333',
          boxShadow: 'inset 0 2px 0 rgba(0,0,0,0.5)',
        }}
      >
        {/* Fill */}
        <div
          className="h-full absolute top-0 left-0"
          style={{
            width: `${percentage}%`,
            background: color,
            boxShadow: `0 0 8px ${color}80`,
            transition: animated ? 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
          }}
        />
        {/* Shine overlay */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: 'rgba(255,255,255,0.15)' }}
        />
      </div>
      {/* Stats */}
      <div className="flex justify-between mt-1">
        <span style={{ fontFamily: "'Press Start 2P'", fontSize: '7px', color: '#888' }}>
          {count} votos
        </span>
        <span style={{ fontFamily: "'Press Start 2P'", fontSize: '7px', color }}>
          {percentage}%
        </span>
      </div>
    </div>
  )
}

// ============================================================
// Trophy badge for podium
// ============================================================

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

// ============================================================
// Status badge for round
// ============================================================

interface StatusBadgeProps {
  status: 'draft' | 'active' | 'paused' | 'finished'
}

const STATUS_CONFIG = {
  draft: { label: 'Rascunho', color: '#888', bg: '#1a1a1a' },
  active: { label: '● Votação Aberta', color: '#00ff88', bg: '#001a0d' },
  paused: { label: '⏸ Pausada', color: '#ffaa00', bg: '#1a1100' },
  finished: { label: '✓ Encerrada', color: '#888', bg: '#111' },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 8px',
        background: config.bg,
        color: config.color,
        border: `2px solid ${config.color}66`,
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '8px',
        boxShadow: status === 'active' ? `0 0 8px ${config.color}40` : 'none',
      }}
    >
      {config.label}
    </span>
  )
}
