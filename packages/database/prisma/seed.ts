import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Хешируем пароль
  const passwordHash = await bcrypt.hash('123456', 10)

  // 1. Создаём администратора
  console.log('Creating admin...')
  const admin = await prisma.user.create({
    data: {
      email: 'admin@lab.local',
      passwordHash,
      firstName: 'Администратор',
      lastName: 'Системы',
      role: 'ADMIN',
      status: 'ACTIVE',
      admin: {
        create: {}
      }
    }
  })

  // 2. Создаём группы
  console.log('Creating groups...')
  const group1 = await prisma.group.create({
    data: {
      name: 'ИС-21',
      course: 2,
      program: 'Информационные системы и технологии',
      faculty: 'Факультет информационных технологий',
      year: 2023
    }
  })

  const group2 = await prisma.group.create({
    data: {
      name: 'ИС-31',
      course: 3,
      program: 'Информационные системы и технологии',
      faculty: 'Факультет информационных технологий',
      year: 2022
    }
  })

  const group3 = await prisma.group.create({
    data: {
      name: 'ПО-21',
      course: 2,
      program: 'Программная инженерия',
      faculty: 'Факультет информационных технологий',
      year: 2023
    }
  })

  // 3. Создаём преподавателей
  console.log('Creating teachers...')
  const teacher1 = await prisma.user.create({
    data: {
      email: 'ivanov@lab.local',
      passwordHash,
      firstName: 'Иван',
      lastName: 'Иванов',
      patronymic: 'Петрович',
      role: 'TEACHER',
      status: 'ACTIVE',
      teacher: {
        create: {
          position: 'Доцент',
          department: 'Кафедра информационных систем',
          degree: 'Кандидат технических наук',
          title: 'Доцент'
        }
      }
    }
  })

  const teacher2 = await prisma.user.create({
    data: {
      email: 'petrova@lab.local',
      passwordHash,
      firstName: 'Мария',
      lastName: 'Петрова',
      patronymic: 'Сергеевна',
      role: 'TEACHER',
      status: 'ACTIVE',
      teacher: {
        create: {
          position: 'Профессор',
          department: 'Кафедра программной инженерии',
          degree: 'Доктор технических наук',
          title: 'Профессор'
        }
      }
    }
  })

  const teacher3 = await prisma.user.create({
    data: {
      email: 'sidorov@lab.local',
      passwordHash,
      firstName: 'Алексей',
      lastName: 'Сидоров',
      patronymic: 'Викторович',
      role: 'TEACHER',
      status: 'ACTIVE',
      teacher: {
        create: {
          position: 'Старший преподаватель',
          department: 'Кафедра информационных систем'
        }
      }
    }
  })

  // 4. Создаём студентов
  console.log('Creating students...')
  const student1 = await prisma.user.create({
    data: {
      email: 'student1@lab.local',
      passwordHash,
      firstName: 'Анна',
      lastName: 'Смирнова',
      patronymic: 'Дмитриевна',
      phone: '+375291234567',
      role: 'STUDENT',
      status: 'ACTIVE',
      student: {
        create: {
          studentIdNumber: '2023001',
          groupId: group1.id,
          course: 2,
          program: 'Информационные системы и технологии',
          faculty: 'Факультет информационных технологий'
        }
      }
    }
  })

  const student2 = await prisma.user.create({
    data: {
      email: 'student2@lab.local',
      passwordHash,
      firstName: 'Дмитрий',
      lastName: 'Кузнецов',
      patronymic: 'Александрович',
      phone: '+375291234568',
      role: 'STUDENT',
      status: 'ACTIVE',
      student: {
        create: {
          studentIdNumber: '2023002',
          groupId: group1.id,
          course: 2,
          program: 'Информационные системы и технологии',
          faculty: 'Факультет информационных технологий'
        }
      }
    }
  })

  const student3 = await prisma.user.create({
    data: {
      email: 'student3@lab.local',
      passwordHash,
      firstName: 'Екатерина',
      lastName: 'Волкова',
      patronymic: 'Игоревна',
      phone: '+375291234569',
      role: 'STUDENT',
      status: 'ACTIVE',
      student: {
        create: {
          studentIdNumber: '2023003',
          groupId: group1.id,
          course: 2,
          program: 'Информационные системы и технологии',
          faculty: 'Факультет информационных технологий'
        }
      }
    }
  })

  const student4 = await prisma.user.create({
    data: {
      email: 'student4@lab.local',
      passwordHash,
      firstName: 'Михаил',
      lastName: 'Новikov',
      patronymic: 'Сергеевич',
      phone: '+375291234570',
      role: 'STUDENT',
      status: 'ACTIVE',
      student: {
        create: {
          studentIdNumber: '2022001',
          groupId: group2.id,
          course: 3,
          program: 'Информационные системы и технологии',
          faculty: 'Факультет информационных технологий'
        }
      }
    }
  })

  const student5 = await prisma.user.create({
    data: {
      email: 'student5@lab.local',
      passwordHash,
      firstName: 'Ольга',
      lastName: 'Соколова',
      patronymic: 'Владимировна',
      phone: '+375291234571',
      role: 'STUDENT',
      status: 'ACTIVE',
      student: {
        create: {
          studentIdNumber: '2023004',
          groupId: group3.id,
          course: 2,
          program: 'Программная инженерия',
          faculty: 'Факультет информационных технологий'
        }
      }
    }
  })

  // 5. Создаём дисциплины
  console.log('Creating disciplines...')
  const teacher1Data = await prisma.teacher.findUnique({
    where: { userId: teacher1.id }
  })

  const teacher2Data = await prisma.teacher.findUnique({
    where: { userId: teacher2.id }
  })

  const teacher3Data = await prisma.teacher.findUnique({
    where: { userId: teacher3.id }
  })

  const discipline1 = await prisma.discipline.create({
    data: {
      name: 'Веб-программирование',
      description: 'Изучение современных веб-технологий: HTML, CSS, JavaScript, React, Node.js',
      semester: 4,
      year: 2024,
      hours: 120,
      status: 'PUBLISHED',
      createdById: teacher1Data!.id
    }
  })

  const discipline2 = await prisma.discipline.create({
    data: {
      name: 'Базы данных',
      description: 'Проектирование и администрирование реляционных и NoSQL баз данных',
      semester: 4,
      year: 2024,
      hours: 90,
      status: 'PUBLISHED',
      createdById: teacher2Data!.id
    }
  })

  const discipline3 = await prisma.discipline.create({
    data: {
      name: 'Алгоритмы и структуры данных',
      description: 'Изучение базовых алгоритмов сортировки, поиска, работы с графами и деревьями',
      semester: 3,
      year: 2024,
      hours: 100,
      status: 'PUBLISHED',
      createdById: teacher3Data!.id
    }
  })

  // 6. Назначаем преподавателей на дисциплины
  console.log('Assigning teachers to disciplines...')
  await prisma.disciplineTeacher.createMany({
    data: [
      { disciplineId: discipline1.id, teacherId: teacher1Data!.id },
      { disciplineId: discipline2.id, teacherId: teacher2Data!.id },
      { disciplineId: discipline2.id, teacherId: teacher1Data!.id }, // Иванов также ведёт БД
      { disciplineId: discipline3.id, teacherId: teacher3Data!.id }
    ]
  })

  // 7. Назначаем группы на дисциплины
  console.log('Assigning groups to disciplines...')
  await prisma.disciplineGroup.createMany({
    data: [
      { disciplineId: discipline1.id, groupId: group1.id, semester: 4, year: 2024 },
      { disciplineId: discipline1.id, groupId: group3.id, semester: 4, year: 2024 },
      { disciplineId: discipline2.id, groupId: group1.id, semester: 4, year: 2024 },
      { disciplineId: discipline2.id, groupId: group2.id, semester: 4, year: 2024 },
      { disciplineId: discipline3.id, groupId: group2.id, semester: 3, year: 2024 }
    ]
  })

  // 8. Создаём лабораторные работы
  console.log('Creating lab works...')
  const labWork1 = await prisma.labWork.create({
    data: {
      disciplineId: discipline1.id,
      number: 1,
      title: 'Введение в HTML и CSS',
      description: 'Создание статической веб-страницы с использованием HTML5 и CSS3. Необходимо реализовать адаптивный дизайн.',
      requirements: '1. Использовать семантические HTML теги\n2. Применить CSS Grid или Flexbox\n3. Реализовать адаптивность для мобильных устройств',
      publishedAt: new Date('2024-09-01'),
      dueDate: new Date('2024-09-15'),
      maxScore: 100,
      allowResubmit: true,
      maxAttempts: 3,
      allowedFormats: ['html', 'css', 'zip'],
      maxFileSize: 10485760, // 10 MB
      status: 'PUBLISHED'
    }
  })

  const labWork2 = await prisma.labWork.create({
    data: {
      disciplineId: discipline1.id,
      number: 2,
      title: 'JavaScript: DOM и события',
      description: 'Создание интерактивной веб-страницы с использованием JavaScript.',
      requirements: '1. Манипуляция DOM элементами\n2. Обработка событий\n3. Валидация форм',
      publishedAt: new Date('2024-09-16'),
      dueDate: new Date('2024-09-30'),
      maxScore: 100,
      allowResubmit: true,
      maxAttempts: 3,
      allowedFormats: ['html', 'js', 'css', 'zip'],
      maxFileSize: 10485760,
      status: 'PUBLISHED'
    }
  })

  const labWork3 = await prisma.labWork.create({
    data: {
      disciplineId: discipline2.id,
      number: 1,
      title: 'Проектирование БД',
      description: 'Разработка ER-диаграммы для информационной системы учёта лабораторных работ.',
      requirements: '1. Определить сущности и атрибуты\n2. Установить связи между сущностями\n3. Нормализовать до 3НФ',
      publishedAt: new Date('2024-09-01'),
      dueDate: new Date('2024-09-20'),
      maxScore: 100,
      allowResubmit: true,
      maxAttempts: 2,
      allowedFormats: ['pdf', 'png', 'jpg', 'drawio'],
      maxFileSize: 5242880, // 5 MB
      status: 'PUBLISHED'
    }
  })

  // 9. Создаём критерии оценивания
  console.log('Creating criteria...')
  await prisma.criterion.createMany({
    data: [
      // Для лабораторной 1
      {
        labWorkId: labWork1.id,
        name: 'Использование HTML5 семантики',
        description: 'Правильное применение семантических тегов',
        maxScore: 30,
        order: 1
      },
      {
        labWorkId: labWork1.id,
        name: 'CSS стилизация',
        description: 'Качество и аккуратность оформления',
        maxScore: 40,
        order: 2
      },
      {
        labWorkId: labWork1.id,
        name: 'Адаптивность',
        description: 'Корректное отображение на разных устройствах',
        maxScore: 30,
        order: 3
      },
      // Для лабораторной 2
      {
        labWorkId: labWork2.id,
        name: 'Работа с DOM',
        description: 'Корректная манипуляция элементами',
        maxScore: 40,
        order: 1
      },
      {
        labWorkId: labWork2.id,
        name: 'Обработка событий',
        description: 'Правильная обработка пользовательских действий',
        maxScore: 30,
        order: 2
      },
      {
        labWorkId: labWork2.id,
        name: 'Валидация форм',
        description: 'Полнота проверок и обработка ошибок',
        maxScore: 30,
        order: 3
      },
      // Для лабораторной 3
      {
        labWorkId: labWork3.id,
        name: 'Полнота модели',
        description: 'Все необходимые сущности определены',
        maxScore: 40,
        order: 1
      },
      {
        labWorkId: labWork3.id,
        name: 'Правильность связей',
        description: 'Корректное определение кардинальностей',
        maxScore: 30,
        order: 2
      },
      {
        labWorkId: labWork3.id,
        name: 'Нормализация',
        description: 'Соответствие 3НФ',
        maxScore: 30,
        order: 3
      }
    ]
  })

  console.log('✅ Seed completed successfully!')
  console.log('\n📋 Created users:')
  console.log('Admin: admin@lab.local / 123456')
  console.log('Teacher 1: ivanov@lab.local / 123456')
  console.log('Teacher 2: petrova@lab.local / 123456')
  console.log('Teacher 3: sidorov@lab.local / 123456')
  console.log('Student 1: student1@lab.local / 123456')
  console.log('Student 2: student2@lab.local / 123456')
  console.log('Student 3: student3@lab.local / 123456')
  console.log('Student 4: student4@lab.local / 123456')
  console.log('Student 5: student5@lab.local / 123456')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
