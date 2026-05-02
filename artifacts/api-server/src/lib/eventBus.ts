import { EventEmitter } from "events";

export type LogLevel = "info" | "warn" | "error" | "step" | "done";

export interface LogEvent {
  ts: number;
  level: LogLevel;
  msg: string;
  data?: Record<string, unknown>;
}

class EventBus extends EventEmitter {
  private recent: LogEvent[] = [];
  private readonly maxRecent = 200;

  push(level: LogLevel, msg: string, data?: Record<string, unknown>) {
    const event: LogEvent = { ts: Date.now(), level, msg, ...(data ? { data } : {}) };
    this.recent.push(event);
    if (this.recent.length > this.maxRecent) this.recent.shift();
    super.emit("log", event);
  }

  getRecent(): LogEvent[] {
    return [...this.recent];
  }
}

export const bus = new EventBus();
