import { os } from "@orpc/server";

export const listPlanet = os
	.route({
		method: "GET",
	})
	.handler(async () => {
		return [{ id: 1, name: "name" }];
	});

export const router = {
	planet: {
		list: listPlanet,
	},
};
