import React from 'react'
import { cn } from '~/lib/cn'

interface MinecraftButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'pumpkin' | 'soul' | 'nether' | 'warden' | 'pale' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

const BUTTON_VARIANTS = {
  pumpkin: { bg: '#a04800', hover: '#c05a00', text: '#ffffff', shadow: '#ff780040', border: '#ff7800' },
  soul: { bg: '#004455', hover: '#005566', text: '#00e5ff', shadow: '#00e5ff40', border: '#00e5ff' },
  nether: { bg: '#3d0070', hover: '#4d0090', text: '#ffffff', shadow: '#9d50db40', border: '#7928ca' },
  warden: { bg: '#004d3d', hover: '#006650', text: '#00c9a7', shadow: '#00c9a740', border: '#00c9a7' },
  pale: { bg: '#3a3a30', hover: '#4a4a40', text: '#c8c8b0', shadow: 'transparent', border: '#6e6e5c' },
  danger: { bg: '#6b0000', hover: '#880000', text: '#ff4444', shadow: '#ff000040', border: '#cc0000' },
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
      className={cn('mc-btn', props.className)}
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