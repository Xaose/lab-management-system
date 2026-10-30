'use client'

import { useEffect, useRef } from 'react'

export default function AuthScene() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let disposed = false
    let cleanup = () => undefined

    void import('three').then(({ WebGLRenderer, Scene, PerspectiveCamera, BufferGeometry, Float32BufferAttribute, PointsMaterial, Points, LineBasicMaterial, LineSegments, Group }) => {
      if (disposed || !containerRef.current) return

      const container = containerRef.current
      const scene = new Scene()
      const camera = new PerspectiveCamera(45, 1, 0.1, 100)
      camera.position.z = 9
      const renderer = new WebGLRenderer({ antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      container.appendChild(renderer.domElement)

      const points: number[] = []
      for (let index = 0; index < 70; index += 1) {
        points.push((Math.random() - 0.5) * 18, (Math.random() - 0.5) * 11, (Math.random() - 0.5) * 5)
      }
      const pointsGeometry = new BufferGeometry()
      pointsGeometry.setAttribute('position', new Float32BufferAttribute(points, 3))
      const pointsMaterial = new PointsMaterial({ color: '#8b5cf6', size: 0.16, transparent: true, opacity: 0.8 })
      const nodes = new Points(pointsGeometry, pointsMaterial)

      const lines: number[] = []
      for (let index = 0; index < points.length; index += 3) {
        for (let next = index + 3; next < points.length; next += 3) {
          const dx = points[index] - points[next]
          const dy = points[index + 1] - points[next + 1]
          const dz = points[index + 2] - points[next + 2]
          if (dx * dx + dy * dy + dz * dz < 5) {
            lines.push(points[index], points[index + 1], points[index + 2], points[next], points[next + 1], points[next + 2])
          }
        }
      }
      const linesGeometry = new BufferGeometry()
      linesGeometry.setAttribute('position', new Float32BufferAttribute(lines, 3))
      const network = new LineSegments(linesGeometry, new LineBasicMaterial({ color: '#c4b5fd', transparent: true, opacity: 0.18 }))
      const graph = new Group()
      graph.add(nodes, network)
      scene.add(graph)
      let spinX = 0.0003
      let spinY = 0.0008
      let lastX = 0
      let lastY = 0
      let dragging = false

      const pointerDown = (event: PointerEvent) => {
        dragging = true
        lastX = event.clientX
        lastY = event.clientY
        container.setPointerCapture(event.pointerId)
      }
      const pointerMove = (event: PointerEvent) => {
        if (!dragging) return
        spinY = (event.clientX - lastX) * 0.0008
        spinX = (event.clientY - lastY) * 0.0008
        lastX = event.clientX
        lastY = event.clientY
      }
      const pointerUp = () => {
        dragging = false
        spinY *= 2.5
        spinX *= 2.5
      }
      container.addEventListener('pointerdown', pointerDown)
      container.addEventListener('pointermove', pointerMove)
      container.addEventListener('pointerup', pointerUp)
      container.addEventListener('pointercancel', pointerUp)

      const resize = () => {
        const width = container.clientWidth
        const height = container.clientHeight
        camera.aspect = width / Math.max(height, 1)
        camera.updateProjectionMatrix()
        renderer.setSize(width, height)
      }
      resize()
      window.addEventListener('resize', resize)

      let frame = 0
      const animate = () => {
        frame = window.requestAnimationFrame(animate)
        graph.rotation.y += spinY
        graph.rotation.x += spinX
        if (!dragging) {
          spinY *= 0.995
          spinX *= 0.995
        }
        renderer.render(scene, camera)
      }
      animate()

      cleanup = () => {
        window.cancelAnimationFrame(frame)
        window.removeEventListener('resize', resize)
        container.removeEventListener('pointerdown', pointerDown)
        container.removeEventListener('pointermove', pointerMove)
        container.removeEventListener('pointerup', pointerUp)
        container.removeEventListener('pointercancel', pointerUp)
        pointsGeometry.dispose()
        pointsMaterial.dispose()
        linesGeometry.dispose()
        network.material.dispose()
        renderer.dispose()
        renderer.domElement.remove()
      }
    })

    return () => {
      disposed = true
      cleanup()
    }
  }, [])

  return <div ref={containerRef} aria-hidden="true" className="absolute inset-0 z-0 cursor-grab touch-none opacity-70 active:cursor-grabbing" />
}
