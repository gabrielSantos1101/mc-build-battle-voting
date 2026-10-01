import { useEffect, useRef, useState } from 'react'

interface PlayerSkin3DProps {
  skinUrl: string
  size?: number
}

export function PlayerSkin3D({ 
  skinUrl, 
  size = 256
}: PlayerSkin3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [viewer, setViewer] = useState<any>(null)

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
        
        const { SkinViewer } = m
        
        // Ensure canvas has proper dimensions BEFORE creating viewer
        const canvas = canvasRef.current!
        canvas.width = size
        canvas.height = size
        canvas.style.width = `${size}px`
        canvas.style.height = `${size}px`
        
        // Force a layout recalculation
        canvas.getContext('2d')
        
        const viewer = new m.SkinViewer({
          canvas: canvas,
          skin: skinUrl,
          autoRotate: true,
          autoRotateSpeed: 0.3,
        })
        console.log('[PlayerSkin3D] Viewer created')
        
        setViewer(viewer)
      }).catch(err => {
        console.error('[PlayerSkin3D] Error loading skinview3d:', err)
      })
    }
    img.onerror = (err) => {
      console.error('[PlayerSkin3D] Failed to load skin image:', err, skinUrl)
    }
    img.crossOrigin = 'anonymous'

    return () => {
      if (viewer) {
        console.log('[PlayerSkin3D] Disposing viewer')
        viewer.dispose()
      }
    }
  }, [skinUrl, size])

  return (
    <canvas 
      ref={canvasRef} 
      width={size} 
      height={size} 
      className="w-full h-full image-rendering-pixelated"
      style={{ imageRendering: 'pixelated', background: '#0a0a0a', width: `${size}px`, height: `${size}px` }}
    />
  )
}