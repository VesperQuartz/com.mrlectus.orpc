import "@orpc/openapi/extensions/route";
import type { LoggerContext } from "@orpc/pino";
import { os } from "@orpc/server";
import type {
  RequestHeadersPluginContext,
  ResponseHeadersPluginContext,
} from "@orpc/server/plugins";

export interface ORPCContext
  extends RequestHeadersPluginContext, ResponseHeadersPluginContext, LoggerContext {}

export const base = os.$context<ORPCContext>();
