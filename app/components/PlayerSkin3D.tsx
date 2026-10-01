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
    console.log('[PlayerSkin3D] Effect triggered', { skinUrl, size })
    if (!skinUrl || !canvasRef.current) {
      console.log('[PlayerSkin3D] Skipping - no skinUrl or canvas', { skinUrl: !!skinUrl, canvas: !!canvasRef.current })
      return
    }

    let viewer: any = null

    // Test if skin URL loads first
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = skinUrl
    img.onload = () => {
      console.log('[PlayerSkin3D] Skin image loaded successfully', { width: img.width, height: img.height })
      
      import('skinview3d').then(m => {
        console.log('[PlayerSkin3D] SkinViewer module loaded', Object.keys(m))
        
        const { SkinViewer, createAnimation } = m
        
        const viewer = new SkinViewer({
          canvas: canvasRef.current!,
          skin: skinUrl,
          autoRotate: true,
          autoRotateSpeed: 0.3,
        })
        console.log('[PlayerSkin3D] Viewer created')
        
        // Try to add animation
        try {
          const anim = m.createAnimation('wave')
          viewer.animations.add(anim)
          viewer.animations.play('wave')
          console.log('[PlayerSkin3D] Animation added and played')
        } catch (e) {
          console.warn('[PlayerSkin3D] Animation error:', e)
        }
        
        setSkinViewer(viewer)
      }).catch(err => {
        console.error('[PlayerSkin3D] Error loading skinview3d:', err)
      })
    }
    img.onerror = (err) => {
      console.error('[PlayerSkin3D] Failed to load skin image:', err, skinUrl)
    }
    img.crossOrigin = 'anonymous'

    return () => {
      if (SkinViewer) {
        console.log('[PlayerSkin3D] Disposing viewer')
        SkinViewer.dispose()
      }
    }
  }, [skinUrl])

  return (
    <Suspense fallback={<canvas width={size} height={size} style={{ background: '#1a1a1a' }} />}>
      <canvas 
        ref={canvasRef} 
        width={size} 
        height={size} 
        className="w-full h-full image-rendering-pixelated"
        style={{ imageRendering: 'pixelated', background: '#0a0a0a' }}
      />
    </Suspense>
  )
}