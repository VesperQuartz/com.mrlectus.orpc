import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { API_PREFIX } from "#/config";
import { serverPlugins } from "#/plugins/server";
import { router } from "#/router";

export const handler = new OpenAPIHandler(router, {
  plugins: serverPlugins,
});

export const fetch = async (request: Request): Promise<Response> => {
  const { matched, response } = await handler.handle(request, {
    prefix: API_PREFIX,
    context: {},
  });

  if (matched) {
    return response;
  }

  return new Response("Not Found", { status: 404 });
};
