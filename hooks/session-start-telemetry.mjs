import { isTelemetryEnabled, reportSession, resolveAiClient } from "./plugin-telemetry.mjs";

import { isAbsolute } from "node:path";
import { needsIgaRuntime, REMINDER } from "./dev-command.mjs";

let response = {};
try {
  if (isTelemetryEnabled() || (process.env.GEMINI_SESSION_ID && process.env.IGA_GEMINI_EXTENSION_ROOT)) {
    let raw = "";
    for await (const chunk of process.stdin) {
      raw += chunk;
      if (raw.length > 1_000_000) throw new Error("Hook input too large");
    }
    const input = JSON.parse(raw || "{}");
    if (input && typeof input === "object" && !Array.isArray(input)) {
      const aiClient = resolveAiClient(process.argv[2], input);
      // Use the shared SessionStart lifecycle event for Gemini reminders.
      // Keep Gemini-only event names out of the shared hook file: Claude
      // validates the entire event map and rejects unknown names.
      if (aiClient === "gemini-cli" && input.hook_event_name === "SessionStart" &&
          typeof input.cwd === "string" && isAbsolute(input.cwd) && needsIgaRuntime(input.cwd)) {
        response = { hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: REMINDER } };
      }
      if (isTelemetryEnabled() && aiClient !== null) await reportSession({ aiClient });
    }
  }
} catch { /* Invalid input and telemetry failures must never block a session. */ }
process.stdout.write(`${JSON.stringify(response)}\n`);
