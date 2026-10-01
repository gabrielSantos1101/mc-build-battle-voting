import { useEffect, useRef, useState, Suspense, lazy } from 'react'

const SkinViewer3D = lazy(() => import('skinview3d').then(m => ({ default: m.SkinViewer })))

interface PlayerSkin3DProps {
  skinUrl: string
  size?: number
  animation?: 'idle' | 'wave' | 'walk' | 'spin' | 'pose'
  autoRotate?: boolean
  autoRotateSpeed?: number
}

export function PlayerSkin3D({ 
  skinUrl, 
  size = 256, 
  animation = 'wave',
  autoRotate = true,
  autoRotateSpeed = 0.3 
}: PlayerSkin3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [SkinViewer, setSkinViewer] = useState<any>(null)

  useEffect(() => {
    if (!skinUrl || !canvasRef.current) return

    import('skinview3d').then(m => {
      const viewer = new m.SkinViewer({
        canvas: canvasRef.current!,
        skin: skinUrl,
        animation,
        autoRotate: true,
        autoRotateSpeed: 0.3,
      })
      setSkinViewer(viewer)
    })

    return () => {
      if (SkinViewer) SkinViewer.dispose()
      setSkinViewer(null)
    }
  }, [skinUrl, animation])

  return (
    <Suspense fallback={<canvas width={size} height={size} style={{ background: '#1a1a1a' }} />}>
      <canvas 
        ref={canvasRef} 
        width={size} 
        height={size} 
        className="w-full h-full image-rendering-pixelated"
        style={{ imageRendering: 'pixelated' }}
      />
    </Suspense>
  )
}