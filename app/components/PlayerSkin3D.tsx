import { useEffect, useRef, useState } from 'react'
import { ReactSkinview3d } from 'react-skinview3d'

interface PlayerSkin3DProps {
  skinUrl: string
  size?: number
}

export function PlayerSkin3D({ 
  skinUrl, 
  size = 256
}: PlayerSkin3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [skinLoaded, setSkinLoaded] = useState(false)

  useEffect(() => {
    if (!skinUrl) return
    
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = skinUrl
    img.onload = () => {
      console.log('[PlayerSkin3D] Skin image loaded', { width: img.width, height: img.height })
      setSkinLoaded(true)
    }
    img.onerror = (err) => {
      console.error('[PlayerSkin3D] Failed to load skin:', err, skinUrl)
    }
    img.crossOrigin = 'anonymous'
  }, [skinUrl])

  if (!skinLoaded || !skinUrl) {
    return (
      <div 
        ref={containerRef}
        style={{ 
          width: size, 
          height: size, 
          background: '#0a0a0a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#444',
          fontSize: '10px',
          fontFamily: 'monospace'
        }}
      >
        Loading...
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      style={{ width: size, height: size }}
    >
      <ReactSkinview3d
        skinUrl={skinUrl}
        autoRotate={true}
        autoRotateSpeed={0.3}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        options={{ 
          backgroundColor: 0x000000, 
          backgroundAlpha: 0 
        }}
      />
    </div>
  )
}