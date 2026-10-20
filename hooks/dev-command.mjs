// Copyright (c) 2026 Beijing Volcano Engine Technology Co., Ltd.
// SPDX-License-Identifier: MIT

import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, isAbsolute, join, resolve } from "node:path";

export const REMINDER = "This project requires the IGA development runtime. Please start it with iga pages dev.";

function stat(file) {
  try { return statSync(file); } catch { return undefined; }
}

function hasApiFile(root) {
  const directories = [root];
  while (directories.length) {
    let entries;
    const directory = directories.pop();
    try { entries = readdirSync(directory, { withFileTypes: true }); } catch { continue; }
    for (const entry of entries) {
      const file = join(directory, entry.name);
      if (entry.isFile() || (entry.isSymbolicLink() && stat(file)?.isFile())) return true;
      // Do not follow directory symlinks: they can escape api/ or form cycles.
      if (entry.isDirectory()) directories.push(file);
    }
  }
  return false;
}

export function needsIgaRuntime(root) {
  try {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    for (const section of ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]) {
      const dependencies = pkg?.[section];
      if (dependencies && typeof dependencies === "object" && !Array.isArray(dependencies) &&
          ["@iga-pages/agent", "@iga-pages/blob"].some((name) => Object.hasOwn(dependencies, name))) return true;
    }
  } catch { /* The file-based condition is independent of package.json. */ }
  return Boolean(stat(join(root, ".iga"))?.isDirectory() && stat(join(root, "iga.json"))?.isFile() &&
    hasApiFile(join(root, "api")));
}

