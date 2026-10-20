# Integrations (`iga pages integration`)

Connect an existing **Volcengine Supabase** or **AI Gateway** resource to the Pages project so its connection variables are synced as project env. Integration commands manage the IGA-side binding, not the external resource itself.

All `integration` commands require the directory to be linked to a Pages project (`iga pages link` writes `.iga/project.json`). Changes take effect on the **next deployment**.

```bash
iga pages integration list         # bindings on the current Pages project
iga pages integration list --format=json    # as JSON
```

Synced variables are injected into deployments automatically. Run `iga pages env pull` only when you need them in local `.env.local`; see [env.md](env.md).

## Supabase

```bash
iga pages integration link supabase             # interactive
iga pages integration link supabase --format=json   # as JSON; returns next missing flag until all provided
iga pages integration unlink supabase            # interactive: pick a binding to remove
iga pages integration unlink supabase --format=json --yes
```

Non-interactive link (all selection flags required when there's no TTY):

```bash
iga pages integration link supabase \
  --product volc_supabase \
  --region cn-beijing \
  --resource <workspace-name-or-id> \
  --branch <branch-name-or-id> \
  --yes
# --prefix and --framework-prefix are both optional:
#   --framework-prefix is auto-detected from the framework; pass it only to override.
#   --prefix is optional for the first Supabase binding; required from the second binding onward.
```

Non-interactive unlink:

```bash
iga pages integration unlink supabase --product volc_supabase \
  --resource <workspace-name-or-id> --branch <branch-name-or-id> --yes
```

Key behaviors:

- Supabase supports **`supabase` / `volc_supabase`**. `--product comm_supabase` (Supabase Community) is rejected — tell the user it's not supported yet.
- **`--resource` / `--branch`** match either the display name (`WorkspaceName` / `Branch`) or the stable ID (`WorkspaceID` / `BranchID`). Ambiguous matches in non-TTY error out — pass a unique ID.
- **`--framework-prefix`** (optional) is the client-exposed env prefix (`NEXT_PUBLIC`, `VITE`, `PUBLIC`, `REACT_APP`). The CLI auto-detects the framework and uses it as the default; in TTY it prompts for confirmation, in non-TTY it uses the detected value silently. Pass `--framework-prefix` only to override the detected default.
- **`--prefix`** (custom prefix) is **optional for the first** Supabase binding but **required from the second onward**, to avoid env name collisions. Uniqueness is enforced by the backend; on a conflict the CLI surfaces the error and re-prompts.
- **Resulting var names**: client vars are `<framework-prefix>_<custom-prefix?>_SUPABASE_<KEY>`; server-only vars omit the framework prefix. The service-role key is **not** auto-synced.
- **`unlink`** removes the IGA binding and the env vars that binding created (backend-driven, by binding relationship — the CLI never deletes env by name). It does not touch anything in Supabase. Confirmation required in TTY; non-TTY needs `--yes` plus full locating flags. `--format=json` requires `--yes`.

## AI Gateway

```bash
iga pages integration link aigateway           # interactive: select an existing gateway
iga pages integration link aigateway --format=json  # returns choices as needs_input
iga pages integration link aigateway --resource <gateway-name-or-id> --format=json
iga pages integration unlink aigateway --resource <gateway-name-or-id> --yes --format=json
```

- `--resource` matches a gateway name or ID. For non-interactive linking, supply it; use an ID when names are ambiguous. JSON output returns `needs_input` and choices when selection is required. If no gateway exists, create one in the console before linking.
- Each Pages project can bind one gateway. Check `integration list` first and reuse the required binding; unlink the existing gateway before binding another.
- The product is `ai_gateway`; `--product` is optional.
- `unlink aigateway` removes the binding and its project environment variables, not the gateway instance. Without `--yes`, JSON output returns `needs_confirmation`; rerun with `--yes` once unlinking is authorized.

## Deploy orchestration

The IGA Pages skill is the **orchestrator** for the deploy flow. Recommended order when a user wants to deploy a project that may use an integration:

1. Ensure logged in with `iga whoami`; only run `iga login` if `whoami` fails.
2. If the directory is not linked yet, run `iga pages link` to create/associate the Pages project (this no longer deploys). If it is already linked, continue without relinking.
3. If Supabase or AI Gateway usage is detected, run `iga pages integration list`. Reuse the required binding. If it is absent, confirm the resource to connect unless the user has already specified it and authorized binding.
4. For a missing binding, connect the selected resource with `iga pages integration link supabase` or `iga pages integration link aigateway --resource <gateway-id>`.
5. `iga pages deploy`.

## Supabase provider work → hand off to `byted-supabase`

This skill only orchestrates link / integration / env / deploy. It does **not** manage Supabase resources (creating workspaces/branches, SQL, migrations, API keys, Storage, Edge Functions). When the user wants to create or manage actual Supabase resources, hand off to the `byted-supabase` skill (`https://github.com/bytedance/agentkit-samples/blob/main/skills/byted-supabase/SKILL.md`). After it finishes, return and confirm with the user before continuing link / integration / deploy — don't auto-continue.
