import React from 'react'
import { getMinecraftAvatarUrl } from '~/lib/supabase'
import { cn } from '~/lib/cn'

interface PlayerHeadProps {
  nick: string
  size?: number
  className?: string
}

export function PlayerHead({ nick, size = 32, className = '' }: PlayerHeadProps) {
  const [error, setError] = React.useState(false)

  if (error) {
    return (
      <div
        className={cn('flex items-center justify-center bg-[#2a2a2a] border-2 border-[#444]', className)}
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
      className={className}
      style={{ imageRendering: 'pixelated' }}
      onError={() => setError(true)}
    />
  )
}