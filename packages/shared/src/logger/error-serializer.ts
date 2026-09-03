/**
 * Robust error serializer for pino.
 *
 * The repo logs errors under the `error` key (e.g.
 * `logger.error({ error, requestId }, "…")`), but pino only auto-applies its
 * built-in `err` serializer to the `err` key. Without an explicit serializer,
 * error values fall through to JSON stringification, which gives up on the
 * complex graphs carried by driver errors (live connection/stream handles,
 * cause chains, cycles) and emits
 * `"[unable to serialize, circular reference is too complex to analyze]"` —
 * hiding the actual failure.
 *
 * This serializer is total: it never throws, never traverses live handles,
 * and always produces a JSON-safe structure with the diagnostic essentials
 * (`name`, `_tag`, `message`, `stack`, `cause` chain, and safe own props).
 */

import type { SerializerFn } from "pino";

const MAX_DEPTH = 5;
const MAX_KEYS = 30;
const MAX_STRING = 2_000;

/**
 * Keys that typically hold live handles (sockets, streams, pools, clients).
 * Logged as a type hint, never traversed.
 */
const NON_SERIALIZABLE_KEYS = new Set([
  "connection",
  "stream",
  "socket",
  "client",
  "clients",
  "pool",
  "queryable",
  "_queryable",
  "native",
  "domain",
]);

type Seen = WeakSet<object>;

const isErrorLike = (value: unknown): value is Error =>
  value instanceof Error ||
  (typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "message" in value &&
    typeof (value as Error).message === "string");

const truncate = (value: string): string =>
  value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}… (${value.length} chars)` : value;

const describeValue = (value: unknown): string => {
  if (value === null) return "null";
  if (Array.isArray(value)) return `Array(${value.length})`;
  if (value instanceof Map) return `Map(${value.size})`;
  if (value instanceof Set) return `Set(${value.size})`;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof RegExp) return value.toString();
  if (typeof value === "function")
    return `function ${(value as { name?: string }).name || "anonymous"}()`;
  const name = (value as { constructor?: { name?: string } })?.constructor?.name;
  return typeof name === "string" ? name : typeof value;
};

const serializeScalar = (value: unknown): unknown => {
  switch (typeof value) {
    case "string":
      return truncate(value);
    case "number":
      return Number.isFinite(value) ? value : String(value);
    case "bigint":
      return value.toString();
    case "symbol":
    case "function":
      return describeValue(value);
    default:
      return value;
  }
};

/** Serializes an error-like value for structured logging. */
export const serializeError = (value: unknown): unknown => {
  if (value === null || typeof value !== "object") return serializeScalar(value);
  if (isErrorLike(value)) return serializeErrorNode(value, new WeakSet(), 0);
  return serializeNode(value, new WeakSet(), 0);
};

/** Shape of a serialized error node. */
interface SerializedError {
  type: string;
  name: string;
  message: string;
  _tag?: string;
  stack?: string;
  issues?: unknown[];
  aggregateErrors?: unknown[];
  cause?: unknown;
  [k: string]: unknown;
}

/** Marker for already-visited (circular) errors. */
const CIRCULAR = "[Circular]" as const;

const serializeErrorNode = (error: Error, seen: Seen, depth: number): SerializedError => {
  if (seen.has(error)) {
    return {
      type: error.constructor?.name ?? error.name,
      name: error.name,
      message: CIRCULAR,
    };
  }
  seen.add(error);

  // Hand-rolled on purpose: better-result's TaggedError carries its own
  // `toJSON`, and we want full control over depth/cycle handling.
  const out: SerializedError = {
    type: error.constructor?.name ?? error.name,
    name: error.name,
    message: truncate(error.message),
  };

  // better-result TaggedError exposes its discriminator; surface it
  // top-level since error mapping keys off `_tag`.
  if ("_tag" in error && typeof error._tag === "string") {
    out._tag = error._tag;
  }

  if (error.stack) out.stack = truncate(error.stack);

  // ZodError: `issues` is the useful payload.
  const issues = (error as unknown as { issues?: unknown[] }).issues;
  if (Array.isArray(issues)) {
    out.issues = issues.map((issue) => serializeError(issue));
  }

  // AggregateError support.
  const aggregate = (error as unknown as { errors?: unknown[] }).errors;
  if (Array.isArray(aggregate)) {
    out.aggregateErrors = aggregate.map((err) => serializeError(err));
  }

  // Cause chain — the actual pg/neon error usually hides here.
  const cause = (error as { cause?: unknown }).cause;
  if (cause !== undefined && cause !== null) {
    out.cause = isErrorLike(cause)
      ? serializeErrorNode(cause, seen, depth + 1)
      : serializeNode(cause, seen, depth + 1);
  }

  // Safe own enumerable props (message/stack/etc. are non-enumerable and
  // already handled above).
  for (const [key, prop] of Object.entries(error)) {
    if (key in out) continue;
    out[key] = NON_SERIALIZABLE_KEYS.has(key)
      ? `[unserializable: ${describeValue(prop)}]`
      : serializeNode(prop, seen, depth + 1);
  }

  return out;
};

/** Serializes non-error objects/arrays with depth, breadth, and cycle guards. */
const serializeNode = (value: unknown, seen: Seen, depth: number): unknown => {
  if (value === null || typeof value !== "object") return serializeScalar(value);
  if (seen.has(value)) return "[Circular]";
  if (value instanceof Date) return value.toISOString();
  if (value instanceof RegExp) return value.toString();
  if (value instanceof Map) {
    seen.add(value);
    return {
      map: [...value.entries()]
        .slice(0, MAX_KEYS)
        .map(([k, v]) => [describeValue(k), serializeNode(v, seen, depth + 1)]),
    };
  }
  if (value instanceof Set) {
    seen.add(value);
    return {
      set: [...value.values()].slice(0, MAX_KEYS).map((v) => serializeNode(v, seen, depth + 1)),
    };
  }
  if (isErrorLike(value)) return serializeErrorNode(value, seen, depth);
  if (depth >= MAX_DEPTH) return `[max depth: ${describeValue(value)}]`;
  seen.add(value);

  if (Array.isArray(value)) {
    const out = value.slice(0, MAX_KEYS).map((item) => serializeNode(item, seen, depth + 1));
    if (value.length > MAX_KEYS) out.push(`[+${value.length - MAX_KEYS} more]`);
    return out;
  }

  /** Object node with an optional truncation marker. */
  interface SerializedNode {
    __truncated?: string;
    [k: string]: unknown;
  }

  const out: SerializedNode = {};
  let count = 0;
  for (const [key, prop] of Object.entries(value)) {
    if (count >= MAX_KEYS) {
      out.__truncated = `[${Object.keys(value).length} keys total]`;
      break;
    }
    out[key] = NON_SERIALIZABLE_KEYS.has(key)
      ? `[unserializable: ${describeValue(prop)}]`
      : serializeNode(prop, seen, depth + 1);
    count++;
  }
  return out;
}; /** Pino serializer for `error`/`err`/`cause` log keys. */
export const errorSerializer: SerializerFn = (value) => serializeError(value);
