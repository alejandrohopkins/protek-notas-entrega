import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Protege toda la app con usuario/clave (HTTP Basic Auth) cuando BASIC_AUTH_USER
 * y BASIC_AUTH_PASSWORD están configuradas. Si faltan, no bloquea (útil en local).
 */
export function proxy(request: NextRequest) {
  const expectedUser = process.env.BASIC_AUTH_USER;
  const expectedPassword = process.env.BASIC_AUTH_PASSWORD;

  if (!expectedUser || !expectedPassword) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    const decoded = atob(authHeader.slice(6));
    const separatorIndex = decoded.indexOf(":");
    const providedUser = decoded.slice(0, separatorIndex);
    const providedPassword = decoded.slice(separatorIndex + 1);
    if (providedUser === expectedUser && providedPassword === expectedPassword) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Acceso restringido.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Notas de Entrega"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
