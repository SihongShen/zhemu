# 折幕（Zhémù）

> 一折一幕，把小说折成一幕幕剧本。

**折幕**是一个把小说自动转成**结构化剧本（YAML）**的 AI 工具。核心不是"生成一段给人看的剧本文本"，而是产出一份**人能改、机器也能用的结构化剧本数据**——内容与格式分离，同一份数据可再渲染成中式 / 好莱坞等多种剧本格式，并在整本范围内保持跨章节一致性。

Schema 版本 `0.1` · 详见 [剧本 YAML Schema 设计文档](docs/剧本YAML_Schema设计文档.md)  

[demo视频](https://www.xiaohongshu.com/discovery/item/6a25882c0000000008024771?source=webshare&xhsshare=pc_web&xsec_token=YB1Sa4tjLXeYpx6orV4-zeqjd94pXSPZ8DgZ6ZuBnIRz0=&xsec_source=pc_share)

---

## 为什么是"结构化数据"而不是"一段剧本文本"

直接让大模型把小说写成剧本，会得到一坨**锁死了格式、无法二次加工**的文本：想换成好莱坞格式得重写，想统计某个角色的戏量、抽出所有台词配音、按场景排期——都无从下手。

折幕把中间产物定义成一份 **结构化 YAML（中间表示 / IR）**：

```
小说  ──►  Story Bible（世界观/人物/大纲）  ──►  结构化剧本 YAML  ──►  多格式渲染
                （AI 提取或推测，人确认）              （Zod 校验的真数据）      中式 / 好莱坞 / 纯文本
```

- 一份数据，多格式渲染——**渲染只是下游**，不绑死任何单一剧本格式。
- 角色用稳定 `id` 引用而非裸名字——改名、别名、重名都安全，戏量统计/关键词匹配可靠。
- 场景由"动作 / 台词 / 转场 / 镜头"按顺序组成的有序元素表达——贴合剧本的线性本质，可被机器逐个消费。

---

## 核心特性

### 四个正交维度（别混成一个"格式"）

| | 维度 | 取值 | 何时决定 | 性质 |
|---|---|---|---|---|
| ① | **制式** | 中式 / 好莱坞 | 渲染期，可随时切 | 自由下游，不进数据 |
| ② | **体量** | 电影 / 竖屏短剧 / 剧集 | 生成前 | 烤进数据（短剧场景更碎、多用 `shot` 分镜） |
| ④ | **改编自由度** | 忠实 / 平衡 / 自由 | 生成前 | 烤进数据；**自由**档支持自定义改编要求（如"把背景改到赛博都市"） |
| ③ | **输出格式** | YAML / 纯文本 | 导出期 | 自由下游 |

②④① 在生成前选定、③ 在导出时选——把这四件事拆开，是整个 schema 设计的出发点。

### 跨章节一致性

逐章转换，章节之间传递**滚动状态**：

- **封闭角色清单**：转每一章时把 Bible 已有的角色 `id` 清单注入 prompt，模型只能复用清单内的 id，不许就地另造——保证全片"林夏"始终是同一个 `char_linxia`。组装后再跑一遍**引用完整性校验**，未知引用回填并标记人工复核。
- **滚动摘要**：每章转完压一段"到目前为止发生了什么"，带给下一章保持连贯。
- **世界书式注入**：世界观与主角常驻注入，配角按关键词命中本章才注入——既保一致又不撑爆 context。

### 双向 Story Bible

世界观 / 人物 / 大纲既可由作者输入（作为 grounding），也可由 AI 从小说反推、交作者在"确认设定"步骤里修改确认——同一套结构，两个方向。

### 编辑、版本与对比

- CodeMirror YAML 编辑器，改完实时 Zod 校验、即时切制式预览。
- 纯客户端**多作品库** + **整本版本快照 / 回滚** + **版本 diff 高亮对比**（绿增 / 红删），全部落 IndexedDB，无需登录。
- 逐章**断点续跑**：长篇转到一半失败，前面的章不丢，重试从断点继续。

### 一键看产物

作品库提供《雾港》示例，覆盖**体量×3**（电影 / 短剧 / 剧集）与**改编×3**（忠实 / 平衡 / 自由·赛博），点开秒进编辑器对比，无需等待生成。

---

## 工作原理

```
① 导入小说 ──► extract-bible：AI 反推 Bible ──► ② 确认设定（人在环）
                                                         │
                                                         ▼
④ 编辑 / 导出 ◄── assemble：引用完整性校验 + 组装 ◄── ③ 逐章转换
   （YAML 编辑、切制式、版本 diff、导出）        convert-chapter + 滚动摘要
```

- **逐章编排在客户端**：浏览器逐章 `POST /api/convert-chapter`，每次只转一章，稳稳落在 serverless 单次 60s 限制内；assemble、序列化、渲染都是前端纯函数。
- **结构化输出**：DeepSeek（OpenAI 兼容）强制 function-calling 产出 JSON → Zod 校验 → 失败把错误回灌让模型自修复（最多重试 2 次）→ `js-yaml` 序列化成 YAML。
- **Zod 是唯一真源**：同一套 Zod 既做转换期结构校验、又定 API 契约、又给前端实时校验，不维护第二份定义。

---

## 技术栈

| 层 | 选型 |
|---|---|
| 框架 | Next.js 14（App Router）+ TypeScript |
| UI | Tailwind CSS + Radix UI（野兽派 / 硬描边直角风格） |
| 状态 / 持久化 | Zustand + persist → IndexedDB（idb-keyval）· 单用户、无 auth、多作品库 |
| Schema 真源 | Zod → `js-yaml` 序列化 |
| YAML 编辑器 | CodeMirror 6（`@uiw/react-codemirror` + `@codemirror/lang-yaml`） |
| LLM | DeepSeek（OpenAI 兼容，`openai` SDK）· 强制非思考 · function-calling 结构化输出 |
| 文档解析 | mammoth（`.docx`） |
| 部署 | Vercel（或港区/国内可直连平台） |

---

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local   # 填入 LLM_API_KEY

# 3. 启动
npm run dev                  # http://localhost:3000
```

不配 `LLM_API_KEY` 也能打开站点、看《雾港》示例（纯静态）；真实"上传→生成"需要 key。

### 环境变量

密钥**仅服务端**，**绝不加 `NEXT_PUBLIC_` 前缀**。

```bash
LLM_API_KEY=           # DeepSeek API Key（必填，仅真实生成时用到）
LLM_BASE_URL=https://api.deepseek.com
LLM_MODEL=deepseek-chat   # 代码强制非思考，v4-pro 等也可
# 可选限速（生产生效；不填用默认 100 次/15 分钟·IP、800 次/天）
# LLM_RATELIMIT_PER_IP=
# LLM_DAILY_CAP=
```

> 生产环境（`NODE_ENV=production`）下，演示端点返回预置静态结果、不触发付费 LLM；真实生成路由带内存限速 + 错误脱敏。

---

## 目录结构

```
zhemu/
├── app/
│   ├── (marketing)/             # 落地页
│   ├── (app)/works/             # 作品库（多作品 + 一键加载示例）
│   ├── (app)/studio/            # 四步向导：导入 → 确认设定 → 生成 → 编辑导出
│   └── api/                     # 薄路由层（key 仅服务端，逻辑下沉 lib）
│       ├── extract-bible/       #   POST 小说 → Bible
│       ├── convert-chapter/     #   POST 单章 → Unit（场景）
│       ├── update-summary/      #   POST → 滚动摘要
│       └── smoke-convert/       #   演示端点（生产返回静态 mock）
├── components/wizard/           # NovelInput / BibleEditor / Conversion / Editor / VersionPanel / DiffView …
├── lib/
│   ├── schema.ts                # Zod 真源（三层共享）
│   ├── api-schema.ts            # API 边界校验 + 输入限长
│   ├── store/                   # Zustand + persist → IndexedDB（多作品 / 版本快照 / 断点）
│   ├── llm/                     # DeepSeek 客户端 + withRepair + 限速 + prompts
│   ├── pipeline/                # segment / extract-bible / world-info / convert-chapter / summary / assemble
│   ├── render/                  # 纯函数 renderer（中式 / 好莱坞）
│   └── diff.ts                  # 版本对比（LCS）
└── docs/                        # 设计文档（产品 / 技术 / Schema）
```

---

## 文档

- [剧本 YAML Schema 设计文档](docs/剧本YAML_Schema设计文档.md) —— schema 逐字段定义与设计原因（**核心**）
- [产品文档](docs/产品文档_小说转剧本.md) —— 定位、四维度、一致性引擎、流程
- [技术设计文档（工程侧）](docs/技术设计文档_工程侧.md) —— 架构、pipeline 编排、前端、长任务、错误处理
