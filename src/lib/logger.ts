type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: Record<string, unknown>;
  error?: { name: string; message: string; stack?: string };
}

function createLogger(context: string) {
  return {
    debug: (message: string, data?: Record<string, unknown>) =>
      log("debug", context, message, data),
    info: (message: string, data?: Record<string, unknown>) => log("info", context, message, data),
    warn: (message: string, data?: Record<string, unknown>) => log("warn", context, message, data),
    error: (message: string, error?: Error, data?: Record<string, unknown>) =>
      log("error", context, message, data, error),
  };
}

function log(
  level: LogLevel,
  context: string,
  message: string,
  data?: Record<string, unknown>,
  error?: Error,
) {
  const errorInfo = error
    ? {
        error: {
          name: error.name,
          message: error.message,
          ...(error.stack !== undefined && { stack: error.stack }),
        },
      }
    : {};

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
    ...(data && { data }),
    ...errorInfo,
  };
  console[level === "debug" ? "log" : level](JSON.stringify(entry));
}

export { createLogger };
