import { orpc, server } from "@workspace/orpc";

const serve = Bun.serve({
	routes: {
		"/api/hello": async () => {
			const data = await orpc.planet.list({});
			return Response.json(data);
		},
		"/api/rpc/*": async (options) => server(options),
	},
	tls: {
		key: Bun.file("key.pem"),
		cert: Bun.file("cert.pem"),
		rejectUnauthorized: false,
	},
	http3: true,
	port: process.env.PORT || 5141,
});

console.log(`Listening on ${serve.protocol}://${serve.hostname}:${serve.port}`);
