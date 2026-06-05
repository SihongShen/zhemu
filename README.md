# 折幕（Zhémù）

> 一折一幕，把小说折成一幕幕剧本。
>
> 一个把小说自动转成**结构化剧本（YAML）**的 AI 工具：内容与格式分离，一份 YAML 可再渲染成中式 / 好莱坞等多种剧本格式，并保持跨章节一致性。

**状态：** 🚧 开发中（3 天 MVP）· Schema 版本 `0.1`

---

## 这是什么

把 3 章以上的小说自动转成一份**可编辑、可继续打磨**的结构化剧本初稿。核心不是"给人看的剧本文本"，而是"一份人能改、机器也能用的结构化剧本数据"。

- **结构化 YAML 作为中间表示（IR）** —— 内容与格式分离，一份数据多格式渲染。
- **跨章节一致性** —— 分章处理 + 章节间传递 running state（角色 + 剧情摘要）。
- **Story Bible 双向** —— 世界观 / 人设 / 大纲可由作者输入，也可由 AI 反推、交作者确认。

详见 `docs/`（本地，暂未纳入版本控制）中的产品文档、技术设计文档、Schema 设计文档。

---

## 技术栈

| 层 | 选型 |
|---|---|
| 框架 | Next.js 14（App Router）+ TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| 状态 | Zustand + TanStack Query |
| LLM 编排 | 手写 TS prompt chain + Vercel AI SDK（流式） |
| Schema 真源 | Zod → `js-yaml` 序列化成 YAML |
| YAML 编辑器 | CodeMirror 6 |
| 模型 | Claude / GPT（structured output） |
| 部署 | Vercel |

---

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量（见下方「环境配置」）
cp .env.example .env.local

# 3. 启动开发服务器
npm run dev
```

打开 http://localhost:3000 。

---

## 环境配置

需要在 `.env.local` 中配置（**密钥仅服务端，绝不加 `NEXT_PUBLIC_` 前缀**）：

```bash
# LLM Provider（接一家即可）
LLM_API_KEY=sk-...

# Supabase
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
# SUPABASE_SERVICE_ROLE_KEY=
```

---

## 目录结构

三层心智模型(前端 / 后端 / workflow)映射到 Next.js 的约定目录:

```
zhemu/
├── app/                        # Next.js App Router
│   ├── page.tsx                # 〔前端〕四步向导外壳（步骤态存 Zustand）
│   └── api/                    # 〔后端〕薄路由层，key 只在服务端，逻辑下沉 lib
│       ├── extract-bible/      #   POST 小说 → Bible（流式）
│       └── convert-chapter/    #   POST 单章 → Unit（场景）
├── components/
│   ├── ui/                     # 〔前端〕shadcn 原语
│   └── wizard/                 # 〔前端〕NovelInput / BibleEditor / Conversion / Editor / VersionPanel
├── lib/
│   ├── schema.ts               # Zod 真源（三层共享）
│   ├── store/                  # 〔前端〕Zustand 会话态 + 版本管理快照
│   ├── llm/                    # 〔workflow〕provider 抽象 + prompt cache + 修复 loop
│   ├── pipeline/               # 〔workflow〕segment / extract-bible / world-info / convert-chapter / summary / assemble
│   └── render/                 # 纯函数 renderer（中式 / 好莱坞）
└── docs/                       # 设计文档（本地，gitignore）
```

---

## 开发计划

见 [docs/DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md)。

---

## 提交规范（Commit & PR）

### Commit

- **一次只做一件事**：单个 commit 对应一个原子改动，便于回溯与 review。
- **格式**：`<type>(<scope>): <一句话说明>`
  - `type`：`feat`(新功能) / `fix`(修 bug) / `docs`(文档) / `refactor`(重构) / `test`(测试) / `chore`(脚手架·依赖·配置) / `style`(纯格式) / `perf`(性能)
  - `scope`（可选）：改动模块，如 `schema` / `pipeline` / `llm` / `store` / `ui` / `render`
  - 示例：`feat(store): 版本快照与回滚`、`fix(store): 用单调 seq 生成快照 id，避免删除后复用`
- 正文（可选）：解释**为什么这么改**，而非复述改了什么。

### Pull Request

> **核心原则：每个 PR 只做一件事。**

- 每个 PR 只实现或修改**单一功能**；鼓励尽可能小、粒度尽可能细的 PR。
- 大功能应**拆分为多个独立 PR** 分步提交。
- **合并后主分支必须保持可运行**——评委在任意时间查看都能复现演示效果。

PR 标题与描述需清晰完整，包含四部分：

1. **标题**：一句话说明本 PR 新增/修改了什么。
2. **功能描述**：该功能的作用与使用方式。
3. **实现思路**：技术选型或核心实现逻辑简述。
4. **测试方式**：如何验证该功能正常运行。

**PR 描述模板**（复制到正文）：

```markdown
## 功能描述
<这个 PR 加了什么 / 改了什么，怎么用>

## 实现思路
<技术选型、核心实现逻辑>

## 测试方式
<复现步骤：评委照着就能验证它正常运行>
```
