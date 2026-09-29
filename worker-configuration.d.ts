// Cloudflare bindings, declared globally (no imports/exports in this file).
// Deliberately not using @cloudflare/workers-types: it globally overrides @types/node
// (Response.json() -> unknown, crypto signatures) and breaks Next's own types.
type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
};

type D1Like = {
  prepare(query: string): D1Statement;
};

type R2ObjectLike = {
  arrayBuffer(): Promise<ArrayBuffer>;
};

type R2BucketLike = {
  get(key: string): Promise<R2ObjectLike | null>;
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | string,
    options?: { httpMetadata?: { contentType?: string } }
  ): Promise<unknown>;
  delete(key: string): Promise<void>;
};

interface CloudflareEnv {
  DB: D1Like;
  MEDIA: R2BucketLike;
}
