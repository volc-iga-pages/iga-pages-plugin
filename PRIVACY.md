# Privacy Policy

Last updated: October 27, 2026

This Privacy Policy explains how the IGA Pages Agent Plugin (the "Plugin"), provided by Volcengine IGA Pages, processes information when you install and use it.

## Information the Plugin Processes

### Usage statistics

The Plugin reports limited usage statistics by default:

- first-use and daily-active events;
- Plugin name and version;
- AI coding client type;
- event identifiers and timestamps; and
- a pseudonymous device identifier.

The device identifier is generated locally by hashing device attributes, including the hostname, CPU model, and network interface MAC addresses. Only the first 32 hexadecimal characters of the SHA-256 digest are reported. The source attributes are not included in the telemetry payload. Because the identifier is stable and derived from device attributes, it should be treated as pseudonymous rather than anonymous.

Usage statistics do not include your source code, file contents, prompts, command output, IGA Pages account credentials, project names, deployment logs, or hook input.

The Plugin stores local first-use and daily-activity stamps under `~/.config/iga-pages-plugin/` to avoid sending duplicate events.

### IGA Pages operations

When you choose to use the IGA Pages CLI or the Plugin's MCP integration, the requested operation may send authentication information and the project, deployment, configuration, or log data needed to provide the IGA Pages service. This data is processed separately from Plugin usage statistics and is subject to the [Volcengine Privacy Policy](https://www.volcengine.com/docs/6256/64902?lang=zh) and the terms applicable to your IGA Pages account.

The Plugin runs inside an AI coding client. That client may independently process your prompts, files, and tool results under its own privacy policy and settings.

## How We Use Information

We use Plugin usage statistics to understand adoption, measure compatibility across supported clients, and improve reliability. We do not use the Plugin's usage-statistics payload to collect source code or the contents of your IGA Pages projects.

## How to Disable Usage Statistics

Set the following environment variable in your AI coding client:

```bash
IGA_PAGES_PLUGIN_TELEMETRY_DISABLED=1
```

OpenCode users can also set the Plugin option `telemetry: false`. Restart the client or service after changing its environment. Disabling Plugin usage statistics does not prevent information from being processed when you explicitly use the IGA Pages CLI, MCP tools, or other IGA Pages services.

## Data Sharing and Retention

Plugin usage statistics are transmitted to Volcengine-operated telemetry infrastructure and are not sold. We retain this information only for as long as reasonably necessary for the purposes described in this policy, including service reliability, security, and legal compliance.

Local telemetry stamps remain on your device until you remove them or uninstall related local data. Your AI coding client and IGA Pages services may have separate retention practices governed by their respective policies and account settings.

## Security

We use reasonable technical and organizational measures designed to protect information against unauthorized access, alteration, disclosure, or destruction. No transmission or storage system can be guaranteed to be completely secure.

## Changes to This Policy

We may update this policy when the Plugin's data practices or applicable requirements change. We will update the date at the top of this file when we make material revisions.

## Contact

For privacy questions, requests, or Plugin support, contact [volc-vne-bot@bytedance.com](mailto:volc-vne-bot@bytedance.com).
