import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";

const SW_SOURCE = readFileSync(fileURLToPath(new URL("../public/sw.js", import.meta.url)), "utf8");

/** Runs public/sw.js against a fake worker scope and returns its fetch handler and cache spies. */
function loadWorker(network: () => Promise<Response>) {
  const listeners: Record<
    string,
    (event: {
      request: { method: string; url: string; mode: string; destination: string };
      respondWith: (response: Promise<Response>) => void;
    }) => void
  > = {};
  const put = vi.fn();
  const offline = new Response("offline page");
  const caches = {
    open: vi.fn(async () => ({ put, addAll: vi.fn() })),
    match: vi.fn(async (key: unknown) => (key === "/offline.html" ? offline : undefined)),
    keys: vi.fn(async () => []),
  };
  const self = {
    location: { origin: "https://enois.ia.br" },
    addEventListener: (type: string, handler: (typeof listeners)[string]) => {
      listeners[type] = handler;
    },
  };
  new Function("self", "caches", "fetch", SW_SOURCE)(self, caches, vi.fn(network));
  return { onFetch: listeners.fetch, caches, put, offline };
}

function navigate(onFetch: ReturnType<typeof loadWorker>["onFetch"]): Promise<Response> {
  let responded: Promise<Response> | undefined;
  onFetch({
    request: { method: "GET", url: "https://enois.ia.br/feed", mode: "navigate", destination: "" },
    respondWith: (response) => {
      responded = response;
    },
  });
  return responded!;
}

describe("service worker navigations", () => {
  it("never stores page HTML", async () => {
    const { onFetch, caches, put } = loadWorker(async () => new Response("<html>logado</html>"));

    expect(await (await navigate(onFetch)).text()).toBe("<html>logado</html>");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(caches.open).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });

  it("falls back to the offline page, never to a cached page, without network", async () => {
    const { onFetch, caches, offline } = loadWorker(async () => {
      throw new TypeError("offline");
    });

    expect(await navigate(onFetch)).toBe(offline);
    expect(caches.match).toHaveBeenCalledTimes(1);
    expect(caches.match).toHaveBeenCalledWith("/offline.html");
  });
});
