'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/store/auth.store'

type LeaderboardEntry = {
  rank: number
  userId: string
  name: string
  role: 'STUDENT' | 'TEACHER' | 'ADMIN'
  group: string | null
  score: number
  crystals: number
}

const GAME_DURATION_MS = 30000
const CRYSTAL_COUNT = 10

export default function EntertainmentPage() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const startedAtRef = useRef<number | null>(null)
  const finishedRef = useRef(false)
  const [crystals, setCrystals] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [isPlaying, setIsPlaying] = useState(false)
  const [result, setResult] = useState<number | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const language = useAuthStore(state => state.user?.language)

  const text = language === 'en'
    ? {
        title: 'Knowledge Crystals',
        subtitle: 'A short 3D break for everyone',
        intro: 'Collect as many crystals as possible in 30 seconds. Use WASD or arrow keys.',
        start: 'Start game',
        again: 'Play again',
        score: 'Your score',
        collected: 'Crystals',
        leaders: 'Leaderboard',
        empty: 'No results yet. Be the first!',
        loading: 'Loading...',
        failed: 'Could not save the result',
        admin: 'Administrator',
        teacher: 'Teacher',
        student: 'Student',
        group: 'Group',
      }
    : language === 'be'
      ? {
          title: 'Крышталёвыя веды',
          subtitle: 'Кароткі 3D-перапынак для ўсіх',
          intro: 'Збярыце як мага больш крышталяў за 30 секунд. Кіруйце WASD або стрэлкамі.',
          start: 'Пачаць гульню',
          again: 'Гуляць яшчэ',
          score: 'Ваш вынік',
          collected: 'Крышталёў',
          leaders: 'Табліца лідараў',
          empty: 'Вынікаў яшчэ няма. Будзьце першым!',
          loading: 'Загрузка...',
          failed: 'Не ўдалося захаваць вынік',
          admin: 'Адміністратар',
          teacher: 'Выкладчык',
          student: 'Студэнт',
          group: 'Група',
        }
      : {
          title: 'Кристаллы знаний',
          subtitle: 'Короткий 3D-перерыв для всех',
          intro: 'Соберите как можно больше кристаллов за 30 секунд. Управление WASD или стрелками.',
          start: 'Начать игру',
          again: 'Сыграть ещё',
          score: 'Ваш результат',
          collected: 'Кристаллов',
          leaders: 'Таблица лидеров',
          empty: 'Результатов пока нет. Станьте первым!',
          loading: 'Загрузка...',
          failed: 'Не удалось сохранить результат',
          admin: 'Администратор',
          teacher: 'Преподаватель',
          student: 'Студент',
          group: 'Группа',
        }

  const loadLeaderboard = useCallback(async () => {
    try {
      const response = await apiClient.get<LeaderboardEntry[]>('/game/leaderboard')
      setLeaderboard(response.data || [])
    } catch {
      setError(text.failed)
    }
  }, [text.failed])

  useEffect(() => {
    void loadLeaderboard()
  }, [loadLeaderboard])

  const finishGame = useCallback(async (collected: number, durationMs: number) => {
    if (finishedRef.current) return
    finishedRef.current = true
    setIsPlaying(false)
    try {
      const response = await apiClient.post<{ id: string; score: number }>('/game/results', {
        crystals: collected,
        durationMs: Math.max(1000, Math.min(GAME_DURATION_MS, durationMs))
      })
      setResult(response.data?.score ?? 0)
      await loadLeaderboard()
    } catch {
      setError(text.failed)
    }
  }, [loadLeaderboard, text.failed])

  useEffect(() => {
    if (!isPlaying || !canvasRef.current) return

    const host = canvasRef.current
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#161438')
    scene.fog = new THREE.Fog('#161438', 18, 42)
    const camera = new THREE.PerspectiveCamera(55, host.clientWidth / host.clientHeight, 0.1, 100)
    camera.position.set(0, 15, 15)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(host.clientWidth, host.clientHeight)
    host.appendChild(renderer.domElement)

    scene.add(new THREE.HemisphereLight('#b9b7ff', '#17152f', 2))
    const light = new THREE.DirectionalLight('#ffffff', 2.5)
    light.position.set(4, 12, 6)
    scene.add(light)

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(14, 64),
      new THREE.MeshStandardMaterial({ color: '#272451', roughness: 0.9, metalness: 0.1 })
    )
    ground.rotation.x = -Math.PI / 2
    scene.add(ground)

    const player = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.65, 1),
      new THREE.MeshStandardMaterial({ color: '#8b7cff', emissive: '#352b94', emissiveIntensity: 0.7 })
    )
    player.position.y = 0.8
    scene.add(player)

    const crystalMaterial = new THREE.MeshStandardMaterial({
      color: '#5ee7ff',
      emissive: '#087fa2',
      emissiveIntensity: 1.2,
      metalness: 0.35,
      roughness: 0.2
    })
    const crystalMeshes: THREE.Mesh[] = []
    for (let index = 0; index < CRYSTAL_COUNT; index += 1) {
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), crystalMaterial.clone())
      const angle = (index / CRYSTAL_COUNT) * Math.PI * 2
      const radius = 3.5 + (index % 3) * 2.1
      crystal.position.set(Math.cos(angle) * radius, 0.75, Math.sin(angle) * radius)
      scene.add(crystal)
      crystalMeshes.push(crystal)
    }

    const keys = new Set<string>()
    const onKeyDown = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(event.key)) {
        event.preventDefault()
        keys.add(event.key.toLowerCase())
      }
    }
    const onKeyUp = (event: KeyboardEvent) => keys.delete(event.key.toLowerCase())
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    const startedAt = startedAtRef.current || Date.now()
    let frame = 0
    const animate = () => {
      const elapsed = Date.now() - startedAt
      const remaining = Math.max(0, Math.ceil((GAME_DURATION_MS - elapsed) / 1000))
      setTimeLeft(remaining)
      if (elapsed >= GAME_DURATION_MS) {
        void finishGame(crystalsRef.current, GAME_DURATION_MS)
        return
      }

      const direction = new THREE.Vector3(
        (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0),
        0,
        (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - (keys.has('w') || keys.has('arrowup') ? 1 : 0)
      )
      if (direction.lengthSq() > 0) {
        direction.normalize().multiplyScalar(0.14)
        player.position.add(direction)
        player.position.x = THREE.MathUtils.clamp(player.position.x, -12, 12)
        player.position.z = THREE.MathUtils.clamp(player.position.z, -12, 12)
      }

      crystalMeshes.forEach((crystal, index) => {
        if (!crystal.visible) return
        crystal.rotation.y += 0.03
        crystal.position.y = 0.75 + Math.sin(elapsed / 300 + index) * 0.15
        if (player.position.distanceTo(crystal.position) < 1.1) {
          crystal.visible = false
          crystalsRef.current += 1
          setCrystals(crystalsRef.current)
        }
      })

      player.rotation.x += 0.01
      player.rotation.y += 0.02
      renderer.render(scene, camera)
      frame = requestAnimationFrame(animate)
    }
    const crystalsRef = { current: 0 }
    frame = requestAnimationFrame(animate)

    const onResize = () => {
      if (!host.clientWidth || !host.clientHeight) return
      camera.aspect = host.clientWidth / host.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(host.clientWidth, host.clientHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      host.replaceChildren()
    }
  }, [finishGame, isPlaying])

  const startGame = () => {
    setError(null)
    setResult(null)
    setCrystals(0)
    setTimeLeft(30)
    finishedRef.current = false
    startedAtRef.current = Date.now()
    setIsPlaying(true)
  }

  const roleLabel = (role: LeaderboardEntry['role']) =>
    role === 'ADMIN' ? text.admin : role === 'TEACHER' ? text.teacher : text.student

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top,#46398a_0%,transparent_45%),linear-gradient(135deg,#151331,#29215d)] px-4 py-6 text-white sm:px-8 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge className="mb-3 border-white/20 bg-white/10 text-violet-100">{'LabFlow · fun'}</Badge>
            <h1 className="text-3xl font-bold sm:text-4xl">{text.title}</h1>
            <p className="mt-2 text-violet-200">{text.subtitle}</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-violet-100 backdrop-blur">
            {text.intro}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="overflow-hidden border-white/15 bg-black/20 p-0 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="text-sm text-violet-200">{text.collected}: <strong className="text-white">{crystals}/{CRYSTAL_COUNT}</strong></div>
              <div className="rounded-full bg-white/10 px-4 py-1.5 font-mono text-lg font-bold">{timeLeft}s</div>
            </div>
            <div ref={canvasRef} className="h-[390px] w-full sm:h-[500px]" />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-4">
              <span className="text-xs text-violet-200">WASD · ↑ ↓ ← →</span>
              {!isPlaying && (
                <button type="button" onClick={startGame} className="rounded-xl bg-violet-400 px-5 py-2.5 text-sm font-bold text-violet-950 transition hover:bg-violet-300">
                  {result === null ? text.start : text.again}
                </button>
              )}
              {result !== null && <span className="font-semibold text-cyan-200">{text.score}: {result}</span>}
            </div>
          </Card>

          <Card className="border-white/15 bg-white/10 p-5 text-white backdrop-blur">
            <h2 className="mb-4 text-xl font-bold">{text.leaders}</h2>
            {error && <p className="mb-3 rounded-lg bg-red-400/20 px-3 py-2 text-sm text-red-100">{error}</p>}
            <div className="space-y-2">
              {leaderboard.length === 0 && <p className="text-sm text-violet-200">{text.empty}</p>}
              {leaderboard.map(entry => (
                <div key={entry.userId} className="flex items-center gap-3 rounded-xl bg-black/15 px-3 py-2.5">
                  <span className="w-6 text-center font-bold text-cyan-200">{entry.rank}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{entry.name}</p>
                    <p className="text-xs text-violet-200">{roleLabel(entry.role)}{entry.group ? ` · ${text.group}: ${entry.group}` : ''}</p>
                  </div>
                  <span className="font-mono font-bold">{entry.score}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
