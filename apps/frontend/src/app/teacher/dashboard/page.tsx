'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardHover } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api-client'

export default function TeacherDashboard() {
  const [counts, setCounts] = useState<number[] | null>(null)
  const [analytics, setAnalytics] = useState<{ averageScore: number | null; reviewRate: number; revision: number } | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([
      apiClient.get('/disciplines'),
      apiClient.get('/lab-works'),
      apiClient.get('/submissions'),
      apiClient.get('/analytics/teacher')
    ]).then(([disciplines, labWorks, submissions, analyticsResponse]) => {
      if (active) {
        const submissionList = submissions.data?.submissions || []
        setCounts([
          disciplines.data?.disciplines?.length || 0,
          labWorks.data?.labWorks?.length || 0,
          submissionList.filter((submission: { status: string }) =>
            submission.status === 'SUBMITTED' || submission.status === 'IN_REVIEW'
          ).length,
          submissionList.filter((submission: { status: string }) => submission.status === 'REVIEWED').length
        ])
        setAnalytics(analyticsResponse.data)
      }
    }).catch(() => {
      if (active) setCounts(null)
    })
    return () => {
      active = false
    }
  }, [])

  const quickActions = [
    {
      title: 'Мои дисциплины',
      description: 'Просмотр закреплённых дисциплин и групп',
      href: '/teacher/disciplines',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      gradient: 'from-lavender-500 to-purple-600'
    },
    {
      title: 'Лабораторные работы',
      description: 'Просмотр существующих работ и создание новых внутри дисциплины',
      href: '/teacher/disciplines',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      gradient: 'from-blue-500 to-indigo-600'
    },
    {
      title: 'Проверить работы',
      description: 'Новые сдачи студентов ожидают проверки',
      href: '/teacher/submissions',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      gradient: 'from-emerald-500 to-teal-600'
    },
  ] as const

  const stats = [
    {
      label: 'Мои дисциплины',
      href: '/teacher/disciplines',
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
      label: 'Лабораторных работ',
      href: '/teacher/disciplines',
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
      label: 'На проверке',
      href: '/teacher/submissions',
      value: counts ? String(counts[2]) : '...',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    {
      label: 'Проверено',
      href: '/teacher/submissions',
      value: counts ? String(counts[3]) : '...',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
  ] as const

  return (
    <div className="dashboard-page">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10 xl:px-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-fade-in">
          <div>
            <Badge variant="secondary" className="mb-3 border-white/70 bg-white/60 shadow-soft">Рабочее пространство преподавателя</Badge>
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Обзор работы</h1>
            <p className="max-w-xl text-sm leading-6 text-[hsl(var(--foreground-secondary))] sm:text-base">
              Управляйте курсами и проверяйте новые сдачи студентов.
            </p>
          </div>
          <Badge className="self-start border-white/70 bg-white/65 shadow-soft sm:self-auto">Весенний семестр</Badge>
        </div>

        <section className="dashboard-hero mb-6 animate-fade-in">
          <div className="relative z-10 max-w-2xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">LabFlow · преподавание</p>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Ваши курсы и проверка работ</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/75">Следите за учебной нагрузкой и быстро переходите к новым сдачам.</p>
          </div>
          <Link href="/teacher/submissions" className="dashboard-hero-link">
            Открыть проверку работ
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </section>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

        <Card className="mb-8 p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lavender-700">Аналитика</p>
              <h2 className="text-lg font-semibold text-slate-900">Качество проверки</h2>
            </div>
            <button type="button" onClick={async () => {
              const blob = await apiClient.download('/analytics/teacher/export')
              const url = URL.createObjectURL(blob)
              const anchor = document.createElement('a')
              anchor.href = url
              anchor.download = 'vedomost.csv'
              anchor.click()
              URL.revokeObjectURL(url)
            }} className="rounded-lg bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[hsl(var(--primary-dark))]">Экспорт ведомости</button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-lavender-50/70 p-4"><div className="text-2xl font-bold text-slate-900">{analytics?.averageScore ?? '—'}</div><div className="text-sm text-slate-500">средний балл</div></div>
            <div className="rounded-xl bg-lavender-50/70 p-4"><div className="text-2xl font-bold text-slate-900">{analytics?.reviewRate ?? 0}%</div><div className="text-sm text-slate-500">проверено работ</div></div>
            <div className="rounded-xl bg-lavender-50/70 p-4"><div className="text-2xl font-bold text-slate-900">{analytics?.revision ?? 0}</div><div className="text-sm text-slate-500">на доработке</div></div>
          </div>
        </Card>

        <section className="mb-5 animate-fade-in stagger-5">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-lavender-700">Рабочее пространство</p>
              <h2 className="dashboard-section-title">Быстрые действия</h2>
            </div>
            <span className="hidden text-sm text-[hsl(var(--foreground-secondary))] sm:block">Курсы и работы</span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {quickActions.map((action, index) => (
              <Link key={action.href} href={action.href} className="group dashboard-interactive rounded-[1.5rem] focus-visible:ring-offset-4">
                <CardHover className={`flex h-full items-center gap-4 p-5 animate-fade-in stagger-${index + 1}`}>
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${action.gradient} text-white shadow-soft-md transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3`}>
                    {action.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="mb-1 text-base font-semibold text-slate-900 transition-colors group-hover:text-[hsl(var(--primary))]">{action.title}</h3>
                    <p className="text-sm leading-5 text-[hsl(var(--foreground-secondary))]">{action.description}</p>
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
          <Card className="p-6 sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-lavender-700">Очередь</p>
                <h2 className="dashboard-section-title">Последние работы на проверке</h2>
              </div>
              <Badge variant="secondary" className="shrink-0 bg-lavender-50 text-lavender-800">0 работ</Badge>
            </div>
            <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-lavender-50/80 to-white/60 px-5 py-8 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-soft">
                <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-800">Нет работ на проверке</p>
              <p className="mt-1 max-w-md text-sm leading-5 text-[hsl(var(--foreground-secondary))]">Все работы проверены или студенты ещё не сдали задания</p>
            </div>
          </Card>
        </section>
      </div>
    </div>
  )
}
