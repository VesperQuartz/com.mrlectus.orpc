import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { db } from "@workspace/storage";
import {
	account,
	session,
	user,
	verification,
} from "@workspace/storage/schema/auth.schema";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import {
	admin as adminPlugin,
	bearer,
	openAPI,
	username,
} from "better-auth/plugins";
import { ac, adminRole, customRole, userRole } from "./permission";

export const authOptions: BetterAuthOptions = {
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: { user, session, account, verification },
	}),
	emailAndPassword: {
		enabled: true,
		// requireEmailVerification: true,
		// customSyntheticUser: ({ coreFields, additionalFields, id }) => ({
		// 	...coreFields,
		// 	role: "user", // or your configured defaultRole
		// 	banned: false,
		// 	banReason: null,
		// 	banExpires: null,
		// 	...additionalFields,
		// 	id,
		// }),
	},
	trustedOrigins: ["https://*.ngrok-free.app"],
	plugins: [
		openAPI(),
		bearer(),
		username(),
		adminPlugin({
			ac,
			roles: {
				admin: adminRole,
				user: userRole,
				custom: customRole,
				superadmin: adminRole,
			},
			adminRoles: ["admin", "superadmin"],
		}),
	],
};

export const auth = betterAuth(authOptions) as ReturnType<
	typeof betterAuth<typeof authOptions>
>;
