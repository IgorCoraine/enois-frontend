// @vitest-environment jsdom
import { act } from "react";
import * as React from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { MarketplaceListing } from "@/types/application/marketplace/marketplace-listing";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useListingTheme } from "./use-listing-theme";

/**
 * A galeria de temas só tem o que o marketplace vende: o **tema**. Buscar o pacote JSON do tema
 * para um banner, template, página, post, blog ou serviço dava 404 em cada item da vitrine —
 * o caminho errado no console e uma chamada à toa por item.
 */
const mocks = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("@/lib/api", () => ({ themesApi: { get: mocks.get } }));

function listagem(overrides: Partial<MarketplaceListing>): MarketplaceListing {
  return {
    id: "mkt_1",
    sellerId: "user_1",
    sellerName: "Vendedor",
    sellerUsername: "vendedor",
    itemKind: "THEME",
    itemId: "theme_1",
    title: "Um tema",
    description: "Descrição",
    price: 1000,
    status: "ACTIVE",
    createdAt: "2026-10-22T12:00:00Z",
    ...overrides,
  } as MarketplaceListing;
}

describe("prévia da galeria na vitrine", () => {
  let root: Root;
  let host: HTMLDivElement;
  let queryClient: QueryClient;

  beforeEach(() => {
    mocks.get.mockReset().mockResolvedValue({ id: "theme_1", name: "Um tema" });
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  const montar = (listing: MarketplaceListing) =>
    act(() => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <Probe listing={listing} />
        </QueryClientProvider>,
      );
    });

  it("busca a galeria quando o item é um tema", async () => {
    await montar(listagem({ itemKind: "THEME", itemId: "theme_1" }));
    await act(async () => {
      await Promise.resolve();
    });
    expect(mocks.get).toHaveBeenCalledWith("theme_1");
  });

  it("NÃO busca a galeria quando o item não é tema", async () => {
    for (const kind of ["BANNER", "TEMPLATE", "PAGE", "POST", "BLOG", "SERVICE"] as const) {
      mocks.get.mockClear();
      await montar(listagem({ itemKind: kind, itemId: "mitem_1" }));
      await act(async () => {
        await Promise.resolve();
      });
      expect(mocks.get).not.toHaveBeenCalled();
    }
  });
});

/** Componente mínimo que dispara a consulta. */
function Probe({ listing }: { listing: MarketplaceListing }) {
  const consulta = useListingTheme(listing);
  return <span>{consulta.data ? "com tema" : "sem tema"}</span>;
}
