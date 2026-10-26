import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";

import { PageSkeleton } from "@/components/skeletons/page-skeleton";

import { readCspNonce } from "./lib/csp";
import { registerBrowserQueryClient } from "./lib/query-client";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Voltando a aba, o TanStack so refaz a busca se os dados estiverem "velhos". Com staleTime 0
        // (o default) ele considerava tudo velho e recarregava o feed a cada troca de aba — o
        // incomodo relatado. Uma janela curta mantem o frescor sem recarregar sem motivo.
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        retry: 1,
      },
    },
  });
  registerBrowserQueryClient(queryClient);

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // Rota lenta (internet fraca, loader demorado): mostra a casca com skeleton em vez de deixar
    // a tela anterior congelada. 400ms (e não o default de 1s) para o skeleton chegar antes de a
    // pessoa achar que o clique não pegou; o mínimo de 300ms segura o skeleton em loaders oscilantes.
    defaultPendingComponent: PageSkeleton,
    defaultPendingMs: 400,
    defaultPendingMinMs: 300,
    // Stamps the request's CSP nonce on every inline script the router renders (see lib/csp.ts).
    ssr: { nonce: readCspNonce() },
  });

  return router;
};
