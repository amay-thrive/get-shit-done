function serializeError(error: unknown): Record<string, unknown> | undefined {
  if (!error) return undefined;
  if (error instanceof Error) {
    return { message: error.message, name: error.name, stack: error.stack };
  }
  return { raw: String(error) };
}

export const logger = {
  info(message: string, data?: Record<string, unknown>) {
    console.log(
      JSON.stringify({ level: "info", message, ...data, ts: new Date().toISOString() })
    );
  },
  warn(message: string, data?: Record<string, unknown>) {
    console.warn(
      JSON.stringify({ level: "warn", message, ...data, ts: new Date().toISOString() })
    );
  },
  error(message: string, error?: unknown, data?: Record<string, unknown>) {
    console.error(
      JSON.stringify({
        level: "error",
        message,
        error: serializeError(error),
        ...data,
        ts: new Date().toISOString(),
      })
    );
  },
};
