export type AppLanguage = 'ru' | 'en' | 'be'

const translations = {
  ru: {
    dashboard: 'Панель управления',
    users: 'Пользователи',
    groups: 'Группы',
    disciplines: 'Дисциплины',
    labWorks: 'Лабораторные работы',
    submissions: 'Сдачи работ',
    settings: 'Настройки',
    loading: 'Загрузка...',
    save: 'Сохранить',
    cancel: 'Отмена',
    create: 'Создать',
    edit: 'Редактировать',
    status: 'Статус',
    search: 'Поиск'
  },
  en: {
    dashboard: 'Dashboard',
    users: 'Users',
    groups: 'Groups',
    disciplines: 'Disciplines',
    labWorks: 'Laboratory works',
    submissions: 'Submissions',
    settings: 'Settings',
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    create: 'Create',
    edit: 'Edit',
    status: 'Status',
    search: 'Search'
  },
  be: {
    dashboard: 'Панэль кіравання',
    users: 'Карыстальнікі',
    groups: 'Групы',
    disciplines: 'Дысцыпліны',
    labWorks: 'Лабараторныя работы',
    submissions: 'Здачы работ',
    settings: 'Налады',
    loading: 'Загрузка...',
    save: 'Захаваць',
    cancel: 'Адмена',
    create: 'Стварыць',
    edit: 'Рэдагаваць',
    status: 'Статус',
    search: 'Пошук'
  }
} as const

export type TranslationKey = keyof typeof translations.ru

export function translate(language: AppLanguage | undefined, key: TranslationKey) {
  return translations[language || 'ru'][key]
}
