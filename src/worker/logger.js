// ============================================================
// Structured logging — JSON lines with timestamp/level/event
// Replaces console.log/console.error across the Worker.
// ============================================================

function emit(level, event, data) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    ...(data && typeof data === 'object' ? data : data !== undefined ? { data } : {}),
  };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (event, data) => emit('info', event, data),
  warn: (event, data) => emit('warn', event, data),
  error: (event, data) => emit('error', event, data),
};
