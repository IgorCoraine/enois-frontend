import { useQuery } from "@tanstack/react-query";

import type { MarketplaceListing } from "@/types/application/marketplace/marketplace-listing";

import { themesApi } from "@/lib/api";

/**
 * O pacote JSON da galeria de temas, para a prévia da listagem.
 *
 * Só a listagem de **TEMA** tem o que buscar: o `itemId` de um tema aponta para a galeria
 * (`theme_gallery`), e o de um banner, template, página, post, blog ou serviço aponta para o
 * próprio item do marketplace. Buscar a galeria para esses tipos dava **404 em cada item** da
 * vitrine (e o caminho errado no console).
 */
export function useListingTheme(listing: MarketplaceListing) {
  return useQuery({
    queryKey: ["themes", "item", listing.itemId],
    queryFn: () => themesApi.get(listing.itemId),
    enabled: listing.itemKind === "THEME",
  });
}
