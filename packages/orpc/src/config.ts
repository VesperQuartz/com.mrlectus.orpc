/**
 * Shared transport configuration.
 *
 * Keep this module free of `process.env` access: it is imported by the
 * browser link as well as the server handler.
 */

/** Path prefix served by the OpenAPI handler (and called by the link). */
export const API_PREFIX = "/api";

/** Maximum number of procedures grouped into a single batch request. */
export const BATCH_MAX_SIZE = 20;

/** Maximum decompressed request body size in bytes. */
export const MAX_REQUEST_BODY_SIZE = 10 * 1024 * 1024;

/** Bodies smaller than this are not compressed. */
export const COMPRESSION_THRESHOLD = 1024;
