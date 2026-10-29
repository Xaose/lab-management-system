# Инструкция по запуску проекта

## ✅ Что уже сделано

1. ✅ Создана структура проекта (монорепозиторий)
2. ✅ Настроен Backend (Express + TypeScript)
3. ✅ Настроен Frontend (Next.js 14)
4. ✅ Создана полная схема БД в Prisma
5. ✅ Установлены все зависимости (`npm install`)

## 📦 Что нужно установить

### 1. Docker Desktop (обязательно!)

Docker нужен для запуска базы данных PostgreSQL.

**Установка:**
1. Скачай: https://www.docker.com/products/docker-desktop
2. Установи и перезагрузи компьютер
3. Запусти Docker Desktop (должна появиться иконка кита в системном трее)
4. Дождись, когда Docker запустится (статус "Docker is running")

**Проверка установки:**
```bash
docker --version
# Должно вывести: Docker version 24.x.x или выше
```

### 2. Node.js (уже должен быть установлен)

Проверка:
```bash
node --version
# Должно быть >= 18.0.0
```

> **PowerShell в Windows:** если команда `npm` завершается ошибкой о блокировке
> `npm.ps1` (`PSSecurityException`), используйте `npm.cmd` вместо `npm`.
> Например: `npm.cmd run db:migrate`. Это не меняет политику безопасности Windows.

---

## 🚀 Первый запуск

### Шаг 1: Запустить базу данных PostgreSQL

```bash
# Находясь в корне проекта C:\25\lab-management-system
docker compose up -d postgres
```

**Что произойдёт:**
- Скачается образ PostgreSQL (первый раз занимает ~2-3 минуты)
- Запустится контейнер с базой данных на порту 5432
- Создастся база `lab_management` с пользователем `labuser`

**Проверка:**
```bash
docker ps
# Должен показать запущенный контейнер lab_db
```

### Шаг 2: Применить миграции Prisma

```bash
# Создать таблицы в базе данных
npm.cmd run db:migrate
```

Команда читает `DATABASE_URL` из файла `.env` в корне проекта. Если файла нет,
скопируй `.env.example` в `.env` и проверь значение подключения к PostgreSQL.

**Что произойдёт:**
- Prisma создаст все таблицы согласно схеме `packages/database/prisma/schema.prisma`
- Будет создана папка `prisma/migrations` с SQL-файлами миграций

**Ввод:** Когда спросит название миграции, введи: `init`

### Шаг 3: Загрузить тестовые данные

```bash
npm.cmd run db:seed
```

Seed рассчитан на пустую базу. Если он уже запускался частично и повторно
завершается ошибкой `Unique constraint failed`, для локальной разработки можно
полностью пересоздать базу и затем повторить seed:

```powershell
npm.cmd run db:reset
npm.cmd run db:seed
```

> `db:reset` удаляет все данные в локальной базе PostgreSQL. Не используй эту
> команду для production-базы.

После seed можно войти в систему с аккаунтом администратора:

- Логин: `admin@lab.local`
- Пароль: `123456`

Дополнительные тестовые аккаунты преподавателей и студентов перечислены в [README.md](./README.md).

### Шаг 4: Запустить приложение

**Вариант A: Запустить Frontend + Backend одной командой**
```bash
npm.cmd run dev
```

**Вариант B: Запустить по отдельности (в двух терминалах)**

*Терминал 1 (Backend):*
```bash
npm.cmd run dev:backend
```

*Терминал 2 (Frontend):*
```bash
npm run dev:frontend
```

---

## 🌐 Доступ к приложению

После запуска:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Health check**: http://localhost:4000/health

### Дополнительно (опционально):

**pgAdmin** — GUI для управления PostgreSQL:
```bash
docker compose up -d pgadmin
```
Доступ: http://localhost:5050
- Email: `admin@lab.local`
- Password: `admin`

**Prisma Studio** — GUI для просмотра данных:
```bash
npm run db:studio
```
Откроется браузер на http://localhost:5555

---

## 🧪 Тестирование API

### Вход в систему

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.ru",
    "password": "пароль, выданный администратором"
  }'
