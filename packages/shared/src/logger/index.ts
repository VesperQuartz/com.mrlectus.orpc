import { type LevelWithSilent, type Logger, pino } from "pino";
import pinoPretty from "pino-pretty";
import { env } from "#/env";
import { errorSerializer } from "./error-serializer";

export type { Logger } from "pino";

const REDACT_PATHS = [
  "password",
  "*.password",
  "token",
  "*.token",
  "authorization",
  "*.authorization",
  "secret",
  "*.secret",
  "apiKey",
  "*.apiKey",
  "*.api_key",
  "x-api-key",
  "*.x-api-key",
  "cookie",
  "*.cookie",
  "set-cookie",
  "*.set-cookie",
  "nin",
  "*.nin",
];

export interface CreateLoggerOptions {
  /** Overrides the level from LOG_LEVEL (or the "info" default). */
  level?: LevelWithSilent;
}

/**
 * Creates a structured JSON logger for the given subsystem.
 *
 * - Writes JSON lines to stdout (pretty-printed only when LOG_PRETTY is set).
 * - Level comes from LOG_LEVEL, defaulting to "info".
 * - Secrets and PII (passwords, tokens, api keys, cookies, NINs) are redacted.
 */
export const createLogger = (name: string, options: CreateLoggerOptions = {}): Logger =>
  pino(
    {
      name,
      level: options.level ?? env.LOG_LEVEL ?? "info",
      base: { service: "kekere" },
      redact: { paths: REDACT_PATHS, censor: "[REDACTED]" },
      // Errors are logged under `error`/`cause` keys (not pino's default
      // `err` key), so serialize them explicitly: raw driver errors carry
      // live connection handles and cause chains that the default JSON
      // stringify cannot handle.
      serializers: {
        error: errorSerializer,
        err: errorSerializer,
        cause: errorSerializer,
      },
    },
    env.LOG_PRETTY
      ? pinoPretty({
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname,service,name",
        })
      : undefined,
  );
