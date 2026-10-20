// ================================================================
// Claims exclusivas do JWT do Portal do Cliente.
// Arquivo SEM dependências (não importa Prisma/next/headers) para ser
// seguro de importar no Edge Runtime (src/middleware.ts) e em contextos
// serverless.
// ================================================================

/** Issuer exclusivo dos tokens de sessão do Portal (`portal_session`). */
export const PORTAL_SESSION_ISSUER = "engeserv-portal";

/** Audience exclusiva dos tokens de sessão do Portal (`portal_session`). */
export const PORTAL_SESSION_AUDIENCE = "engeserv-portal-client";

/**
 * Nome do cookie de sessão do Portal — fonte única em portal-auth,
 * middleware e logout para evitar drift entre emissor e validador.
 */
export const PORTAL_SESSION_COOKIE = "portal_session";

/** Issuer das sessões do sistema interno (`engeserv_session`). */
export const INTERNAL_SESSION_ISSUER = "engeserv-inspector";

/** Audience das sessões do sistema interno (`engeserv_session`). */
export const INTERNAL_SESSION_AUDIENCE = "engeserv-inspector-app";
