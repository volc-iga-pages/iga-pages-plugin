# IGA Pages Agent Plugin

简体中文 | [English](README.en.md)

通过 AI 编程助手，在[火山引擎 IGA Pages](https://www.volcengine.com/docs/6559/2188992?lang=zh) 上开发和部署前端、全栈及 AI Agent 应用。

## 快速开始

### 支持的工具

| 工具 | 是否支持 |
| --- | --- |
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | 支持 |
| [Gemini CLI](https://geminicli.com) | 支持 |
| [OpenAI Codex](https://openai.com/index/codex/) | 支持 |
| [Cursor](https://www.cursor.com) | 支持 |
| [Kilo](https://kilo.ai) | 支持 |
| [OpenCode 2](https://opencode.ai) | 支持 |
| [Grok Build](https://x.ai/news/grok-build-cli) | 支持 |
| [GitHub Copilot CLI](https://github.com/github/copilot-cli) | 支持 |
| [Kimi Code](https://kimi.com) | 支持 |

Hook 是否启用取决于客户端版本、设置和工作区策略。

### 环境要求

- 支持插件或 [Agent Skills](https://agentskills.io/) 的 AI 编程工具。
- Node.js 20 或更新版本。
- 执行远程操作时，需要 IGA Pages 账号并完成 CLI 登录。

### 安装

使用兼容的插件安装器，并选择你的客户端：

```bash
npx plugins add volc-iga-pages/iga-pages-plugin
```

安装后重启客户端，并按提示授权启用 hooks。

如果只需要 Skill 和参考文档：

```bash
npx skills add volc-iga-pages/iga-pages-plugin
```

仅安装 Skill 不包含开发 hooks 或 MCP 配置。

## 功能

插件为编程助手提供 IGA Pages 的项目初始化、框架兼容、本地开发、部署、环境变量、服务集成和问题排查指南，也覆盖 AI 应用的持久化会话、沙箱工具和对象存储。

一个入口 Skill 会根据任务按需加载对应参考文档。

## 使用方式

安装后，直接让编程助手处理 IGA Pages 项目。任务符合适用范围时，助手可以加载 Skill。

部署示例：

```text
把我的应用部署到 IGA Pages，并给我预览链接。
```

```text
检查这个应用能否运行在 IGA Pages 上，以及需要做哪些调整。
```

开发示例：

```text
在 IGA Pages 上开发一个支持持久化会话和沙箱工具的 AI Agent。
```

```text
为我的 IGA Pages 项目添加 API，并帮我在本地运行。
```

```text
帮我配置环境变量，并为项目接入 Supabase。
```

排查示例：

```text
检查这个 IGA Pages 部署，帮我排查运行时错误。
```

启用开发 hook 后，检测到项目需要 IGA 开发运行时时，插件会提醒助手使用 `iga pages dev` 启动本地开发环境。提醒仅供参考，具体操作仍由助手判断。

## 插件组成

### MCP 服务

插件附带的 `.mcp.json` 连接到 `https://iga-pages.mcp.volcbiz.com`。使用账号相关工具前，请完成认证，并确认你拥有目标 IGA Pages 项目的访问权限。MCP 支持查询项目、部署和日志，也支持创建部署等写操作。请检查当前连接提供的工具及参数定义，并在创建部署前取得用户明确授权。仅安装 Skill 不包含 MCP 配置。

### Skill

| Skill | 内容 |
| --- | --- |
| [iga-pages](skills/iga-pages/SKILL.md) | CLI 安装与登录、项目工作流、部署，以及开发参考文档导航 |

### 开发提醒

检测到项目需要 IGA 开发运行时时，插件会提醒助手使用 `iga pages dev` 启动本地开发环境。OpenCode 在会话过程中加入指导；Gemini CLI 在会话启动、恢复或清空时检查；带终端 hooks 的客户端会检查开发命令。提醒可能无法识别复杂 shell 命令，是否生效也取决于客户端的 hook 设置。

`package.json` 中的 `scripts.dev` 应保留框架自身的启动命令，例如 `vite` 或 `next dev`，然后在终端运行 `iga pages dev`。不要将 `scripts.dev` 设置为 `iga pages dev`，因为 IGA 会调用该脚本，导致递归启动。带终端 hooks 的客户端会在执行 `npm run dev` 或 `iga pages dev` 等命令时检查这种配置，并提示修正。

## 生态覆盖

- 框架：Next.js、Vite、Vue CLI、Create React App、Angular、Hexo、Docusaurus、VitePress、VuePress、Astro、Nuxt，以及纯静态资源。
- 函数：Node.js API 路由、Web 标准处理函数、Express 和 Koa。
- AI 应用：持久化会话、OpenAI Agents 会话、LangGraph checkpoints、Claude 会话存储，以及 Sandbox 工具。
- 存储：项目级持久化 Blob 对象。
- CLI 工作流：登录、初始化、关联项目、本地开发、构建、部署、环境变量、服务集成、资源检查和日志。

## 使用统计

插件默认上报首次使用和日活事件。事件包含插件名称和版本、客户端类型，以及经过哈希处理的设备标识。

在客户端环境中设置 `IGA_PAGES_PLUGIN_TELEMETRY_DISABLED=1` 可关闭插件统计。网络请求超时为 1 秒，上报失败不会导致 hook 失败。Kimi 不注册会话 hooks。OpenCode 也支持通过插件选项 `telemetry: false` 关闭统计；更改环境变量后，运行 `opencode service restart` 重启 OpenCode 服务。

## 许可证

[MIT](LICENSE)
