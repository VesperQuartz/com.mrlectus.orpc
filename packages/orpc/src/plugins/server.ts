import { SmartCoercionHandlerPlugin } from "@orpc/json-schema";
import { OpenAPIGenerator } from "@orpc/openapi";
import { OpenAPIReferenceHandlerPlugin } from "@orpc/openapi/plugins";
import { PinoHandlerPlugin } from "@orpc/pino";
import {
  BatchHandlerPlugin,
  CORSHandlerPlugin,
  GetMethodCsrfProtectionHandlerPlugin,
  RequestCompressionHandlerPlugin,
  RequestHeadersHandlerPlugin,
  RequestLimitHandlerPlugin,
  ResponseCompressionHandlerPlugin,
  ResponseHeadersHandlerPlugin,
} from "@orpc/server/plugins";
import type { StandardHandlerPlugin } from "@orpc/server/standard";
import { ZodToJsonSchemaConverter } from "@orpc/zod";
import type { ORPCContext } from "#/base";
import { BATCH_MAX_SIZE, COMPRESSION_THRESHOLD, MAX_REQUEST_BODY_SIZE } from "#/config";
import { logger } from "#/logger";
import { router } from "#/router";

const { NODE_ENV, CORS_ORIGINS } = process.env;
const isProduction = NODE_ENV === "production";

const configuredOrigins = (CORS_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOrigin: string[] | null | ((origin: string) => string) =
  configuredOrigins.length > 0 ? configuredOrigins : isProduction ? null : (origin) => origin;

const zodConverter = new ZodToJsonSchemaConverter();

const generator = new OpenAPIGenerator({
  converters: [zodConverter],
});

export const serverPlugins: StandardHandlerPlugin<ORPCContext>[] = [
  new PinoHandlerPlugin<ORPCContext>({
    logger,
    logLifecycle: true,
    logAbort: true,
  }),
  new CORSHandlerPlugin<ORPCContext>({
    origin: corsOrigin,
    credentials: true,
    exposeHeaders: ["Content-Disposition", "Standard-Server"],
  }),
  new BatchHandlerPlugin<ORPCContext>({ maxSize: BATCH_MAX_SIZE }),
  new RequestCompressionHandlerPlugin<ORPCContext>(),
  new RequestLimitHandlerPlugin<ORPCContext>({
    maxBodySize: MAX_REQUEST_BODY_SIZE,
  }),
  new ResponseCompressionHandlerPlugin<ORPCContext>({
    encodings: ["gzip", "deflate"],
    threshold: COMPRESSION_THRESHOLD,
  }),
  new RequestHeadersHandlerPlugin<ORPCContext>(),
  new ResponseHeadersHandlerPlugin<ORPCContext>(),
  new GetMethodCsrfProtectionHandlerPlugin<ORPCContext>(),
  new OpenAPIReferenceHandlerPlugin<ORPCContext, "scalar">({
    provider: "scalar",
    spec: () =>
      generator.generate(router, {
        base: {
          info: {
            title: "oRPC API",
            version: "1.0.0",
          },
        },
      }),
    docsPath: "/docs",
    specPath: "/spec.json",
    docsTitle: "oRPC API Reference",
  }),
  new SmartCoercionHandlerPlugin<ORPCContext>({
    converters: [zodConverter],
  }),
];
