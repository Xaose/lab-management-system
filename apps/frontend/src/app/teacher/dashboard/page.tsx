'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardHover } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api-client'

export default function TeacherDashboard() {
  const [counts, setCounts] = useState<number[] | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([
      apiClient.get('/disciplines'),
      apiClient.get('/lab-works'),
      apiClient.get('/submissions')
    ]).then(([disciplines, labWorks, submissions]) => {
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
      title: 'Создать лабораторную',
      description: 'Добавить новое задание для студентов',
      href: '/teacher/lab-works/create',
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
      value: counts ? String(counts[3]) : '...',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
  ]

  return (
    <div className="dashboard-page">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between animate-fade-in">
          <div>
            <Badge variant="secondary" className="mb-3 shadow-soft">Рабочее пространство преподавателя</Badge>
            <h1 className="mb-2 text-4xl font-bold tracking-tight text-slate-950">Обзор работы</h1>
            <p className="text-base text-[hsl(var(--foreground-secondary))]">
              Управляйте курсами и проверяйте новые сдачи студентов.
            </p>
          </div>
          <Badge>Весенний семестр</Badge>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className={`p-6 animate-fade-in stagger-${index + 1}`}>
              <div className="mb-4 flex items-center justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-[0.95rem] ${stat.bgColor} ${stat.color} shadow-soft transition-transform hover:scale-110`}>
                  {stat.icon}
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
              <div className="mt-1 text-sm text-[hsl(var(--foreground-secondary))]">{stat.label}</div>
            </Card>
          ))}
        </div>

        <div className="mb-10 animate-fade-in stagger-5">
          <h2 className="mb-5 text-xl font-semibold text-slate-900">Быстрые действия</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {quickActions.map((action, index) => (
              <Link
                key={action.href}
                href={action.href}
                className="group"
              >
                <CardHover className="p-7 transition-all duration-200">
                  <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-[1.1rem] bg-gradient-to-br ${action.gradient} text-white shadow-soft-md transition-transform duration-200 group-hover:scale-110 group-hover:shadow-soft-lg`}>
                    {action.icon}
                  </div>
                  <h3 className="mb-1.5 text-lg font-semibold text-slate-900 transition-colors group-hover:text-[hsl(var(--primary))]">
                    {action.title}
                  </h3>
                  <p className="text-sm text-[hsl(var(--foreground-secondary))]">{action.description}</p>
                </CardHover>
              </Link>
            ))}
          </div>
        </div>

        <div className="animate-fade-in stagger-6">
          <Card className="p-7">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Последние работы на проверке</h2>
              <Badge variant="secondary">0 работ</Badge>
            </div>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                <svg className="h-8 w-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-base font-medium text-slate-700">Нет работ на проверке</p>
              <p className="mt-1 text-sm text-[hsl(var(--foreground-secondary))]">Все работы проверены или студенты ещё не сдали задания</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
