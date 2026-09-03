import { createORPCClient } from "@orpc/client";
import { OpenAPILink } from "@orpc/openapi/fetch";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { API_PREFIX } from "#/config";
import { linkPlugins } from "#/plugins/link";
import { router } from "#/router";

export const link = new OpenAPILink(router, {
  url: API_PREFIX,
  fetch: (request, init) =>
    globalThis.fetch(request, {
      ...init,
      credentials: "include",
    }),
  plugins: linkPlugins,
});

export const client: RouterClient<typeof router> = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
