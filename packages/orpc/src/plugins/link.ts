import type {
	BatchLinkPluginGroup,
	DedupeLinkPluginGroup,
} from "@orpc/client/plugins";
import {
	BatchLinkPlugin,
	DedupeLinkPlugin,
	RequestCompressionLinkPlugin,
} from "@orpc/client/plugins";
import { SmartCoercionLinkPlugin } from "@orpc/json-schema";
import { ZodToJsonSchemaConverter } from "@orpc/zod";
import { BATCH_MAX_SIZE } from "#/config";
import { router } from "#/router";

const dedupeGroups: [DedupeLinkPluginGroup<object>] = [
	{ condition: () => true, context: {} },
];

const batchGroups: [BatchLinkPluginGroup<object>] = [
	{ condition: () => true, context: {} },
];

export const linkPlugins = [
	new DedupeLinkPlugin({ groups: dedupeGroups }),
	new BatchLinkPlugin({ maxSize: BATCH_MAX_SIZE, groups: batchGroups }),
	new RequestCompressionLinkPlugin(),
	new SmartCoercionLinkPlugin(router, {
		converters: [new ZodToJsonSchemaConverter()],
	}),
];
