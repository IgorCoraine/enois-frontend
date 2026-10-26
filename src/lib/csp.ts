import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

/**
 * Internal request header that carries the per-request CSP nonce from the server entry
 * (`server.ts`, which also writes the CSP header) to the router, which stamps it on every inline
 * script it renders. The server entry always overwrites it, so a client cannot choose the nonce.
 */
export const CSP_NONCE_HEADER = "x-enois-csp-nonce";

/**
 * The page CSP. Inline scripts run only with the request's nonce: an injected `<script>` or
 * inline handler does not. Without a nonce (Vite dev server, whose HMR preamble is inline and
 * un-nonced) it falls back to 'unsafe-inline'.
 *
 * Styles keep 'unsafe-inline' (Tailwind/style attributes), media and frames stay https: (CDN,
 * third-party game iframes), frame-ancestors 'none' blocks clickjacking.
 */
export function contentSecurityPolicy(nonce: string | null): string {
  const inlineScripts = nonce ? `'nonce-${nonce}'` : "'unsafe-inline'";
  return [
    "default-src 'self'",
    `script-src 'self' ${inlineScripts} https://challenges.cloudflare.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' https: blob:",
    "connect-src 'self' https: wss: https://challenges.cloudflare.com",
    "frame-src https:",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

/** 128 random bits, base64. */
export function createCspNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

/** The nonce of the request being rendered (server only; the client reads it from the page). */
export const readCspNonce = createIsomorphicFn()
  .server(() => getRequestHeader(CSP_NONCE_HEADER) || undefined)
  .client((): string | undefined => undefined);
