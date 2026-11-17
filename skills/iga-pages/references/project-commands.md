# AI Agent Templates and Sandbox Setup

## Templates

```bash
iga agents init --list --json
iga agents init my-agent --template <ID>
```

Choose an ID from the Agent list. Non-interactive init requires `--template`;
`--json` is for `--list` only. Pages init rejects Agent-tagged templates.

Model templates create and link a remote Agent, initialize an AI Gateway, and
write `.env.local`. Other templates create a remote project only when Sandbox
is enabled; otherwise link or deploy creates it later.

## Sandbox

```bash
iga agents init my-agent --template <ID> --sandbox
iga agents link --name my-agent --sandbox --yes
iga agents deploy --sandbox
```

- `init`: enable Sandbox during creation. Without the flag, use the template
  setting. Cannot combine with `--list`.
- `link`: create without deploying. Requires `--name`; cannot use `--project`.
- `deploy`: enable Sandbox for a new or existing Agent and wait for readiness.
  Omitting the flag preserves the existing setting.

Pages commands do not accept `--sandbox`. SDK installation alone does not enable
Sandbox. Keep existing Pages associations and check their platform configuration.

With `rootDirectory`, keep the association in the command directory and SDK
dependencies in the source project.

For AI Gateway binding and model configuration, read [integration.md](integration.md).
