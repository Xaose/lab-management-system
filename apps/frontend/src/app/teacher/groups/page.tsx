'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { slugify } from '@/lib/slug'

interface Group {
  id: string
  name: string
  course: number
  program: string
  _count: { students: number; disciplines: number }
}

export default function TeacherGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  useEffect(() => {
    apiClient.get('/groups').then(response => setGroups(response.data?.groups || []))
  }, [])

  return (
    <div className="dashboard-page min-h-screen">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <Badge variant="secondary" className="mb-3">Учебные группы</Badge>
        <h1 className="mb-2 text-3xl font-bold text-slate-950">Мои группы</h1>
        <p className="mb-8 text-slate-600">Группы, которым назначены ваши дисциплины.</p>
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map(group => (
            <Link key={group.id} href={`/teacher/groups/${slugify(group.name)}`}>
              <Card className="p-5 transition hover:-translate-y-0.5 hover:shadow-soft-lg">
                <h2 className="text-xl font-semibold text-slate-900">{group.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{group.course} курс · {group.program}</p>
                <div className="mt-4 flex gap-2 text-xs">
                  <Badge variant="secondary">{group._count.students} студентов</Badge>
                  <Badge variant="secondary">{group._count.disciplines} дисциплин</Badge>
                </div>
              </Card>
            </Link>
          ))}
          {groups.length === 0 && <Card className="p-10 text-center text-slate-500 md:col-span-2">Закреплённых групп пока нет.</Card>}
        </div>
      </div>
    </div>
  )
}
