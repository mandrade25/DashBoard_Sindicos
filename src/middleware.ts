import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = ["/login"];

// Header que instrui o Cloudflare (e qualquer CDN/proxy intermediário) a NUNCA
// cachear respostas de rotas autenticadas. Sem isso, o Cloudflare pode cachear o
// payload RSC do dashboard e continuar servindo referências a chunks antigos mesmo
// após um rebuild limpo no servidor.
const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  "CDN-Cache-Control": "no-store",
  "Cloudflare-CDN-Cache-Control": "no-store",
  Pragma: "no-cache",
};

function applyNoCacheHeaders(response: NextResponse): NextResponse {
  Object.entries(NO_CACHE_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = token.role;

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (pathname.startsWith("/api/admin") && role !== "ADMIN") {
    // Síndico pode baixar arquivo de comprovante — acesso controlado na própria rota
    if (/^\/api\/admin\/comprovantes\/[^/]+\/arquivo$/.test(pathname)) {
      return applyNoCacheHeaders(NextResponse.next());
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Rotas autenticadas: sempre no-store para impedir cache de CDN
  return applyNoCacheHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|logo-modelo1.svg|logo-modelo2.svg).*)",
  ],
};
