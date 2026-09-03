import { z } from "zod";

const envSchema = z.readonly(
  z.object({
    DATABASE_URL: z.optional(z.string()),
    BETTER_AUTH_SECRET: z.optional(z.string()),
    BETTER_AUTH_URL: z.optional(z.string()),
    VITE_PUBLIC_API_URL: z.optional(z.string()),
    LOG_LEVEL: z.optional(z.enum(["fatal", "error", "warn", "info", "debug", "trace"])),
    LOG_PRETTY: z.optional(z.string()),
  }),
);

//@ts-ignore
export const env = envSchema.parse(process.env);