```

Регистрация отключена. Пользователей, их роли и первоначальные пароли создаёт администратор через раздел управления пользователями.

Ответ будет содержать `token` — сохрани его для дальнейших запросов.

### 3. Получить текущего пользователя

```bash
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer ВАШ_ТОКЕН"
```

---

## 🛠️ Полезные команды

### База данных
```bash
# Применить миграции
npm run db:migrate

# Открыть Prisma Studio
npm run db:studio

# Сбросить БД (удалит все данные!)
npx prisma migrate reset --workspace=packages/database
```

### Docker
```bash
# Запустить все сервисы
docker compose up -d

# Остановить все сервисы
docker compose down

# Посмотреть логи PostgreSQL
docker compose logs postgres

# Подключиться к PostgreSQL через CLI
docker exec -it lab_db psql -U labuser -d lab_management
```

### Разработка
```bash
# Запустить оба приложения
npm run dev

# Только backend
npm run dev:backend

# Только frontend
npm run dev:frontend

# Сборка для продакшена
npm run build
```

---

## 📂 Структура проекта

```
lab-management-system/
├── apps/
│   ├── backend/              # Express API сервер
│   │   ├── src/
│   │   │   ├── controllers/  # Бизнес-логика
│   │   │   ├── routes/       # API маршруты
│   │   │   ├── middleware/   # Auth, validation, errors
│   │   │   └── index.ts      # Точка входа
│   │   └── package.json
│   │
│   └── frontend/             # Next.js приложение
│       ├── src/
│       │   ├── app/          # App Router (страницы)
│       │   ├── components/   # React компоненты
│       │   └── lib/          # Утилиты, API клиент
│       └── package.json
│
├── packages/
│   ├── database/             # Prisma ORM
│   │   ├── prisma/
│   │   │   └── schema.prisma # Схема базы данных
│   │   └── index.ts          # Prisma Client
│   │
│   └── types/                # Общие TypeScript типы
│       └── index.ts
│
├── docker-compose.yml        # Docker конфигурация
├── .env                      # Переменные окружения
└── package.json              # Root package.json (workspaces)
```

---

## ❓ Частые проблемы

### 1. "docker: command not found"
**Решение:** Установи Docker Desktop и перезагрузи компьютер.

### 2. "Port 5432 is already allocated"
**Решение:** У тебя уже запущен PostgreSQL локально. Останови его:
```bash
# Остановить системный PostgreSQL (Windows)
net stop postgresql-x64-16

# Или измени порт в docker-compose.yml на 5433
```

### 3. "Prisma Client не найден"
**Решение:**
```bash
npm run db:generate --workspace=packages/database
```

### 4. Backend не запускается
**Проверь:**
- Запущен ли Docker контейнер: `docker ps`
- Применены ли миграции: `npm run db:migrate`
- Правильно ли указан `DATABASE_URL` в `.env`

### 5. Frontend не запускается
**Решение:**
```bash
cd apps/frontend
rm -rf .next node_modules
npm install
npm run dev
```

---

## 🎯 Следующие шаги разработки

### 1. Авторизация (уже готово! ✅)
- [x] Регистрация
- [x] Вход
- [x] JWT токены
- [x] Middleware для защиты роутов

### 2. Frontend авторизация
- [ ] Страница входа `/auth/login`
- [ ] Страница регистрации `/auth/register`
- [ ] AuthContext для хранения пользователя
- [ ] Protected routes

### 3. Функционал для студентов
- [ ] Просмотр дисциплин
- [ ] Просмотр лабораторных работ
- [ ] Загрузка файлов
- [ ] Отслеживание статуса

### 4. Функционал для преподавателей
- [ ] Создание дисциплин
- [ ] Создание лабораторных работ
- [ ] Проверка работ
- [ ] Выставление оценок

### 5. Функционал для администраторов
- [ ] Управление пользователями
- [ ] Управление группами
- [ ] Статистика

---

## 📞 Нужна помощь?

Если что-то не работает:
1. Проверь, что Docker Desktop запущен
2. Посмотри логи: `docker compose logs`
3. Проверь переменные окружения в `.env`
4. Убедись, что все зависимости установлены: `npm install`
