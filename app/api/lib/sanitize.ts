const sensitiveKeys = new Set(["passwordHash"]);

export function sanitizeForClient<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value;
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForClient(item)) as T;
  }
  if (typeof value !== "object") return value;

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !sensitiveKeys.has(key))
    .map(([key, child]) => [key, sanitizeForClient(child)]);

  return Object.fromEntries(entries) as T;
}
