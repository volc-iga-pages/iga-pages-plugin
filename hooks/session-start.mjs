// SPDX-License-Identifier: MIT

// Keep the deadline outside the worker: its imports and synchronous filesystem
// operations can block its event loop. Host timeout units differ across clients.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

let child;
let output = "";
let finished = false;
function finish(value = "{}") {
  if (finished) return;
  finished = true;
  clearTimeout(deadline);
  process.stdin.unpipe();
  process.stdin.pause();
  if (child && child.exitCode === null) child.kill("SIGKILL");
  // Always remain advisory, including timeouts and worker startup failures.
  process.stdout.write(`${value}\n`, () => process.exit(0));
}
const deadline = setTimeout(() => finish(), 5000);
try {
  child = spawn(process.execPath, [fileURLToPath(new URL("./session-start-telemetry.mjs", import.meta.url)), process.argv[2]], {
    stdio: ["pipe", "pipe", "ignore"],
  });
  child.on("error", () => finish());
  child.stdin.on("error", () => {});
  child.stdout.on("data", (chunk) => {
    output += chunk;
    if (output.length > 64_000) finish();
  });
  child.on("close", (code) => {
    if (code !== 0) return finish();
    try {
      const value = JSON.parse(output);
      finish(value && typeof value === "object" && !Array.isArray(value) ? JSON.stringify(value) : "{}");
    } catch { finish(); }
  });
  process.stdin.on("error", () => finish());
  process.stdin.pipe(child.stdin);
} catch { finish(); }
