[简体中文](README.md) | English

# IGA Pages Agent Plugin

Develop and deploy frontend, full-stack, and AI agent applications on [IGA Pages](https://www.volcengine.com/docs/6559/2188992?lang=zh) with your AI coding agent.

## Getting Started

### Supported Tools

The repository includes integration files for these clients:

| Tool | Status |
| --- | --- |
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | Supported |
| [Gemini CLI](https://geminicli.com) | Supported |
| [OpenAI Codex](https://openai.com/index/codex/) | Supported |
| [Cursor](https://www.cursor.com) | Supported |
| [Kilo](https://kilo.ai) | Supported |
| [OpenCode 2](https://opencode.ai) | Supported |
| [Grok Build](https://x.ai/news/grok-build-cli) | Supported |
| [GitHub Copilot CLI](https://github.com/github/copilot-cli) | Supported |
| [Kimi Code](https://kimi.com) | Supported |

Hook activation depends on the client's version, settings, and workspace policy.

### Prerequisites

- An AI coding tool that supports plugins or [Agent Skills](https://agentskills.io/).
- Node.js 20 or newer.
- An IGA Pages account and CLI authentication for remote operations.

### Installation

Use a compatible plugin installer and select your client:

```bash
npx plugins add volc-iga-pages/iga-pages-plugin
```

Restart your client after installation and approve hooks when prompted.

To install only the skill and reference files:

```bash
npx skills add volc-iga-pages/iga-pages-plugin
```

Skill-only installation does not include development hooks or MCP configuration.

## What It Does

The plugin gives your agent IGA Pages guidance for project setup, framework compatibility, local development, deployment, environment variables, integrations, and debugging. It also covers persistent conversations, sandboxed tools, and object storage for AI applications.

One entry-point skill routes the agent to the relevant reference files as needed.

## How Do I Use This?

Ask your agent to work on an IGA Pages project. The agent can load the skill when your request matches its scope.

Deployment examples:

```text
Deploy my app to IGA Pages and give me a preview URL.
```

```text
Can this app run on IGA Pages? Check what needs to change.
```

Development examples:

```text
Build an AI agent on IGA Pages with persistent conversations and sandboxed tools.
```

```text
Add an API to my IGA Pages project and help me run it locally.
```

```text
Help me configure environment variables and connect Supabase for this project.
```

Debugging example:

```text
Inspect this IGA Pages deployment and help me diagnose its runtime errors.
```

When enabled, the development hook reminds the agent to start the local development environment with `iga pages dev` when it detects that the project needs the IGA development runtime. It is advisory: the agent still decides how to proceed.

## Components

### MCP Server

The bundled `.mcp.json` connects to `https://iga-pages.mcp.volcbiz.com`. Authenticate and ensure you have access to the intended IGA Pages projects before using account tools. MCP supports both reads and writes, including inspecting projects, deployments, and logs, and creating deployments. Inspect the tools and schemas exposed by your connection, and obtain explicit user approval before creating a deployment. Skill-only installation does not include the MCP configuration.

### Skill

| Skill | Covers |
| --- | --- |
| [iga-pages](skills/iga-pages/SKILL.md) | CLI setup and authentication, project workflows, deployment, and routing to development references |

### Development Reminders

When the plugin detects that your project needs the IGA development runtime, the plugin reminds the agent to start the local development environment with `iga pages dev`. OpenCode adds this guidance during the session. Gemini CLI checks at session startup, resume, or clear. Clients with terminal hooks check development commands. Reminders are advisory, may not recognize complex shell commands, and depend on your client's hook settings.

Keep `package.json` `scripts.dev` set to the framework command, such as `vite` or `next dev`, then run `iga pages dev` in the terminal. Do not set `scripts.dev` to `iga pages dev`: IGA invokes that script, causing recursive startup. Clients with terminal hooks check for this configuration when running commands such as `npm run dev` or `iga pages dev` and prompt the agent to correct it.

## Ecosystem Coverage

- Frameworks: Next.js, Vite, Vue CLI, Create React App, Angular, Hexo, Docusaurus, VitePress, VuePress, Astro, Nuxt, and plain static assets.
- Functions: Node.js API routes, Web-standard handlers, Express, and Koa.
- AI applications: persistent conversations, OpenAI Agents sessions, LangGraph checkpoints, Claude session storage, and Sandbox tools.
- Storage: durable project-scoped Blob objects.
- CLI workflows: authentication, initialization, linking, local development, builds, deployment, environment variables, integrations, inspection, and logs.

## Usage Statistics

The plugin reports first use and daily activity by default. Events include the plugin name/version, client type, and a hashed device identifier. Set `IGA_PAGES_PLUGIN_TELEMETRY_DISABLED=1` in the client environment to disable reporting. Network requests time out after one second; reporting failures do not fail the hook. Kimi does not register session hooks. OpenCode also supports the plugin option `telemetry: false` to disable reporting. Restart the OpenCode service after changing its environment (`opencode service restart`).

## Privacy and Support

- Privacy Policy: [PRIVACY.md](PRIVACY.md)
- Support: [volc-vne-bot@bytedance.com](mailto:volc-vne-bot@bytedance.com)

## License

[MIT](LICENSE)
