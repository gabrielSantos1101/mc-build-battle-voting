import { useEffect, useRef, useState } from 'react'
import { ReactSkinview3d } from 'react-skinview3d'

interface PlayerSkin3DProps {
  skinUrl: string
  size?: number
}

export function PlayerSkin3D({
  skinUrl,
  size = 200
}: PlayerSkin3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [skinLoaded, setSkinLoaded] = useState(false)
  const [skinFailed, setSkinFailed] = useState(false)

  useEffect(() => {
    if (!skinUrl) return

    setSkinLoaded(false)
    setSkinFailed(false)

    const img = new Image()
    img.crossOrigin = 'anonymous'
    // skins salvas antes da correcao ficaram com http:// no banco, e o
    // Mojang tambem devolve http://. Em https o navegador bloqueia isso.
    img.src = skinUrl.replace(/^http:\/\//, 'https://')
    img.onload = () => {
      setSkinLoaded(true)
    }
    img.onerror = () => {
      console.error(`[PlayerSkin3D] falha ao carregar a skin: ${img.src}`)
      setSkinFailed(true)
    }
  }, [skinUrl])

  if (!skinLoaded || !skinUrl) {
    return (
      <div
        ref={containerRef}
        style={{
          width: size,
          height: size,
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: skinFailed ? '#a04040' : '#444',
          fontSize: '10px',
          fontFamily: 'monospace',
          textAlign: 'center',
          padding: '0 8px',
          lineHeight: 1.6,
        }}
      >
        {skinFailed ? 'sem skin' : 'Loading...'}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{ width: size, height: size }}
    >
      <ReactSkinview3d
        skinUrl={skinUrl.replace(/^http:\/\//, 'https://')}
        width={size}
        height={size}
        onReady={({ viewer }) => {
          viewer.autoRotate = true
          viewer.autoRotateSpeed = 0.4
        }}
        options={{
          enableControls: true,
        }}
      />
    </div>
  )
}