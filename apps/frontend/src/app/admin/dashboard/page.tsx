'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardHover } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api-client'

export default function AdminDashboard() {
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
      label: 'Пользователей',
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
      label: 'Групп',
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
      label: 'Дисциплин',
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
      label: 'Лабораторных',
      value: dashboardStats.labWorks === null ? '...' : String(dashboardStats.labWorks),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
  ]

  return (
    <div className="dashboard-page">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between animate-fade-in">
          <div>
            <Badge variant="secondary" className="mb-3 shadow-soft">Центр управления</Badge>
            <h1 className="mb-2 text-4xl font-bold tracking-tight text-slate-950">Панель администратора</h1>
            <p className="text-base text-[hsl(var(--foreground-secondary))]">
              Управление пользователями, группами и учебными дисциплинами.
            </p>
          </div>
          <Badge variant="accepted">Система онлайн</Badge>
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

        <div className="animate-fade-in stagger-5">
          <h2 className="mb-5 text-xl font-semibold text-slate-900">Управление системой</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {menuItems.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className="group"
              >
                <CardHover className="p-7 transition-all duration-200">
                  <div className="flex items-start gap-5">
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.1rem] bg-gradient-to-br ${item.gradient} text-white shadow-soft-md transition-transform duration-200 group-hover:scale-110 group-hover:shadow-soft-lg`}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="mb-1.5 text-lg font-semibold text-slate-900 transition-colors group-hover:text-[hsl(var(--primary))]">
                        {item.title}
                      </h3>
                      <p className="text-sm text-[hsl(var(--foreground-secondary))] line-clamp-2">{item.description}</p>
                    </div>
                  </div>
                </CardHover>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
