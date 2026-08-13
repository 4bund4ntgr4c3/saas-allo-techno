import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { getGlobalStartContext } from "@tanstack/react-start";

import { NotFoundComponent } from "./routes/__root";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  // Nonce CSP généré par requête dans le middleware global (src/start.ts). La
  // SSR TanStack le répand automatiquement sur les balises <script>/<style>
  // inline pour que la CSP stricte les laisse passer.
  const nonce = getGlobalStartContext()?.nonce as string | undefined;

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: NotFoundComponent,
    ssr: {
      ...(nonce ? { nonce } : {}),
    },
  });

  return router;
};
