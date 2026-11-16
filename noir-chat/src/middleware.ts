import { NextResponse, type NextRequest } from 'next/server';

// Edge 미들웨어는 DB 에 접근할 수 없으므로 API 요청의 쿠키 존재만 1차 확인한다.
// 실제 세션 검증: 페이지 = requirePageAuth(), API = guard().
// 페이지 리다이렉트는 미들웨어에서 하지 않는다 — Next 가 미들웨어 안의 Host 헤더를 내부 주소(localhost)로
// 바꿔 놓아 휴대폰/Tailscale 접속 시 localhost 로 튕기기 때문. 서버 컴포넌트 redirect() 는 상대 경로를 사용한다.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/api/auth/')) return NextResponse.next();
  if (!req.cookies.has('noir_session')) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  return NextResponse.next();
}

export const config = { matcher: ['/api/:path*'] };
