import { auth } from "@workspace/auth";
import { fetch } from "@workspace/orpc";
import { createLogger } from "@workspace/shared/logger";

const logger = createLogger("server");

const withRequestLog =
  <T extends string>(
    name: string,
    handler: (options: Bun.BunRequest<T>) => Response | Promise<Response>,
  ) =>
  async (options: Bun.BunRequest<T>): Promise<Response> => {
    const requestId = options.headers.get("x-request-id") ?? crypto.randomUUID();
    options.headers.set("x-request-id", requestId);
    const start = performance.now();

    try {
      const response = await handler(options);
      const durationMs = performance.now() - start;
      response.headers.set("x-request-id", requestId);

      logger.info(
        {
          requestId,
          method: options.method,
          path: new URL(options.url).pathname,
          status: response.status,
          durationMs,
        },
        `${name} request`,
      );

      return response;
    } catch (error) {
      logger.error(
        {
          requestId,
          method: options.method,
          path: new URL(options.url).pathname,
          error,
        },
        `${name} request failed`,
      );

      throw error;
    }
  };

const serve = Bun.serve({
  routes: {
    // Better Auth owns its whole subtree (default base path: /api/auth).
    "/api/auth/*": withRequestLog("auth", (request) => auth.handler(request)),
    "/.well-known/apple-app-site-association": {
      GET: () =>
        Response.json({
          applinks: {
            details: [
              {
                appIDs: ["YOUR_TEAM_ID.ng.kekere.app"],
                components: [{ "/": "*" }],
              },
            ],
          },
        }),
    },
    "/.well-known/assetlinks.json": {
      GET: () =>
        Response.json([
          {
            relation: ["delegate_permission/common.handle_all_urls"],
            target: {
              namespace: "android_app",
              package_name: "ng.kekere.app",
              sha256_cert_fingerprints: [""],
            },
          },
        ]),
    },
  },
  fetch,
  http3: import.meta.env.NODE_ENV === "production",
  port: process.env.PORT || 5141,
});

console.log(`Listening on ${serve.protocol}://${serve.hostname}:${serve.port}`);
