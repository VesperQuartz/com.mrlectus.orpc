import { env } from "@workspace/shared";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
	out: "./drizzle",
	schema: "./src/schema",
	dialect: "postgresql",
	dbCredentials: {
		url: String(env.DATABASE_URL),
	},
});
