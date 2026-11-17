# Deployment Sources and Build Output

## Source and build output

`iga pages deploy` deploys the current project source.
`iga pages deploy --prebuilt` uploads existing deployment output from
`.iga/` in the current directory. Choose the input that matches the deployment
task.

A normal source deployment uses the remote build process rather than previous
local build output. Use `--prebuilt` when that output is the artifact to deploy.

## Prebuilt deployment

For a local or CI build whose output will be deployed:

```bash
iga pages build
iga pages deploy --prebuilt
```

`--prebuilt` reads the existing `.iga/` directory without building or converting
it. It uploads deployment artifacts, including static assets, SSR, or functions,
and excludes the local project association file `.iga/project.json`.

Prebuilt deployment is supported only for Pages upload projects. GitHub projects
and Agent projects do not support `--prebuilt`.

## Static asset directories

For a site consisting of directly hostable HTML, JavaScript, CSS, and other
supported static assets, run `iga pages deploy` from its directory. Pages
upload deployments automatically detect these sites and skip the remote build
and function pipeline.

Detection requires `index.html` or `index.htm` at the directory root. Build
configuration, `package.json`, server code, or unsupported file types cause the
upload to follow the normal source deployment path.

The CLI uses the current directory; it does not automatically select `dist/`.
When the deployment input is an existing static output directory, such as
`dist/`, run the command from that directory.

Static detection applies only to Pages upload projects, excluding GitHub
projects even when they fall back to upload. Agent deployments do not use this
static detection path.
