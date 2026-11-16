import 'server-only';
import type { NextRequest } from 'next/server';
import { errorResponse, guard } from './api';

type Ctx<P> = { params: Promise<P> };

/** 인증 + Origin 검사 + 오류 처리를 감싼 라우트 핸들러 */
export function authed<P = Record<string, string>>(fn: (req: NextRequest, params: P) => Promise<Response> | Response) {
  return async (req: NextRequest, ctx: Ctx<P>) => {
    try {
      guard(req);
      return await fn(req, (await ctx?.params) as P);
    } catch (e) {
      return errorResponse(e);
    }
  };
}
