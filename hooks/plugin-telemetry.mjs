import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, openSync, closeSync, readFileSync, writeFileSync, renameSync, unlinkSync, statSync } from "node:fs";
import { cpus, hostname, homedir, networkInterfaces } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Standalone transport for plugin lifecycle events using the Tea /list format.
export const TELEMETRY = Object.freeze({
  endpoint: "https://mcs.zijieapi.com/list",
  appId: 1045459,
  timeoutMs: 1000,
});
const PLUGIN_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CLIENTS = new Set(["claude-code", "codex", "cursor", "github-copilot", "vscode", "grok", "opencode", "gemini-cli", "unknown"]);

export function isTelemetryEnabled(env = process.env) {
  return env.IGA_PAGES_PLUGIN_TELEMETRY_DISABLED?.trim() !== "1";
}

export function resolveAiClient(adapter, input = {}, env = process.env) {
  if (adapter === "shared") {
    if (env.GEMINI_SESSION_ID && env.IGA_GEMINI_EXTENSION_ROOT) return "gemini-cli";
    if (env.GROK_PLUGIN_ROOT) return "grok";
    // Cursor can also load Claude-compatible hooks. Prefer its explicit marker.
    if (env.CURSOR_VERSION || input.cursor_version) return "cursor";
    if (env.CODEX_PLUGIN_ROOT) return "codex";
    // Local-agent compatibility can expose either plugin-root variable.
    if ((env.PLUGIN_ROOT || env.CLAUDE_PLUGIN_ROOT) && input.source === "new") return "vscode";
    if (env.CLAUDE_PLUGIN_ROOT) return "claude-code";
    return "unknown";
  }
  // VS Code also discovers Copilot's hook file: ignore its duplicate invocation.
  if (adapter === "github-copilot" && input.hook_event_name === "SessionStart") return null;
  return CLIENTS.has(adapter) ? adapter : "unknown";
}

export function buildDeviceId(system = { hostname, cpus, networkInterfaces }) {
  // Derive a device identifier from local system attributes; return only the digest.
  const macs = Object.values(system.networkInterfaces()).flat()
    .filter((nic) => nic && !nic.internal && nic.mac).map((nic) => nic.mac).join(",");
  const value = [system.hostname(), system.cpus().map((cpu) => cpu.model).join(","), macs].join("|");
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

function readText(file) {
  try { return readFileSync(file, "utf8").trim(); } catch { return ""; }
}

function atomicWrite(file, value) {
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporary, value, { flag: "wx", mode: 0o600 });
    renameSync(temporary, file);
  } finally {
    try { unlinkSync(temporary); } catch { /* Renamed or never created. */ }
  }
}

function claimLock(directory) {
  const file = join(directory, ".telemetry-lock");
  const token = `${process.pid}:${randomUUID()}`;
  try {
    const fd = openSync(file, "wx", 0o600);
    try { writeFileSync(fd, token); } finally { closeSync(fd); }
  } catch (error) {
    if (error.code === "EEXIST") {
      // Never wait on another session. Recover a dead owner's stale lock for
      // the next invocation; a live owner is never displaced by a slow request.
      try {
        const previous = readText(file);
        const pid = Number(previous.split(":")[0]);
        if (Date.now() - statSync(file).mtimeMs > 60_000) {
          let dead = !Number.isInteger(pid) || pid <= 0;
          if (!dead) {
            try { process.kill(pid, 0); } catch (failure) { dead = failure.code === "ESRCH"; }
          }
          if (dead && readText(file) === previous) unlinkSync(file);
        }
      } catch { /* Best effort recovery. */ }
    }
    return null;
  }
  return () => {
    try { if (readText(file) === token) unlinkSync(file); } catch { /* Best effort cleanup. */ }
  };
}

export function buildTeaPayload(events, deviceId, now) {
  return [{
    events: events.map(({ event, params }) => ({ event, params: JSON.stringify(params), local_time_ms: now })),
    user: { user_unique_id: deviceId },
    local_time: Math.floor(now / 1000),
    header: { app_id: TELEMETRY.appId },
    verbose: 1,
  }];
}

async function sendEvents(events, deviceId, now, send, timeoutMs) {
  const controller = new AbortController();
  let timer;
  try {
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => { controller.abort(); reject(new Error("telemetry timeout")); }, timeoutMs);
    });
    await Promise.race([
      (async () => {
        const response = await send(TELEMETRY.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=UTF-8" },
          body: JSON.stringify(buildTeaPayload(events, deviceId, now)),
          signal: controller.signal,
        });
        await response.body?.cancel();
        if (!response.ok) throw new Error("telemetry rejected");
      })(),
      timeout,
    ]);
    return true;
  } catch { return false; } finally { clearTimeout(timer); }
}

// Dependencies are injectable for offline tests, never taken from hook input.
export async function reportSession({
  aiClient = "unknown", env = process.env, home = homedir(), pluginRoot = PLUGIN_ROOT,
  now = new Date(), send = globalThis.fetch, deviceIdFactory = buildDeviceId,
  timeoutMs = TELEMETRY.timeoutMs,
} = {}) {
  if (!isTelemetryEnabled(env)) return [];
  let release;
  try {
    const manifest = JSON.parse(readFileSync(join(pluginRoot, ".claude-plugin/plugin.json"), "utf8"));
    const { name, version } = manifest;
    if (typeof name !== "string" || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(name) ||
        typeof version !== "string" || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version)) return [];
    const directory = join(home, ".config", `${name}-plugin`);
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    release = claimLock(directory);
    if (!release) return [];
    const day = now.toISOString().slice(0, 10);
    const firstFile = join(directory, "first-use-stamp");
    const dayFile = join(directory, "dau-stamp");
    const needed = [];
    if (!existsSync(firstFile)) needed.push(["ai_plugin_first_use", firstFile, now.toISOString()]);
    if (readText(dayFile) !== day) needed.push(["ai_plugin_dau", dayFile, day]);
    if (!needed.length) return [];
    // Verify atomic writes before sending. An unwritable state directory must
    // not cause the same first-use event to be sent on every startup.
    const probe = join(directory, `.write-check-${randomUUID()}`);
    atomicWrite(probe, "");
    unlinkSync(probe);
    const deviceId = deviceIdFactory();
    if (typeof deviceId !== "string" || !/^[a-f0-9]{32}$/.test(deviceId)) return [];
    const events = needed.map(([event]) => ({ event, params: {
      event_id: randomUUID(), event_time: now.getTime(), device_id: deviceId,
      plugin_name: `${name}-plugin`, plugin_version: version,
      ai_client: CLIENTS.has(aiClient) ? aiClient : "unknown",
    } }));
    if (!await sendEvents(events, deviceId, now.getTime(), send, timeoutMs)) return [];
    for (const [, file, value] of needed) atomicWrite(file, `${value}\n`);
    return events.map(({ event }) => event);
  } catch {
    // Filesystem, device detection and network failures never fail the hook.
    // No raw errors or hook input are logged.
    return [];
  } finally { release?.(); }
}