// Read a small, literal subset of shell syntax. Never evaluate user commands.
// Dynamic expansion, pipelines, background jobs and control flow are left to the agent.
function parseCommands(command) {
  const commands = [];
  let words = [], word = "", started = false, quote;
  const flush = () => { if (started) words.push(word); word = ""; started = false; };
  for (let i = 0; i < command.length; i++) {
    const c = command[i];
    if (/[\n\r$`\\]/.test(c)) return undefined;
    if (quote) {
      if (c === quote) quote = undefined;
      else word += c;
      continue;
    }
    if (c === '"' || c === "'") { quote = c; started = true; continue; }
    if (c === "&" && command[i + 1] === "&") {
      flush();
      if (!words.length) return undefined;
      commands.push(words); words = []; i++; continue;
    }
    if (/[;&|<>(){}#*?~]/.test(c)) return undefined;
    if (/\s/.test(c)) flush();
    else { word += c; started = true; }
  }
  if (quote) return undefined;
  flush();
  if (!words.length) return undefined;
  commands.push(words);
  return commands;
}

const SCRIPT = /^(?:dev|start|serve)(?::[\w-]+)?$/;
const FRAMEWORKS = new Map([
  ["next", ["dev"]], ["vite", [undefined, "dev", "serve"]], ["astro", ["dev"]],
  ["nuxt", ["dev"]], ["nuxi", ["dev"]], ["edenx", ["dev"]], ["modern", ["dev"]],
  ["gatsby", ["develop"]], ["vue-cli-service", ["serve"]], ["react-scripts", ["start"]],
  ["ng", ["serve"]], ["vitepress", ["dev"]], ["docusaurus", ["start"]],
]);

// Exempt only a statically recognizable IGA invocation. Do not execute scripts,
// follow script aliases, or exempt an entire command chain based on a substring.
function scriptUsesIgaDev(root, name) {
  try {
    const script = JSON.parse(readFileSync(join(root, "package.json"), "utf8"))?.scripts?.[name];
    if (typeof script !== "string" || script.length > 64_000) return false;
    const commands = parseCommands(script);
    if (commands?.length !== 1) return false;
    const words = [...commands[0]];
    if (words[0] === "env") words.shift();
    while (/^[A-Za-z_][\w]*=/.test(words[0] ?? "")) words.shift();
    if (["npx", "bunx"].includes(words[0])) {
      words.shift();
      if (words[0] === "--yes" || words[0] === "-y") words.shift();
    } else if (["pnpm", "yarn", "bun", "npm"].includes(words[0]) && words[1] === "exec") {
      words.splice(0, 2);
      if (words[0] === "--") words.shift();
    }
    return words[0] === "iga" && words[1] === "pages" && words[2] === "dev";
  } catch {
    return false;
  }
}

function developmentDirectory(input, cwd, recursionOnly = false) {
  const words = [...input];
  if (words.includes("--help") || words.includes("-h") || words.includes("--version")) return undefined;
  if (words[0] === "env") words.shift();
  while (/^[A-Za-z_][\w]*=/.test(words[0] ?? "")) words.shift();
  let executable = basename(words.shift() ?? "");
  if (["npm", "pnpm", "yarn", "bun"].includes(executable)) {
    while (words[0]?.startsWith("-")) {
      const flag = words.shift();
      const match = flag.match(/^(--prefix|--dir|--cwd|-C)(?:=(.*))?$/);
      if (match) {
        const directory = match[2] ?? words.shift();
        if (!directory || directory.startsWith("-")) return undefined;
        cwd = resolve(cwd, directory);
      } else if (!["--silent", "-s"].includes(flag)) return undefined;
    }
    if (words[0] === "run" || words[0] === "run-script") words.shift();
    // These flags can redirect execution to other workspaces after the script name.
    if (words.some((word) => /^(?:--(?:prefix|dir|cwd|filter|workspace|workspaces|recursive)|-[Crw])(?:=|$)/.test(word))) {
      return undefined;
    }
    if (SCRIPT.test(words[0] ?? "")) {
      if (recursionOnly) {
        return (words[0] === "dev" || scriptUsesIgaDev(cwd, words[0])) && scriptUsesIgaDev(cwd, "dev") ? cwd : undefined;
      }
      return scriptUsesIgaDev(cwd, words[0]) ? undefined : cwd;
    }
    if (!["exec", "dlx", "x"].includes(words.shift())) return undefined;
    if (words[0] === "--") words.shift();
    executable = basename(words.shift() ?? "");
  } else if (["npx", "bunx"].includes(executable)) {
    if (words[0] === "--yes" || words[0] === "-y") words.shift();
    executable = basename(words.shift() ?? "");
  }
  if (recursionOnly) {
    return executable === "iga" && words[0] === "pages" && words[1] === "dev" && scriptUsesIgaDev(cwd, "dev") ? cwd : undefined;
  }
  const subcommand = words[0]?.startsWith("-") ? undefined : words[0];
  if (!FRAMEWORKS.get(executable)?.includes(subcommand)) return undefined;
  // A positional project root or root override must not be checked against cwd.
  const args = subcommand === undefined ? words : words.slice(1);
  const valueFlags = new Set(["--port", "-p", "--hostname", "-H", "--mode", "--config", "-c"]);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg.startsWith("-") || arg === "--" || /^(?:--(?:root|cwd|dir)|-C)(?:=|$)/.test(arg)) return undefined;
    if (valueFlags.has(arg)) {
      if (!args[i + 1] || args[i + 1].startsWith("-")) return undefined;
      i++;
    } else if (arg === "--host" && args[i + 1] && !args[i + 1].startsWith("-")) i++;
  }
  return cwd;
}

export const RECURSION_REMINDER = 'The package.json scripts.dev command calls iga pages dev, which invokes scripts.dev again and causes recursive startup. Set scripts.dev to the framework command (for example, vite or next dev), then run iga pages dev in the terminal.';

export function shouldRemind(command, cwd) {
  return Boolean(getReminder(command, cwd));
}

export function getReminder(command, cwd) {
  if (typeof command !== "string" || command.length > 64_000 || typeof cwd !== "string" || !isAbsolute(cwd)) return false;
  const commands = parseCommands(command);
  if (!commands) return false;
  let reminder = false;
  for (const words of commands) {
    if (words[0] === "cd") {
      const args = words.slice(words[1] === "--" ? 2 : 1);
      if (args.length !== 1 || !args[0] || args[0].startsWith("-")) return false;
      cwd = resolve(cwd, args[0]);
      if (!stat(cwd)?.isDirectory()) return false;
    } else {
      // Built-ins may change the parent shell's cwd or interpretation.
      if (["source", ".", "eval", "pushd", "popd", "exec", "if", "for", "while", "function"].includes(words[0])) return false;
      // A recursive dev script is invalid even before IGA project metadata exists.
      if (developmentDirectory(words, cwd, true)) return RECURSION_REMINDER;
      const root = developmentDirectory(words, cwd);
      if (root && needsIgaRuntime(root)) reminder = REMINDER;
    }
  }
  return reminder;
}

export function hookResponse(payload, host) {
  // VS Code discovers both the default Claude-style file and the Copilot
  // manifest's post-tool file. Only the shared pre-tool entry handles Local
  // terminal calls; the Copilot adapter continues to ignore those payloads.
  if (host === "shared") host = payload?.toolName === "run_terminal_command" ? "grok"
    : payload?.tool_name === "run_in_terminal" ? "vscode" : "claude";
  const fallback = host === "cursor" ? { permission: "allow" } : {};
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return fallback;
  if (host === "grok") {
    if (payload.hook_event_name !== "PreToolUse" && payload.hookEventName !== "pre_tool_use") return fallback;
    if (payload.toolName !== "run_terminal_command" || payload.toolInputTruncated) return fallback;
    const input = payload.toolInput;
    if (!input || typeof input !== "object" || Array.isArray(input)) return fallback;
    const reminder = getReminder(input.command, input.cwd ?? payload.cwd);
    return reminder ? {
      hookSpecificOutput: { hookEventName: "PreToolUse", additionalContext: reminder },
    } : fallback;
  }
  if (host === "copilot") {
    if (payload.hook_event_name && payload.hook_event_name !== "postToolUse") return fallback;
    if (!["bash", "powershell"].includes(payload.toolName)) return fallback;
    let input = payload.toolArgs;
    // Some Copilot versions serialize tool arguments as a JSON string.
    if (typeof input === "string") {
      try { input = JSON.parse(input); } catch { return fallback; }
    }
    if (!input || typeof input !== "object" || Array.isArray(input)) return fallback;
    const reminder = getReminder(input.command, input.cwd ?? payload.cwd);
    return reminder ? { additionalContext: reminder } : fallback;
  }
  if (host === "cursor") {
    if (payload.hook_event_name && payload.hook_event_name !== "beforeShellExecution") return fallback;
    const reminder = getReminder(payload.command, payload.cwd);
    return reminder ? { ...fallback, agent_message: reminder } : fallback;
  }
  if (!["claude", "vscode"].includes(host) || payload.hook_event_name !== "PreToolUse") return fallback;
  if (payload.tool_name !== (host === "vscode" ? "run_in_terminal" : "Bash")) return fallback;
  const input = payload.tool_input;
  if (!input || typeof input !== "object" || Array.isArray(input)) return fallback;
  const directory = input.workdir ?? input.cwd ?? payload.cwd;
  const reminder = getReminder(input.command ?? input.cmd, directory);
  return reminder ? {
    hookSpecificOutput: { hookEventName: "PreToolUse", additionalContext: reminder },
  } : fallback;
}
