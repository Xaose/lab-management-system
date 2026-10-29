'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import type { UserRole } from '@lab/types'
import { Button } from '@/components/ui/button'
import type { Route } from 'next'

// Icons using SVG for better visual consistency
const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)

const BookIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
)

const DocumentIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
)

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const GroupIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
)

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  if (pathname === '/' || pathname.startsWith('/auth') || !user) return null

  const dashboardHref = user.role === 'STUDENT'
    ? '/student/dashboard'
    : user.role === 'TEACHER'
      ? '/teacher/dashboard'
      : '/admin/dashboard'

  const navigationLinks: Array<{ href: Route; label: string; icon: () => JSX.Element }> = user.role === 'STUDENT'
    ? [
        { href: '/student/dashboard', label: 'Главная', icon: HomeIcon },
        { href: '/student/disciplines', label: 'Дисциплины', icon: BookIcon },
        { href: '/student/submissions', label: 'Мои работы', icon: DocumentIcon },
      ]
    : user.role === 'TEACHER'
      ? [
          { href: '/teacher/dashboard', label: 'Главная', icon: HomeIcon },
          { href: '/teacher/disciplines', label: 'Дисциплины', icon: BookIcon },
          { href: '/teacher/lab-works/create', label: 'Лабораторные', icon: DocumentIcon },
          { href: '/teacher/submissions', label: 'Проверка работ', icon: CheckIcon },
        ]
      : [
          { href: '/admin/dashboard', label: 'Главная', icon: HomeIcon },
          { href: '/admin/users', label: 'Пользователи', icon: UsersIcon },
          { href: '/admin/groups', label: 'Группы', icon: GroupIcon },
          { href: '/admin/disciplines', label: 'Дисциплины', icon: BookIcon },
        ]

  const roleLabels: Record<UserRole, string> = {
    STUDENT: 'Студент',
    TEACHER: 'Преподаватель',
    ADMIN: 'Администратор',
  }

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  return (
    <aside className="sticky top-0 z-50 flex h-screen w-[76px] shrink-0 flex-col items-center border-r border-[hsl(var(--border-light))] bg-white/75 py-6 backdrop-blur-xl lg:w-72 lg:items-stretch lg:px-5 animate-fade-in">
      <Link
        href={dashboardHref}
        className="mb-10 flex items-center justify-center gap-3 transition-transform hover:scale-105 lg:justify-start lg:px-3"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-[1.1rem] bg-gradient-to-br from-[hsl(var(--primary))] to-purple-600 text-lg font-bold text-white shadow-soft-md">
          L
        </div>
        <span className="hidden text-xl font-bold tracking-tight text-slate-900 lg:block">LabFlow</span>
      </Link>

      <nav className="flex w-full flex-1 flex-col items-center gap-2 lg:items-stretch">
        {navigationLinks.map((link, index) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              title={link.label}
              className={`group relative flex items-center justify-center gap-3 rounded-[0.95rem] px-4 py-3.5 text-sm font-semibold transition-all duration-200 lg:justify-start animate-slide-in stagger-${index + 1} ${
                isActive
                  ? 'bg-gradient-to-br from-lavender-100 to-lavender-50 text-lavender-800 shadow-soft'
                  : 'text-slate-600 hover:bg-lavender-50/60 hover:text-lavender-800'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-[hsl(var(--primary))] transition-all" />
              )}
              <Icon />
              <span className="hidden lg:block">{link.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto w-full space-y-3">
        <div className="hidden items-center gap-3 rounded-[1.1rem] bg-gradient-to-br from-lavender-50 to-lavender-100/50 p-4 shadow-soft lg:flex">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-lavender-300 to-lavender-200 text-sm font-bold text-lavender-900">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-slate-600">{roleLabels[user.role]}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          title="Выйти"
          onClick={handleLogout}
          className="mx-auto text-slate-600 hover:text-red-600 lg:mx-0 lg:w-full lg:justify-start lg:gap-3"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden lg:block">Выйти</span>
        </Button>
      </div>
    </aside>
  )
}
