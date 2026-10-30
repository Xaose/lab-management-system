'use client'

import { useEffect, useRef } from 'react'

export default function AuthScene() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let disposed = false
    let cleanup = () => undefined

    void import('three').then(({ WebGLRenderer, Scene, OrthographicCamera, TorusKnotGeometry, Mesh, MeshBasicMaterial, Color, Group }) => {
      if (disposed || !containerRef.current) return

      const container = containerRef.current
      const scene = new Scene()
      scene.background = new Color('#21134f')
      const camera = new OrthographicCamera(-4, 4, 3, -3, 0.1, 100)
      camera.position.z = 8
      const renderer = new WebGLRenderer({ antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      container.appendChild(renderer.domElement)

      const group = new Group()
      const geometry = new TorusKnotGeometry(1.45, 0.32, 160, 24)
      const material = new MeshBasicMaterial({ color: '#c4b5fd', wireframe: true, transparent: true, opacity: 0.72 })
      const knot = new Mesh(geometry, material)
      group.add(knot)
      scene.add(group)

      const resize = () => {
        const width = container.clientWidth
        const height = container.clientHeight
        const aspect = width / Math.max(height, 1)
        camera.left = -4 * aspect
        camera.right = 4 * aspect
        camera.top = 4
        camera.bottom = -4
        camera.updateProjectionMatrix()
        renderer.setSize(width, height)
      }
      resize()
      window.addEventListener('resize', resize)

      let frame = 0
      const animate = () => {
        frame = window.requestAnimationFrame(animate)
        knot.rotation.x += 0.0025
        knot.rotation.y += 0.004
        group.rotation.z += 0.0008
        renderer.render(scene, camera)
      }
      animate()

      cleanup = () => {
        window.cancelAnimationFrame(frame)
        window.removeEventListener('resize', resize)
        geometry.dispose()
        material.dispose()
        renderer.dispose()
        renderer.domElement.remove()
      }
    })

    return () => {
      disposed = true
      cleanup()
    }
  }, [])

  return <div ref={containerRef} aria-hidden="true" className="absolute inset-0 opacity-80" />
}
