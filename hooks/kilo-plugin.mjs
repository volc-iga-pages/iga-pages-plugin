// Copyright (c) 2026 Beijing Volcano Engine Technology Co., Ltd.
// SPDX-License-Identifier: MIT
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import openCodePlugin from "./opencode-plugin.mjs";
import { needsIgaRuntime, REMINDER } from "./dev-command.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const { name } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

// Kilo's server descriptor is separate from the OpenCode 2 setup entry.
export default {
  id: name,
  // OpenCode 2 also probes the /server export before the root export.
  // Preserve its setup contract when it resolves this shared package target.
  setup: openCodePlugin.setup,
  async server({ directory }) {
    return {
      async config(config) {
        const skills = config.skills ??= {};
        const paths = skills.paths ??= [];
        const bundled = join(root, "skills");
        if (!paths.includes(bundled)) paths.push(bundled);
        const mcpPath = join(root, ".mcp.json");
        if (existsSync(mcpPath)) {
          const { mcpServers } = JSON.parse(readFileSync(mcpPath, "utf8"));
          const mcp = config.mcp ??= {};
          for (const [id, server] of Object.entries(mcpServers)) {
            if (server.type === "http" && !Object.hasOwn(mcp, id)) {
              mcp[id] = { type: "remote", url: server.url };
            }
          }
        }
      },
      async "experimental.chat.system.transform"(_input, output) {
        if (needsIgaRuntime(directory) && !output.system.includes(REMINDER)) {
          output.system.push(REMINDER);
        }
      },
    };
  },
};
