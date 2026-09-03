import pino from "pino";

const { NODE_ENV, LOG_LEVEL } = process.env;
const isProduction = NODE_ENV === "production";

/**
 * Shared Pino logger used by the oRPC handler and by application code.
 *
 * In development logs go through `pino-pretty`. In production they are emitted
 * as newline-delimited JSON so they can be shipped to any log collector.
 */
export const logger = pino({
	level: LOG_LEVEL ?? (isProduction ? "info" : "debug"),
	...(isProduction
		? {}
		: {
				transport: {
					target: "pino-pretty",
					options: {
						colorize: true,
						translateTime: "SYS:HH:MM:ss.l",
						ignore: "pid,hostname",
					},
				},
			}),
});

export type { LoggerContext } from "@orpc/pino";
export { getLogger } from "@orpc/pino";
