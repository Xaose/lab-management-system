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
      user = JSON.parse(decodeURIComponent(authUser))
    } catch (e) {
      try {
        user = JSON.parse(authUser)
      } catch {
        user = null
      }
    }
  }

  let tokenPayload: { role?: string } | null = null
  if (authToken) {
    try {
      const encodedPayload = authToken.split('.')[1]
      if (encodedPayload) {
        const normalizedPayload = encodedPayload.replace(/-/g, '+').replace(/_/g, '/')
        tokenPayload = JSON.parse(atob(normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '=')))
      }
    } catch {
      tokenPayload = null
    }
  }

  const isAuthenticated = !!authToken && !!tokenPayload
  const userRole = typeof user?.role === 'string' ? user.role : tokenPayload?.role || null

  // Публичные маршруты (только страница входа)
  const publicRoutes = ['/auth/login']
  const isPublicRoute = publicRoutes.includes(pathname)

  // Главная страница
  if (pathname === '/') {
    if (isAuthenticated) {
      // Перенаправить в кабинет
      const role = userRole?.toLowerCase()
      if (!role) return NextResponse.redirect(new URL('/auth/login', request.url))
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
    const role = userRole?.toLowerCase()
    if (!role) return NextResponse.redirect(new URL('/auth/login', request.url))
    return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url))
  }

  // Если маршрут публичный, пропускаем
  if (isPublicRoute) {
    const response = NextResponse.next()
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    return response
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
