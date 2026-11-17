---
name: iga-pages
description: Develop and deploy websites, full-stack web applications, APIs, and AI agents on IGA Pages. Use for publishing applications, configuring environment variables and service integrations, or troubleshooting deployments and runtime logs.
metadata:
  author: iga-pages
  version: "1.1.0"
---

# IGA Pages

## Prepare

The `@iga-pages/cli` version must be **>= 1.3.0**, with Node.js **>= 20**.
Check `iga --version`; install or upgrade with `npm i -g @iga-pages/cli@latest`
when needed. Use `iga <command> --help` for flags.

To attribute CLI telemetry to this skill and version, prefix every invocation
with the process-scoped skill identifier:

```bash
VE_SKILL_ID=iga-pages/1.1.0 iga <command>
```

Before remote operations, run `iga whoami` and reuse a valid login.
If credentials are missing, expired, or rejected, use `iga login` locally,
`iga login --remote` for a remote interactive terminal, or
`iga login --accessKey <AK> --secretKey <SK>` for unattended automation.
Diagnose network and service failures without restarting login.

## Select the project type

For a new project, choose the command group by application type; no
`.iga/project.json` is needed yet:

- Websites, full-stack web applications, and API services: use `iga pages`.
- AI agent applications: use `iga agents`.
- New projects using Agent or Blob SDKs must use `agents`, including web
  applications. Data SDK usage alone does not require `agents`.

For an existing project, reuse or restore its association:

- Local `projectId` with `appType: "agent"`: use `iga agents`.
- Local `projectId` with absent `appType` or `"pages"`: use `iga pages`.
- A remote project exists but the local association is missing: run
  `iga pages link --project <id-or-name>` or
  `iga agents link --project <id-or-name>` for its remote project type.

Creating or linking a remote project writes `.iga/project.json`.

## Websites and API services (`pages`)

Run from the local project root:

```bash
iga pages deploy --name my-app
```

This creates a Pages project on first use and deploys to the linked project later.
To restore an existing association, use `iga pages link --project <id-or-name>`.
Use `iga pages dev` for local development and `iga pages build` when a local
production build is needed.

## AI agent applications (`agents`)

Run from the local Agent project root, including custom or cloned projects:

```bash
iga agents deploy --name my-agent
```

This creates an Agent on first use and deploys to the linked Agent later.
Use `iga agents link --project <id-or-name>` to restore an existing association,
or `iga agents link --name my-agent` to create one without deploying.
Use `iga agents dev` for local development and `iga agents build` when needed.
Templates are optional; read [Templates and sandbox setup](references/project-commands.md)
for template initialization or Sandbox enablement.

## Shared rules

- Use the same project command group for `list`, `preview`, `inspect`, `logs`,
  `env`, and `integration`.
- Run commands in the project root after scaffolding. For API routes and server
  SDKs, use the IGA dev command; keep `scripts.dev` as the framework command
  (`vite`, `next dev`, etc.) to avoid recursive startup.
- Reuse the linked deployment target. New projects use an authorized GitHub
  remote when available and otherwise upload.
- Share the full returned preview URL, including access query parameters.
  Keep `.iga/` and `.env.local` out of Git.

## Read as needed

- [Deployment sources and build output](references/deployment.md): source deployment,
  existing `.iga/` output, and static asset directories.
- [Frameworks](references/frameworks.md): check support and required adapters
  before framework-specific work. Plain static HTML/JS/CSS is also supported.
- [Backend API routes](references/functions.md): file-based API routes and handlers.
- [Conversation history and sandboxed tools](references/agent-sdk.md): conversations, framework sessions,
  Sandbox operations, and model tools.
- [File storage and uploads](references/blob-sdk.md): durable files and browser upload tickets.
- [Structured data storage](references/data-sdk.md): Pages-only project-scoped JSON CRUD; unavailable in Agent projects.
- [Model and database connections](references/integration.md): inspect or bind AI Gateway/Supabase,
  or configure gateway models. Agents support `list/link/unlink` and
  `configure aigateway view/update/template/template list`. Supabase and gateway
  `create` remain Pages-only.
- [Environment](references/env.md): project variables. Link first; changes apply
  on the next deploy. `env pull` is for local development, not required to deploy.
- [Logs](references/logs.md): deployment inspection and runtime queries. On failure,
  inspect build and runtime logs for that deployment. For startup failures, query
  without `--level error` first because stderr may have no level.

Use server SDKs only in the IGA server runtime, as direct project dependencies.
