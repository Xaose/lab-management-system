'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardHover } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api-client'
import { labWorkSlug } from '@/lib/slug'

export default function StudentDashboard() {
  const [counts, setCounts] = useState<number[] | null>(null)
  const [progress, setProgress] = useState<{
    completionPercent: number
    averageScore: number | null
    overdue: number
    upcoming: { id: string; number: number; title: string; dueDate: string; discipline: string }[]
  } | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([
      apiClient.get('/disciplines'),
      apiClient.get('/lab-works'),
      apiClient.get('/submissions'),
      apiClient.get('/analytics/student-progress')
    ]).then(([disciplines, labWorks, submissions, progressResponse]) => {
      if (active) {
        const submissionList = submissions.data?.submissions || []
        setCounts([
          disciplines.data?.disciplines?.length || 0,
          labWorks.data?.labWorks?.length || 0,
          submissionList.filter((submission: { status: string }) => submission.status !== 'DRAFT').length,
          Math.max((labWorks.data?.labWorks?.length || 0) - submissionList.length, 0)
        ])
        setProgress(progressResponse.data)
      }
    }).catch(() => {
      if (active) setCounts(null)
    })
    return () => {
      active = false
    }
  }, [])

  const stats = [
    {
      label: 'Активных дисциплин',
      href: '/student/disciplines',
      value: counts ? String(counts[0]) : '...',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: 'text-lavender-600',
      bgColor: 'bg-lavender-50'
    },
    {
      label: 'Всего работ',
      href: '/student/disciplines',
      value: counts ? String(counts[1]) : '...',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Сдано',
      href: '/student/submissions',
      value: counts ? String(counts[2]) : '...',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      label: 'Не сдано',
      href: '/student/disciplines',
      value: counts ? String(counts[3]) : '...',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
  ] as const

  const quickLinks = [
    {
      title: 'Мои дисциплины',
      description: 'Просмотр всех доступных дисциплин и лабораторных работ',
      href: '/student/disciplines',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      gradient: 'from-lavender-500 to-purple-600'
    },
    {
      title: 'Мои работы',
      description: 'История сдач, статусы проверки и полученные оценки',
      href: '/student/submissions',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      gradient: 'from-blue-500 to-indigo-600'
    },
  ] as const

  return (
    <div className="dashboard-page">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10 xl:px-10">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between animate-fade-in">
          <div>
            <Badge variant="secondary" className="mb-3 border-white/70 bg-white/60 shadow-soft">Рабочее пространство студента</Badge>
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Добро пожаловать!</h1>
            <p className="max-w-xl text-sm leading-6 text-[hsl(var(--foreground-secondary))] sm:text-base">
              Следите за дисциплинами и сдавайте лабораторные работы вовремя.
            </p>
          </div>
          <Badge className="self-start border-white/70 bg-white/65 shadow-soft sm:self-auto">
            Сегодня · {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
          </Badge>
        </div>

        <section className="dashboard-hero mb-6 animate-fade-in">
          <div className="relative z-10 max-w-2xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">LabFlow · обучение</p>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Ваш прогресс начинается здесь</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/75">Продолжайте обучение и держите лабораторные работы под контролем.</p>
          </div>
          <Link href="/student/disciplines" className="dashboard-hero-link">
            Перейти к дисциплинам
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </section>

        <div className="mb-9 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => (
            <Link key={index} href={stat.href} className="group dashboard-interactive rounded-[1.5rem]">
              <Card className={`dashboard-stat-card animate-fade-in stagger-${index + 1}`}>
                <div className="relative z-10 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-[hsl(var(--foreground-secondary))]">{stat.label}</div>
                    <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{stat.value}</div>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.bgColor} ${stat.color} shadow-soft transition-transform duration-300 group-hover:rotate-3 group-hover:scale-105`}>
                    {stat.icon}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <section className="mb-9 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Ваш прогресс</h2>
              <span className="text-2xl font-bold text-lavender-700">{progress?.completionPercent ?? 0}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-lavender-500 to-purple-600 transition-all" style={{ width: `${progress?.completionPercent ?? 0}%` }} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
              <div><strong className="block text-lg text-slate-900">{progress?.averageScore ?? '—'}</strong><span className="text-slate-500">средний балл</span></div>
              <div><strong className="block text-lg text-slate-900">{progress?.overdue ?? 0}</strong><span className="text-slate-500">просрочено</span></div>
              <div><strong className="block text-lg text-slate-900">{progress?.upcoming.length ?? 0}</strong><span className="text-slate-500">ближайших</span></div>
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Ближайшие дедлайны</h2>
            <div className="space-y-2">
              {(progress?.upcoming ?? []).slice(0, 3).map(item => (
                <Link key={item.id} href={`/student/lab-works/${labWorkSlug(item.number, item.title)}`} className="block rounded-lg bg-slate-50 p-3 transition hover:bg-lavender-50">
                  <div className="font-medium text-slate-900">{item.title}</div>
                  <div className="text-xs text-slate-500">{item.discipline} · {new Date(item.dueDate).toLocaleDateString('ru-RU')}</div>
                </Link>
              ))}
              {!progress?.upcoming.length && <p className="text-sm text-slate-500">Новых дедлайнов нет</p>}
            </div>
          </Card>
        </section>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="animate-fade-in stagger-5">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-lavender-700">Продолжить обучение</p>
                <h2 className="dashboard-section-title">Быстрые действия</h2>
              </div>
              <span className="hidden text-sm text-[hsl(var(--foreground-secondary))] sm:block">Ваши учебные разделы</span>
            </div>
            <div className="space-y-3">
              {quickLinks.map((link, index) => (
                <Link key={link.href} href={link.href} className="group dashboard-interactive block rounded-[1.5rem] focus-visible:ring-offset-4">
                  <CardHover className={`flex items-center gap-4 p-5 animate-fade-in stagger-${index + 1}`}>
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${link.gradient} text-white shadow-soft-md transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3`}>
                      {link.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="mb-1 text-base font-semibold text-slate-900 transition-colors group-hover:text-[hsl(var(--primary))]">{link.title}</h3>
                      <p className="text-sm leading-5 text-[hsl(var(--foreground-secondary))]">{link.description}</p>
                    </div>
                    <svg className="h-5 w-5 shrink-0 text-lavender-500 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </CardHover>
                </Link>
              ))}
            </div>
          </section>

          <section className="animate-fade-in stagger-6">
            <Card className="h-full p-6 sm:p-7">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-lavender-700">Планирование</p>
                  <h2 className="dashboard-section-title">Скоро к сдаче</h2>
                </div>
                <Badge variant="secondary" className="shrink-0 bg-lavender-50 text-lavender-800">{progress?.upcoming.length ?? 0} работ</Badge>
              </div>
              <div className="space-y-2">
                {(progress?.upcoming ?? []).slice(0, 4).map(item => (
                  <Link key={item.id} href={`/student/lab-works/${labWorkSlug(item.number, item.title)}`} className="flex items-center justify-between gap-3 rounded-xl bg-lavender-50/60 px-4 py-3 transition hover:bg-lavender-100/70">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-800">{item.title}</span>
                      <span className="block truncate text-xs text-slate-500">{item.discipline}</span>
                    </span>
                    <span className="shrink-0 text-xs font-medium text-lavender-800">{new Date(item.dueDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span>
                  </Link>
                ))}
                {!progress?.upcoming.length && <p className="rounded-xl bg-lavender-50/60 px-4 py-6 text-center text-sm text-slate-500">Нет предстоящих дедлайнов</p>}
              </div>
            </Card>
          </section>
        </div>
      </div>
    </div>
  )
}
