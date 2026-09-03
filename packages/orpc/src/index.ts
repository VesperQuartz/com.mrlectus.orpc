import { createORPCClient } from "@orpc/client";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError, type RouterClient } from "@orpc/server";
import { CompressionPlugin } from "@orpc/server/fetch";
import {
	CORSPlugin,
	RequestHeadersPlugin,
	ResponseHeadersPlugin,
} from "@orpc/server/plugins";
import { ZodToJsonSchemaConverter } from "@orpc/zod";
import { env } from "@workspace/shared";
import { SuperJSONLink } from "#/handler/link";
import { SuperJSONHandler } from "#/handler/superjson";
import { router } from "./router";

export const handler = new SuperJSONHandler(router, {
	plugins: [
		new CORSPlugin(),
		new RequestHeadersPlugin(),
		new ResponseHeadersPlugin(),
		new OpenAPIReferencePlugin({
			docsProvider: "scalar", // default: 'scalar'
			schemaConverters: [new ZodToJsonSchemaConverter()],
			specGenerateOptions: {
				info: {
					title: "ORPC Playground",
					version: "1.0.0",
				},
				servers: [
					{ url: `${env.BETTER_AUTH_URL}/api/rpc` },
					{ url: `http://localhost:5141/api/rpc` },
				],
			},
		}),
		new CompressionPlugin(),
	],
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
});

export const server = async (options: Bun.BunRequest<"/api/rpc/*">) => {
	const { matched, response } = await handler.handle(options, {
		prefix: "/api/rpc",
		context: {},
	});

	if (matched) {
		return response;
	}

	console.log(JSON.stringify(response, null, 2));

	return new Response("Not Found", { status: 404 });
};

const baseUrl = env.VITE_PUBLIC_API_URL;

export const link = new SuperJSONLink({
	url: `${baseUrl}/api/rpc`,
	method: (_, path) => {
		console.log("path", path);

		if (path.at(-1)?.match(/^(?:get|find|list|search|show)(?:[A-Z].*)?$/)) {
			console.log("get");
			return "GET";
		}

		// Use PUT for update-like operations
		if (path.at(-1)?.match(/^(?:update|change)(?:[A-Z].*)?$/)) {
			return "PUT";
		}

		// Use PATCH for patch-like operations
		if (path.at(-1)?.match(/^(?:patch)(?:[A-Z].*)?$/)) {
			return "PATCH";
		}
		if (path.at(-1)?.match(/^(?:delete|remove)(?:[A-Z].*)?$/)) {
			return "DELETE";
		}
		return "POST";
	},
});

export const orpc: RouterClient<typeof router> = createORPCClient(link);
