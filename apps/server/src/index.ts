import { auth } from "@workspace/auth";
import { fetch } from "@workspace/orpc";

const serve = Bun.serve({
	routes: {
		// Better Auth owns its whole subtree (default base path: /api/auth).
		"/api/auth/*": (request) => auth.handler(request),
	},
	// Fallback for everything not matched above (oRPC at /api).
	fetch,
	tls: {
		key: Bun.file("key.pem"),
		cert: Bun.file("cert.pem"),
		rejectUnauthorized: false,
	},
	http3: true,
	port: process.env.PORT || 5141,
});

console.log(`Listening on ${serve.protocol}://${serve.hostname}:${serve.port}`);
