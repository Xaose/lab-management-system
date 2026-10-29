import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Получаем токен из cookie
  const authToken = request.cookies.get('auth-token')?.value
  const authUser = request.cookies.get('auth-user')?.value

  let user = null
  if (authUser) {
    try {
      user = JSON.parse(authUser)
    } catch (e) {
      // Invalid JSON
    }
  }

  const isAuthenticated = !!authToken && !!user
  const userRole = user?.role

  // Публичные маршруты (только страница входа)
  const publicRoutes = ['/auth/login']
  const isPublicRoute = publicRoutes.includes(pathname)

  // Главная страница
  if (pathname === '/') {
    if (isAuthenticated) {
      // Перенаправить в кабинет
      const role = userRole.toLowerCase()
      return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url))
    } else {
      // Перенаправить на вход
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  // Маршруты авторизации
  const isAuthRoute = pathname.startsWith('/auth')

  // Если пользователь авторизован и пытается зайти на страницу входа
  if (isAuthenticated && isAuthRoute) {
    const role = userRole.toLowerCase()
    return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url))
  }

  // Если маршрут публичный, пропускаем
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Проверка авторизации для защищённых маршрутов
  if (!isAuthenticated) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Проверка доступа по ролям
  if (pathname.startsWith('/student') && userRole !== 'STUDENT') {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  if (pathname.startsWith('/teacher') && userRole !== 'TEACHER') {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  if (pathname.startsWith('/admin') && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
}
