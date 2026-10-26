import type { ServerEntry } from "@/types/server/server-entry";

import { CSP_NONCE_HEADER, contentSecurityPolicy, createCspNonce } from "./lib/csp";
import "./lib/error-capture";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

/**
 * Security headers on every SSR response. The CSP lives in `lib/csp.ts` (per-request nonce).
 * COOP isolates the window from cross-origin openers/popups; CORP keeps other sites from
 * embedding our responses.
 */
const SECURITY_HEADERS: Record<string, string> = {
  "x-frame-options": "DENY",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "geolocation=(), microphone=(), camera=()",
  "strict-transport-security": "max-age=31536000; includeSubDomains",
  "cross-origin-opener-policy": "same-origin",
  "cross-origin-resource-policy": "same-site",
};

/** Pages whose URL carries a secret (OAuth `code`/`state`, reset or email-confirmation token). */
const NO_REFERRER_PATHS = ["/auth/callback", "/auth/reset", "/auth/verify"];

export function withSecurityHeaders(
  response: Response,
  request: Request,
  nonce: string | null,
): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(name)) headers.set(name, value);
  }
  if (!headers.has("content-security-policy")) {
    headers.set("content-security-policy", contentSecurityPolicy(nonce));
  }
  if (NO_REFERRER_PATHS.includes(new URL(request.url).pathname)) {
    headers.set("referrer-policy", "no-referrer");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    // Dev serves Vite's inline, un-nonced HMR preamble: no nonce there (CSP falls back).
    const nonce = import.meta.env.DEV ? null : createCspNonce();
    // Set in place (the runtime's request object cannot be re-wrapped); always overwritten, so a
    // client-sent value never survives.
    if (nonce) request.headers.set(CSP_NONCE_HEADER, nonce);
    else request.headers.delete(CSP_NONCE_HEADER);
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return withSecurityHeaders(await normalizeCatastrophicSsrResponse(response), request, nonce);
    } catch (error) {
      console.error(error);
      return withSecurityHeaders(
        new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
        request,
        nonce,
      );
    }
  },
};
