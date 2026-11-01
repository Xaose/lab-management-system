import path from 'path'
import dotenv from 'dotenv'
import prisma from '@lab/database'

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') })

const REMINDER_INTERVAL_MS = 15 * 60 * 1000
const REMINDER_WINDOW_MS = 3 * 24 * 60 * 60 * 1000

const runDeadlineReminder = async () => {
  const now = new Date()
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_MS)
  const students = await prisma.student.findMany({
    include: {
      user: { select: { id: true, status: true } },
      group: { include: { disciplines: { select: { disciplineId: true } } } }
    }
  })

  const activeStudents = students.filter(student => student.user.status === 'ACTIVE')
  const labWorks = await prisma.labWork.findMany({
    where: {
      status: 'PUBLISHED',
      dueDate: { gt: now, lte: windowEnd },
      disciplineId: { in: [...new Set(activeStudents.flatMap(student => student.group?.disciplines.map(item => item.disciplineId) || []))] }
    },
    select: { id: true, title: true, dueDate: true, disciplineId: true }
  })

  for (const student of activeStudents) {
    const disciplineIds = new Set(student.group?.disciplines.map(item => item.disciplineId) || [])
    for (const labWork of labWorks) {
      if (!disciplineIds.has(labWork.disciplineId) || !labWork.dueDate) continue

      const latestSubmission = await prisma.submission.findFirst({
        where: { studentId: student.id, labWorkId: labWork.id },
        orderBy: { attemptNumber: 'desc' },
        select: { status: true }
      })
      if (latestSubmission && ['SUBMITTED', 'IN_REVIEW', 'REVIEWED'].includes(latestSubmission.status)) continue

      const daysLeft = Math.max(1, Math.ceil((labWork.dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
      const reminderId = `deadline-${student.user.id}-${labWork.id}-${daysLeft}`
      await prisma.notification.upsert({
        where: { id: reminderId },
        create: {
          id: reminderId,
          userId: student.user.id,
          type: 'DEADLINE_SOON',
          text: `До сдачи «${labWork.title}» осталось ${daysLeft} дн. Дедлайн: ${labWork.dueDate.toLocaleString('ru-RU')}.`,
          relatedType: 'LabWork',
          relatedId: labWork.id
        },
        update: {}
      })
    }
  }
}

const isDaemon = process.env.DEADLINE_REMINDER_DAEMON === 'true'

const start = async () => {
  await runDeadlineReminder()
  console.log('Deadline reminder job completed')
  if (isDaemon) {
    setInterval(() => {
      runDeadlineReminder().catch(error => {
        console.error('Deadline reminder cycle failed', error)
      })
    }, REMINDER_INTERVAL_MS)
    return
  }
  await prisma.$disconnect()
}

start().catch(async error => {
  console.error('Deadline reminder job failed', error)
  await prisma.$disconnect()
  process.exitCode = 1
})
