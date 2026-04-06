import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const auth = req.cookies.get('dashme_auth')?.value
  const secret = process.env.DASHBOARD_SECRET

  const isAuthed = auth && secret && auth === secret
  const isLoginPage = pathname === '/login'
  const isPublic = pathname.startsWith('/api/') || pathname === '/login'

  if (!isPublic && !isAuthed) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isLoginPage && isAuthed) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
