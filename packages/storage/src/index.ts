import { env } from "@repo/shared";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export const db = drizzle({
	schema,
	connection: {
		connectionString: String(env.DATABASE_URL),
	},
	logger: true,
});
