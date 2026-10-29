# Система сдачи и проверки лабораторных работ

Веб-приложение для автоматизации процесса сдачи, проверки и оценивания лабораторных работ в образовательных учреждениях.

## Архитектура

Проект построен на микросервисной архитектуре:

- **apps/frontend** — Next.js 14+ (App Router) приложение
- **apps/backend** — Express + TypeScript API сервер
- **packages/database** — Prisma схема и миграции (shared)
- **packages/types** — Общие TypeScript типы

## Технологии

### Frontend
- Next.js 14+ (App Router, React Server Components)
- TypeScript
- Tailwind CSS
- TanStack Query (React Query)
- Zod для валидации
- React Hook Form

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT авторизация
- Multer для загрузки файлов

### Infrastructure
- Docker + Docker Compose
- PostgreSQL 16
- Redis (для будущей автопроверки)

## Быстрый старт

### Требования
- Node.js >= 18
- Docker Desktop
- npm >= 9

### Установка

```bash
# Установить зависимости
npm install

# Запустить базу данных
docker compose up -d postgres

# Применить миграции
npm run db:migrate

# Запустить в режиме разработки
npm run dev
```

### Доступ

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- PostgreSQL: localhost:5432
- Prisma Studio: `npm run db:studio`

### Тестовые аккаунты

После применения миграций выполни заполнение тестовыми данными:

```powershell
npm.cmd run db:seed
```

Seed рассчитан на пустую базу. Если он уже запускался и завершился частично,
для локальной разработки используй:

```powershell
npm.cmd run db:reset
npm.cmd run db:seed
```

`db:reset` удаляет локальные данные, поэтому не запускай его для production.

Все тестовые аккаунты используют пароль `123456`:

| Роль | Логин |
|---|---|
| Администратор | `admin@lab.local` |
| Преподаватель | `ivanov@lab.local` |
| Преподаватель | `petrova@lab.local` |
| Преподаватель | `sidorov@lab.local` |
| Студент | `student1@lab.local` |
| Студент | `student2@lab.local` |
| Студент | `student3@lab.local` |
| Студент | `student4@lab.local` |
| Студент | `student5@lab.local` |

Это демонстрационные данные только для локальной разработки. В production их использовать нельзя.

## Структура проекта

```
lab-management-system/
├── apps/
│   ├── frontend/         # Next.js приложение
│   └── backend/          # Express API
├── packages/
│   ├── database/         # Prisma схема
│   └── types/            # Общие типы
├── docker-compose.yml    # Docker конфигурация
└── README.md
```

## Роли пользователей

- **Студент** — просмотр заданий, сдача работ, отслеживание оценок
- **Преподаватель** — создание заданий, проверка работ, выставление оценок
- **Администратор** — управление пользователями, группами, дисциплинами

## Файлы лабораторных работ

Файлы сохраняются в `uploads/` в корне репозитория с уникальным UUID-именем,
а исходное имя и связь с лабораторной работой или отправкой хранятся в таблице
`files`. Доступ к скачиванию выполняется только через авторизованный API:

- `POST /api/files/lab-works/:id/upload` — материалы преподавателя;
- `POST /api/files/submissions/:id/upload` — файлы отправки студента;
- `GET /api/files/:id/download` — скачивание с проверкой роли и принадлежности;
- `DELETE /api/files/:id` — удаление с проверкой прав.

Компонент интерфейса загружает несколько выбранных файлов последовательно,
поэтому при частичной ошибке уже успешно загруженные файлы сохраняются и
отображаются после обновления страницы. Для контейнерного развёртывания
каталог `uploads/` должен быть подключён к постоянному volume вместе с
сервисом backend; текущий `docker-compose.yml` запускает PostgreSQL и Redis,
а production-конфигурация Compose также включает backend и frontend.

## Запуск всего проекта в Docker

Для полного запуска используйте:

```powershell
docker compose up --build
```

Сервисы будут доступны по адресам:

- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- pgAdmin: http://localhost:5050

Backend внутри сети Compose подключается к PostgreSQL по имени `postgres` и
к Redis по имени `redis`. Миграции Prisma выполняются перед запуском API.
Данные PostgreSQL, Redis и загруженные файлы сохраняются в named volumes
`postgres_data`, `redis_data` и `uploads_data`.

Для локальной разработки прежние команды `npm run dev`, `npm run db:migrate`
и `npm run db:seed` сохраняются. Значение `NEXT_PUBLIC_API_URL` должно быть
доступно браузеру пользователя; внутри Docker по умолчанию это
`http://localhost:4000/api`, а не имя сервиса `backend`.

## Разработка

### Команды

```bash
# Разработка
npm run dev                 # Запустить frontend + backend
npm run dev:frontend        # Только frontend
npm run dev:backend         # Только backend

# База данных
npm run db:migrate          # Применить миграции
npm run db:studio           # Открыть Prisma Studio

# Сборка
npm run build               # Собрать все приложения
```

## Roadmap

### Курсовой проект (MVP)
- [x] Инициализация проекта
- [ ] Авторизация и роли
- [ ] CRUD дисциплин и заданий
- [ ] Загрузка и проверка работ
- [ ] Выставление оценок
- [ ] Уведомления

### Дипломный проект (расширение)
- [ ] Автопроверка кода (sandbox)
- [ ] Очереди проверки (BullMQ + Redis)
- [ ] S3 файловое хранилище
- [ ] Аналитика и отчёты
- [ ] Плагиат-детектор
