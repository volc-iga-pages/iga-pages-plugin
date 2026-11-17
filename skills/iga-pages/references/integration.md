# Integrations (`iga pages integration`)

Pages projects support Supabase and AI Gateway integrations. Agent projects
support AI Gateway only; Supabase integration is not supported.

Connect an existing **Volcengine Supabase** or **AI Gateway** resource to the Pages project so its connection variables are synced as project env. The `list/link/unlink` commands manage the IGA-side binding; `create aigateway` creates or reuses the shared Pages gateway and binds it. The `configure aigateway` commands below view or update the linked gateway instance’s model configuration.

`create aigateway`, `list/link/unlink` and `configure aigateway view/update` require the directory to be linked to a Pages project (run `iga pages link` first). `template` and `template list` are local operations and do not require login or a linked project. Binding changes take effect on the **next deployment**.

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

- The integration name is `supabase`. Only **Volcengine Supabase** is supported; `--product` defaults to `volc_supabase` and can be omitted. Other product values, including `supabase` and `comm_supabase`, are rejected.
- **`--resource` / `--branch`** match either the display name (`WorkspaceName` / `Branch`) or the stable ID (`WorkspaceID` / `BranchID`). Ambiguous matches in non-TTY error out — pass a unique ID.
- **`--framework-prefix`** (optional) is the client-exposed env prefix (`NEXT_PUBLIC`, `VITE`, `PUBLIC`, `REACT_APP`). The CLI auto-detects the framework and uses it as the default; in TTY it prompts for confirmation, in non-TTY it uses the detected value silently. Pass `--framework-prefix` only to override the detected default.
- **`--prefix`** (custom prefix) is **optional for the first** Supabase binding but **required from the second onward**, to avoid env name collisions. Uniqueness is enforced by the backend; on a conflict the CLI surfaces the error and re-prompts.
- **Resulting var names**: client vars are `<framework-prefix>_<custom-prefix?>_SUPABASE_<KEY>`; server-only vars omit the framework prefix. The service-role key is **not** auto-synced.
- **`unlink`** removes the IGA binding and the env vars that binding created (backend-driven, by binding relationship — the CLI never deletes env by name). It does not touch anything in Supabase. Confirmation required in TTY; non-TTY needs `--yes` plus full locating flags. `--format=json` requires `--yes`.

## AI Gateway

```bash
iga pages integration create aigateway --format=json
iga pages integration link aigateway --resource <gateway-name-or-id> --format=json
iga pages integration unlink aigateway --resource <gateway-id> --yes --format=json
```

- `create` creates or reuses the account's shared Pages gateway and binds this project; an existing project binding is preserved.
- `link` selects an existing gateway; use a unique ID when names are ambiguous. Each project can bind one gateway. `unlink` removes its binding and managed env vars, keeping the instance; pass `--yes` once unlinking is authorized.
- Creation does not change model configuration, write local env files or deploy. After a failure or timeout, check `integration list` and the console before retrying.

### Model configuration

```bash
iga pages integration configure aigateway view --format=json
iga pages integration configure aigateway template list --format=json
iga pages integration configure aigateway template --provider deepseek,custom --output models.json
iga pages integration configure aigateway update --models-file models.json --format=json
# After authorization, add --yes to apply the update.
```

- `view/update` target the current project's linked gateway, without `--resource`. Updates replace the **complete model list** and affect all projects sharing that gateway; include every model that should remain.
- Generate a provider-specific template, then fill in the complete JSON model array and credentials locally. `view` output is masked and cannot be reused as an update file. Do not commit credential-bearing files or print their contents.
- JSON `update` without `--yes` returns a masked confirmation preview without writing. Reuse existing authorization when applying it. Template commands are local; overwriting an existing file requires confirmation or `--yes`.

## Manual Agent gateway binding and model configuration

```bash
iga agents integration list --format=json
iga agents integration link aigateway --resource <gateway-name-or-id> --format=json
iga agents integration unlink aigateway --resource <gateway-id> --yes --format=json
iga agents env pull
iga agents integration configure aigateway view --format=json
iga agents integration configure aigateway template list --format=json
iga agents integration configure aigateway template --provider deepseek,custom --output models.json
iga agents integration configure aigateway update --models-file models.json --format=json
```

Template generation and provider listing are local and do not require an Agent association or login. `view/update` use the Agent's linked gateway. Updates replace its complete model list, including for any other projects sharing that gateway; JSON update without `--yes` returns a masked confirmation preview. Apply an authorized update with `--yes`.

Binding, env and model view/update commands require an Agent association (`iga agents link`). List output includes only AI Gateway bindings. Link/unlink default to `aigateway` when the integration name is omitted and reject other integrations and Supabase-only options. Selection, unlink confirmation, the single-gateway limit and configuration refresh follow the Pages gateway behavior. Follow-up commands retain the Agent entry, brand and selected environment.

## Supabase provider work → hand off to `byted-supabase`

This skill orchestrates link / integration / env / deploy and supports model configuration on the linked AI Gateway instance. It does **not** manage Supabase resources (creating workspaces/branches, SQL, migrations, API keys, Storage, Edge Functions). When the user wants to create or manage actual Supabase resources, hand off to the `byted-supabase` skill (`https://github.com/bytedance/agentkit-samples/blob/main/skills/byted-supabase/SKILL.md`). Once the resource is ready, continue the authorized link / integration / deploy workflow.
