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
  const [animationInstance, setAnimationInstance] = useState<any>(null)

  useEffect(() => {
    console.log('[PlayerSkin3D] Effect triggered', { skinUrl, size, animation })
    if (!skinUrl || !canvasRef.current) {
      console.log('[PlayerSkin3D] Skipping - no skinUrl or canvas', { skinUrl: !!skinUrl, canvas: !!canvasRef.current })
      return
    }

    let viewer: any = null
    let anim: any = null

    import('skinview3d').then(m => {
      console.log('[PlayerSkin3D] SkinViewer loaded, creating viewer')
      const { SkinViewer, createAnimation } = m
      
      viewer = new SkinViewer({
        canvas: canvasRef.current!,
        skin: skinUrl,
        autoRotate: true,
        autoRotateSpeed: 0.3,
      })
      console.log('[PlayerSkin3D] Viewer created')

      // Create animation after viewer is ready
      try {
        anim = createAnimation(animation)
        viewer.animations.add(anim)
        viewer.animations.play(animation)
        setAnimationInstance(anim)
      } catch (e) {
        console.warn('[PlayerSkin3D] Animation error:', e)
      }

      setSkinViewer(viewer)
    }).catch(err => {
      console.error('[PlayerSkin3D] Error loading skinview3d:', err)
    })

    return () => {
      if (anim) {
        try { viewer.animations.remove(anim.name) } catch {}
      }
      if (viewer) {
        console.log('[PlayerSkin3D] Disposing viewer')
        viewer.dispose()
      }
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