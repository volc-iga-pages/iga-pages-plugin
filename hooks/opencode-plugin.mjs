import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { needsIgaRuntime, REMINDER } from "./dev-command.mjs";
import { isTelemetryEnabled, reportSession } from "./plugin-telemetry.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

// OpenCode 2 uses an object with setup(ctx), not the OpenCode 1 hook API.
export default {
  id: manifest.name,
  async setup(ctx) {
    const path = join(root, "skills", manifest.name, "SKILL.md");
    const raw = readFileSync(path, "utf8");
    const frontmatter = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
    const description = frontmatter?.[1].match(/^description: (.+)$/m)?.[1];
    if (!frontmatter || !description) throw new Error("Invalid bundled skill metadata");
    await ctx.skill.transform((editor) => {
      if (!editor.get(manifest.name)) editor.add({
        id: manifest.name, name: manifest.name, description, path,
        content: raw.slice(frontmatter[0].length).trim(),
      });
    });
    const mcpPath = join(root, ".mcp.json");
    if (existsSync(mcpPath)) {
      const { mcpServers } = JSON.parse(readFileSync(mcpPath, "utf8"));
      await ctx.mcp.transform((editor) => {
        for (const [name, server] of Object.entries(mcpServers)) {
          if (server.type === "http" && !editor.get(name)) {
            editor.set(name, { type: "remote", url: server.url });
          }
        }
      });
    }
    await ctx.session.hook("context", async (event) => {
      // Advisory context never rewrites commands or grants tool permissions.
      try {
        const session = await ctx.session.get({ sessionID: event.sessionID });
        if (needsIgaRuntime(session.location.directory)) {
          event.system.push({ type: "text", text: REMINDER });
        }
        if (!session.parentID && ctx.options?.telemetry !== false && isTelemetryEnabled()) {
          void reportSession({ aiClient: "opencode" }).catch(() => {});
        }
      } catch { /* Optional context must not prevent a model request. */ }
    });
  },
};
