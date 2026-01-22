type LogLevel = "info" | "warn" | "error" | "debug";

function formatMessage(level: LogLevel, message: string, metadata?: Record<string, unknown>) {
  const ts = new Date().toISOString();
  const meta = metadata ? ` ${JSON.stringify(metadata)}` : "";
  return `[${ts}] [${level.toUpperCase()}] ${message}${meta}`;
}

export const logger = {
  info(message: string, metadata?: Record<string, unknown>) {
    console.info(formatMessage("info", message, metadata));
  },
  warn(message: string, metadata?: Record<string, unknown>) {
    console.warn(formatMessage("warn", message, metadata));
  },
  error(message: string, metadata?: Record<string, unknown>) {
    console.error(formatMessage("error", message, metadata));
  },
  debug(message: string, metadata?: Record<string, unknown>) {
    if (process.env.NODE_ENV !== "production") {
      console.debug(formatMessage("debug", message, metadata));
    }
  },
};
