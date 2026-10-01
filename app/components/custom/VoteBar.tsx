import React from 'react'

interface VoteBarProps {
  percentage: number
  count: number
  color?: string
  animated?: boolean
}

export function VoteBar({ percentage, count, color = '#ff7800', animated = true }: VoteBarProps) {
  return (
    <div className="w-full">
      <div
        className="w-full h-4 relative"
        style={{
          background: '#111',
          border: '2px solid #333',
          boxShadow: 'inset 0 2px 0 rgba(0,0,0,0.5)',
        }}
      >
        <div
          className="h-full absolute top-0 left-0"
          style={{
            width: `${percentage}%`,
            background: color,
            boxShadow: `0 0 8px ${color}80`,
            transition: animated ? 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
          }}
        />
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'rgba(255,255,255,0.15)' }} />
      </div>
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