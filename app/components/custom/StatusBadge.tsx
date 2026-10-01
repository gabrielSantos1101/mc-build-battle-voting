import React from 'react'

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