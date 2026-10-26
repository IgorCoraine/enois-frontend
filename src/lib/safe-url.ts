const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

/**
 * The only gate between a stored URL and an `href`: http(s), mailto and relative paths pass,
 * every other scheme (javascript:, data:, vbscript:...) becomes null.
 *
 * Parsing with the WHATWG URL parser (the same one the browser uses when following the link)
 * matters: a regex on the raw string misses " javascript:" or "java\tscript:", which the browser
 * normalizes back into a script URL. Stored values cannot be trusted, since rows saved before the
 * backend validation still exist.
 */
export function safeHref(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    // Relative values resolve against the placeholder base and keep its https: protocol.
    const url = new URL(trimmed, "https://relative.invalid");
    return SAFE_PROTOCOLS.has(url.protocol) ? trimmed : null;
  } catch {
    return null;
  }
}
