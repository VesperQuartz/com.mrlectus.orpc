import { env } from "@workspace/shared";
import { drizzle } from "drizzle-orm/neon-http";
import { authRelations } from "./schema";

export const db = drizzle({
	relations: {
		...authRelations,
	},
	connection: {
		connectionString: String(env.DATABASE_URL),
	},
	logger: true,
});
