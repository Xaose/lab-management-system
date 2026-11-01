'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardHover } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/store/auth.store'
import { translate } from '@/lib/i18n'

export default function AdminDashboard() {
  const language = useAuthStore(state => state.user?.language)
  const [dashboardStats, setDashboardStats] = useState({
    users: null as number | null,
    groups: null as number | null,
    disciplines: null as number | null,
    labWorks: null as number | null,
  })

  useEffect(() => {
    let active = true
    const loadStats = async () => {
      try {
        const [users, groups, disciplines, labWorks] = await Promise.all([
          apiClient.get('/users?limit=1'),
          apiClient.get('/groups?limit=1'),
          apiClient.get('/disciplines?limit=1'),
          apiClient.get('/lab-works'),
        ])
        if (active) {
          setDashboardStats({
            users: users.data?.pagination?.total ?? 0,
            groups: groups.data?.pagination?.total ?? 0,
            disciplines: disciplines.data?.pagination?.total ?? 0,
            labWorks: labWorks.data?.labWorks?.length ?? 0,
          })
        }
      } catch {
        if (active) {
          setDashboardStats({ users: 0, groups: 0, disciplines: 0, labWorks: 0 })
        }
      }
    }
    loadStats()
    return () => {
      active = false
    }
  }, [])

  const menuItems = [
    {
      title: 'Управление пользователями',
      description: 'Создание, редактирование и управление ролями пользователей',
      href: '/admin/users',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      gradient: 'from-blue-500 to-indigo-600'
    },
    {
      title: 'Управление группами',
      description: 'Создание учебных групп и управление составом студентов',
      href: '/admin/groups',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      gradient: 'from-emerald-500 to-teal-600'
    },
    {
      title: 'Управление дисциплинами',
      description: 'Создание дисциплин и распределение преподавателей',
      href: '/admin/disciplines',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      gradient: 'from-lavender-500 to-purple-600'
    },
  ] as const

  const stats = [
    {
      label: language === 'en' ? 'Users' : language === 'be' ? 'Карыстальнікаў' : 'Пользователей',
      href: '/admin/users',
      value: dashboardStats.users === null ? '...' : String(dashboardStats.users),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: language === 'en' ? 'Groups' : language === 'be' ? 'Груп' : 'Групп',
      href: '/admin/groups',
      value: dashboardStats.groups === null ? '...' : String(dashboardStats.groups),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      label: language === 'en' ? 'Disciplines' : language === 'be' ? 'Дысцыплін' : 'Дисциплин',
      href: '/admin/disciplines',
      value: dashboardStats.disciplines === null ? '...' : String(dashboardStats.disciplines),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: 'text-lavender-600',
      bgColor: 'bg-lavender-50'
    },
    {
      label: language === 'en' ? 'Laboratory works' : language === 'be' ? 'Лабараторных' : 'Лабораторных',
      href: '/admin/disciplines',
      value: dashboardStats.labWorks === null ? '...' : String(dashboardStats.labWorks),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
  ] as const

  return (
    <div className="dashboard-page">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10 xl:px-10">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between animate-fade-in">
          <div>
            <Badge variant="secondary" className="mb-3 border-white/70 bg-white/60 shadow-soft">{translate(language, 'dashboard')}</Badge>
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{language === 'en' ? 'Administrator panel' : language === 'be' ? 'Панэль адміністратара' : 'Панель администратора'}</h1>
            <p className="max-w-xl text-sm leading-6 text-[hsl(var(--foreground-secondary))] sm:text-base">
              {language === 'en' ? 'Manage users, groups and academic disciplines.' : language === 'be' ? 'Кіраванне карыстальнікамі, групамі і вучэбнымі дысцыплінамі.' : 'Управление пользователями, группами и учебными дисциплинами.'}
            </p>
          </div>
          <Badge variant="accepted" className="self-start sm:self-auto">Система онлайн</Badge>
        </div>

        <section className="dashboard-hero mb-6 animate-fade-in">
          <div className="relative z-10 max-w-2xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">LabFlow · администрирование</p>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Всё учебное пространство — под рукой</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/75">Управляйте пользователями, группами и дисциплинами из одного места.</p>
          </div>
          <Link href="/admin/users" className="dashboard-hero-link">
            Управление пользователями
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </section>
        <div className="mb-6 flex justify-end">
          <Link href="/admin/audit" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-lavender-300 hover:text-lavender-700">Журнал действий</Link>
        </div>

        <div className="mb-9 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => (
            <Link key={index} href={stat.href} className="group dashboard-interactive rounded-[1.5rem]">
              <Card className={`dashboard-stat-card animate-fade-in stagger-${index + 1}`}>
              <div className="relative z-10 flex items-center justify-between">
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

        <section className="animate-fade-in stagger-5">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-lavender-700">Пространство</p>
              <h2 className="dashboard-section-title">Управление системой</h2>
            </div>
            <span className="hidden text-sm text-[hsl(var(--foreground-secondary))] sm:block">Быстрый доступ к разделам</span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {menuItems.map((item, index) => (
              <Link key={item.href} href={item.href} className="group dashboard-interactive rounded-[1.5rem] focus-visible:ring-offset-4">
                <CardHover className={`flex h-full items-center gap-4 p-5 animate-fade-in stagger-${index + 1}`}>
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient} text-white shadow-soft-md transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3`}>
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="mb-1 text-base font-semibold text-slate-900 transition-colors group-hover:text-[hsl(var(--primary))]">{item.title}</h3>
                    <p className="line-clamp-2 text-sm leading-5 text-[hsl(var(--foreground-secondary))]">{item.description}</p>
                  </div>
                  <svg className="h-5 w-5 shrink-0 text-lavender-500 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </CardHover>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
