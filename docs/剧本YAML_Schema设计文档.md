# 剧本 YAML Schema 设计文档

> 配套产品：**折幕（Zhémù）** · 小说 → 结构化剧本（YAML）工具
> Schema 版本：`0.1` · 状态：已随产品落地（结构真源见仓库 `lib/schema.ts`）
> 结构真源：**Zod**（TS-first，运行时校验，可派生 JSON Schema 与类型）

---

## 0. 文档目的与范围

本文定义剧本的 **YAML Schema**，并逐项说明**为什么这么设计**。

- **真源是 Zod**：所有结构以第 5 节的 Zod 为准；JSON Schema、TS 类型、本文档均由它派生，避免多份定义漂移。
- **YAML 是面向人的序列化形态**：LLM 实际产出 JSON（更可靠），经 Zod 校验后由 `js-yaml` 序列化成 YAML 给作者读写。
- 范围：剧本的**内容结构**。① 制式（中式 / 好莱坞）的排版不在 schema 内、由 renderer 负责；② 体量 / ④ 改编自由度是**转换参数**（影响数据本身，非渲染）；③ 输出格式属导出层。四个正交维度详见产品文档 §3.1、本文 §1 原则一。

---

## 1. 设计哲学（三条原则）

**原则一：内容与格式分离。**
Schema 只描述"故事是什么"（这是场景标题、这是台词、这是谁说的），不描述"长什么样"。同一份 YAML 可换 **① 制式**渲染成中式 / 好莱坞，再换 **③ 输出格式**导出纯文本等。成熟的 AI 编剧工具能一键切中式/好莱坞，正说明其内部也是一份结构化数据 + 多个 renderer——若 schema 直接照抄某一种剧本格式，就锁死了，切不动。

> ⚠️ **别把 ② 体量（短剧/电视剧）当渲染维度**：它是**转换参数**，改的是数据本身（短剧更碎的场景颗粒、`shot` 分镜字段等），不在 renderer 层。① 制式才是"同一份数据换排版"。

**原则二：两层结构——Bible 层 + Script 层。**
`bible`（世界书：世界观/角色/大纲）框定全局，`script`（内容：场景/台词/动作）承载剧情。Bible 层字段**既可作输入**（作者提供，grounding）**也可作输出**（AI 从小说反推，作者确认）——同一套结构，两个方向。它同时是 pipeline 的"世界书注入"数据源，保障跨章节一致性。

**原则三：语义化 + 可溯源 + 渐进填充。**
- **语义化**：用 `id` 引用而非裸字符串、用 type-tagged 列表表达异构有序元素——让数据可被机器消费（戏量统计、配音、分镜）。
- **可溯源**：每个 unit 记 `source_chapter`，编辑/重跑可定位到原文。
- **渐进填充**：只设极小必填核心，其余 optional。允许 AI 先出粗稿、作者逐步打磨、字段逐步补全。

---

## 2. 顶层结构

```
Screenplay
├── version            # schema 版本（迁移用）
├── meta               # 项目元信息：标题/logline/类型/默认格式/来源
├── bible              # 世界书层（框定 + 一致性）
│   ├── world          #   世界观/设定（常驻注入）
│   ├── characters[]   #   角色表（每个是一个世界书 entry）
│   └── outline[]      #   大纲/结构节点（对应原文章节区间）
└── script[]           # 内容层
    └── Unit           #   章/集
        ├── summary    #     滚动摘要（兼作 pipeline 记忆 + 导航）
        └── scenes[]
            └── Scene
                ├── heading            # 结构化场景标题（内外/地点/时间）
                ├── characters_present # 本场角色（戏量统计/世界书）
                └── elements[]         # 有序异构元素（discriminated union）
```

---

## 3. 各部分定义与设计原因

### 3.1 `version`

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| version | `"0.1"` | ✓ | schema 版本号 |

**为什么**：schema 会演进。固定版本号让校验器/renderer 能识别并迁移旧数据，保证向前兼容。

### 3.2 `meta`（项目元信息）

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| title | string | ✓ | 剧名 |
| logline | string | | 一句话故事 |
| genre | string[] | | 类型（可多个） |
| target_format | enum | | 默认渲染目标：`cn-standard`/`hollywood`/`short-drama`/`stage` |
| language | string | | 默认 `zh` |
| source | object | | 来源小说信息（书名/作者/章节数） |

**为什么**：
- `genre` 用数组——一部作品常跨多类型。
- `target_format` 只是**默认渲染提示**，不是内容；渲染由 renderer 决定（原则一）。放这里是为了方便，可选。
- `source` 保留溯源，便于追踪改编自哪部原文。

### 3.3 `bible`（世界书层）

#### `bible.world`（世界观/设定）

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| summary | string | ✓ | 世界观一段话（**常驻注入**全程框定） |
| time_period | string | | 时代背景 |
| locations | string[] | | 主要地点 |
| rules | string[] | | 世界规则/关键设定要点 |
| tone | string | | 基调 |

**为什么**：`summary` 是每次转换调用都注入的"常驻 entry"，永不丢失，从根上防止上下文丢失与设定漂移。

#### `bible.characters[]`（角色表，每个 = 一个世界书 entry）

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| id | string | ✓ | **稳定标识**，台词等处用它引用 |
| name | string | ✓ | 显示名 |
| aliases | string[] | | 别名（兼作关键词） |
| role | enum | | protagonist/antagonist/supporting/minor |
| description | string | | 人设 |
| keywords | string[] | | 选择性注入触发词 |
| injection | enum | | `constant`（常驻）/`selective`（按需），默认 selective |

**为什么**：
- **用 `id` 引用而非角色名**：角色会改名/有别名/重名，裸名字做引用会脆。`id` 解耦后，改名只改一处，且戏量统计、关键词匹配都可靠。这是"机器可消费"的关键。
- `keywords` + `injection`：实现"世界书（world-info）"式的注入——主角设 `constant` 每次都带，配角设 `selective` 仅在本章命中其 keywords 时注入，既保一致又不撑爆 context。

#### `bible.outline[]`（大纲/结构节点）

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| id | string | ✓ | 节点标识 |
| title | string | ✓ | 节点名 |
| summary | string | | 概要 |
| structure_tag | string | | 结构标签，如"第一幕-触发事件"/"英雄之旅-启程" |
| chapter_range | [number, number] | | 对应原文章节区间 |

**为什么**：给 AI 提供宏观结构，让它把场景**对应到故事结构**而非平铺直转；`chapter_range` 把大纲锚回原文，便于分章转换时定位。

### 3.4 `script[]`（内容层）

#### `Unit`（章/集）

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| id | string | ✓ | 单元标识 |
| source_chapter | number | | **溯源**：对应原小说第几章 |
| title | string | | 章/集标题 |
| summary | string | | **滚动摘要** |
| scenes | Scene[] | ✓ | 场景列表 |

**为什么**：`summary` 一字段两用——既是 pipeline 转下一章时带的"记忆"（不必重读全文），又是给作者的导航；`source_chapter` 让"重跑/编辑某一章"能精准定位、不影响其它章。

#### `Scene`（场景）

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| id | string | ✓ | 场景标识 |
| heading | SceneHeading | ✓ | 结构化场景标题 |
| synopsis | string | | 场景概要 |
| characters_present | string[] | | 本场出场角色（character id） |
| elements | Element[] | ✓ | 有序元素列表 |

`SceneHeading`：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| int_ext | enum | ✓ | `INT`/`EXT`/`INT_EXT`（内/外/内外） |
| location | string | ✓ | 地点 |
| time | enum\|string | | `DAY`/`NIGHT`/… 或自由文本 |

**为什么 heading 拆成结构字段而不是一行 slug 字符串**：这正是"内容/格式分离"的落点。中式标题（`第1场 钟表铺 夜 内`）和好莱坞（`INT. CLOCK SHOP - NIGHT`）排列不同——只有把内外/地点/时间拆开存，renderer 才能各自拼出对应格式，还能按地点做排期、按时间过滤。
**为什么有 `characters_present`**：戏量统计、世界书选择性注入都直接读它，几行代码出结果。

#### `Element`（场景元素，按 `type` 区分的 discriminated union）

| type | 字段 | 说明 |
|---|---|---|
| `action` | text | 动作/场景描述 |
| `dialogue` | character(id), line, parenthetical?, delivery? | 台词；delivery: normal/V.O./O.S. |
| `transition` | text | 转场（切 / CUT TO） |
| `shot` | text | 镜头/分镜（短剧用） |

**为什么用"有序的、带 type 标签的列表"**：剧本本质就是动作、台词、转场按顺序交替的序列。用一个有序数组保留顺序；用 `type` 标签做 discriminated union，让 Zod 能按类型精确校验（dialogue 必须有 character，action 不需要），renderer 也按顺序逐个渲染。比"分别存一个 action 数组、一个 dialogue 数组"更贴合剧本的线性本质。

### 3.5 id 约定与引用完整性（一致性的落地机制）

整套一致性最终落在"引用稳定"上，这里写死规则：

**id 权威源 = bible。** `bible.characters[].id` 是角色 id 的唯一权威来源。`dialogue.character` 和 `scene.characters_present` 只能引用 bible 中**已存在**的 id。

**转换时的约束（pipeline 行为，非自由发挥）：**
- 转某一章时，把 bible 已有的 `{id, name, aliases}` 作为**封闭清单**注入 prompt，要求模型把台词归到清单内的 id；
- 遇到 bible 里没有的新角色 → **不允许就地造 id**，而是产出一个"待加入 bible"的提案，回填 bible（并交作者确认），再继续——保证全片同一个人始终是同一个 id。
- 这就是为什么第 2 章不会把"林夏"写成新的 `char_lin`：模型拿到的是 `char_linxia` 这张封闭清单，不是让它自己重命名。

**引用完整性校验（Zod 之外的语义校验）：** Zod 只保证结构合法，下面这层保证**引用合法**，组装后必跑：
```
对每个 unit / scene：
  ∀ dialogue.character ∈ bible.characters[].id
  ∀ characters_present ∈ bible.characters[].id
违反 → 报错并触发修复 / 回填 bible
```

**id 生成约定**：用**可读 slug**而非随机 uuid——`char_<拼音>`、`sc_<序号>`、`unit_ch<章号>`、`beat_<序号>`。理由：debug、人工编辑、prompt 里让模型对齐时都更直观，冲突也肉眼可查。

### 3.6 边界与降级规则

原则：**能定死的规则定死；定不死的不许瞎猜，置 `needs_review: true` + `note` 浮给作者收口。** 同一原文每次走同一条路，且不确定处变成人工 checkpoint 而非静默幻觉。

为此 schema 增了 `scene.mode`（闪回/梦境/蒙太奇）、`scene.needs_review` + `scene.note`；并约定保留一个 `char_narrator`（旁白）bible entry。pipeline 按下表映射：

| 原文情形 | 映射规则 |
|---|---|
| 纯叙述无对白 | 全 `action` 元素的场景；**绝不编造台词** |
| 内心独白 / 第一人称想法 | 该角色 `dialogue` + `delivery: V.O.` |
| 叙述者旁白 | `char_narrator` + `delivery: V.O.`；纯环境描写 → `action` |
| 地点不明 | `location: "未指明"` + `needs_review: true`（不猜地点） |
| 时间不明 | `time` 留空（字段 optional） |
| 闪回 / 梦境 / 蒙太奇 | 用 `scene.mode` 标记，渲染时拼进 slug |
| 信件 / 短信被读出 | 被读 → `dialogue`（读的人）；仅呈现文字 → `action`（定死二选一） |
| 某场无任何有效元素 / 某章无任何有效场景 | **组装期清理**：丢弃该空场景 / 空单元（不让空结构污染产物），被丢的章记入 `report.droppedChapters` 并向用户提示「N 章无内容已跳过」——**非静默丢失** |

> 设计理由：降级规则写进 schema + prompt，避免 LLM 对同类情形每次即兴产出不同结构；`needs_review` 把模型的"不确定"显式化，正好喂给"可编辑、可打磨"的人在环节。

---

## 4. 完整 YAML 示例

```yaml
version: "0.1"

meta:
  title: 雨巷
  logline: 一个失忆的钟表匠在雨夜遇见声称是他妻子的陌生女人。
  genre: [悬疑, 爱情]
  target_format: cn-standard
  language: zh
  source:
    novel_title: 雨巷
    author: 佚名
    chapter_count: 5

bible:
  world:
    summary: 1990 年代南方小城，常年阴雨，时间仿佛停滞。
    time_period: 1990s
    locations: [钟表铺, 老城雨巷, 火车站]
    rules:
      - 主角林夏患逆行性失忆，只记得最近三天的事
    tone: 潮湿、克制、宿命感
  characters:
    - id: char_linxia
      name: 林夏
      aliases: [林师傅, 钟表匠]
      role: protagonist
      description: 三十岁的钟表匠，沉默，手很稳，记不住三天前的事。
      keywords: [林夏, 林师傅, 钟表]
      injection: constant          # 主角常驻注入
    - id: char_guming
      name: 顾明
      aliases: [顾]
      role: supporting
      description: 自称是林夏妻子的女人，眼神笃定。
      keywords: [顾明, 妻子]
      injection: selective         # 仅在其出现的章节注入
    - id: char_narrator
      name: 旁白
      role: minor
      description: 叙述者画外音（保留 entry，承载旁白/V.O.）
      injection: constant
  outline:
    - id: beat_01
      title: 雨夜相遇
      structure_tag: 第一幕-触发事件
      summary: 顾明在打烊时走进钟表铺，声称是林夏的妻子。
      chapter_range: [1, 1]

script:
  - id: unit_ch01
    source_chapter: 1
    title: 第一章 打烊
    summary: 雨夜，顾明进入钟表铺自称林夏妻子，林夏毫无印象。
    scenes:
      - id: sc_01
        heading:
          int_ext: INT
          location: 钟表铺
          time: NIGHT
        synopsis: 顾明冒雨进店，林夏正在关门。
        characters_present: [char_linxia, char_guming]
        elements:
          - type: action
            text: 雨敲在玻璃上。林夏拉下半截卷帘门，回头——顾明站在门口，伞还在滴水。
          - type: dialogue
            character: char_guming
            parenthetical: 收伞
            line: 你又忘了关后窗。
          - type: dialogue
            character: char_linxia
            delivery: normal
            line: ……你是谁？
          - type: dialogue
            character: char_guming
            line: 你妻子。第三次告诉你了。
          - type: transition
            text: 切
```

---

## 5. Zod Schema（结构真源）

```typescript
import { z } from "zod";

// ---- 枚举 ----
export const IntExt = z.enum(["INT", "EXT", "INT_EXT"]);                 // 内 / 外 / 内外
export const TimeOfDay = z.enum(["DAY", "NIGHT", "DAWN", "DUSK", "CONTINUOUS", "LATER"]);
export const CharacterRole = z.enum(["protagonist", "antagonist", "supporting", "minor"]);
export const Injection = z.enum(["constant", "selective"]);             // 世界书注入策略
export const Delivery = z.enum(["normal", "V.O.", "O.S."]);             // 旁白/画外音
export const SceneMode = z.enum(["normal", "flashback", "flashforward", "dream", "montage"]);

// ---- Bible 层 ----
export const WorldSetting = z.object({
  summary: z.string().trim().min(1),                    // 常驻注入；非空是硬约束，空则触发 repair
  time_period: z.string().optional(),
  locations: z.array(z.string()).default([]),
  rules: z.array(z.string()).default([]),
  tone: z.string().optional(),
});

export const CharacterEntry = z.object({
  id: z.string(),                                       // 稳定引用标识
  name: z.string(),
  aliases: z.array(z.string()).default([]),
  role: CharacterRole.optional(),
  description: z.string().optional(),
  keywords: z.array(z.string()).default([]),            // 选择性注入触发词
  injection: Injection.default("selective"),
});

export const Beat = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string().optional(),
  structure_tag: z.string().optional(),
  chapter_range: z.tuple([z.number(), z.number()]).optional(),
});

export const Bible = z
  .object({
    world: WorldSetting,
    characters: z.array(CharacterEntry),
    outline: z.array(Beat).default([]),
  })
  // 角色 id「全篇唯一」是核心不变量（id 是引用权威源）：收进 schema，
  // 让 withRepair 在出现重复 id 时直接触发修复，而不是放进下游再炸。
  .superRefine((bible, ctx) => {
    const seen = new Set<string>();
    bible.characters.forEach((c, i) => {
      if (seen.has(c.id)) {
        ctx.addIssue({
          code: "custom",
          path: ["characters", i, "id"],
          message: `角色 id 重复：${c.id}（同一人不同称呼请放进 aliases）`,
        });
      }
      seen.add(c.id);
    });
  });

// ---- 场景元素（discriminated union）----
export const ActionElement = z.object({
  type: z.literal("action"),
  text: z.string(),
});
export const DialogueElement = z.object({
  type: z.literal("dialogue"),
  character: z.string(),                                // -> CharacterEntry.id
  parenthetical: z.string().optional(),                 // （小声地）
  delivery: Delivery.default("normal"),
  line: z.string(),
});
export const TransitionElement = z.object({
  type: z.literal("transition"),
  text: z.string(),                                     // 切 / CUT TO
});
export const ShotElement = z.object({
  type: z.literal("shot"),
  text: z.string(),                                     // 镜头/分镜（短剧）
});
export const Element = z.discriminatedUnion("type", [
  ActionElement, DialogueElement, TransitionElement, ShotElement,
]);

// ---- 场景 / 单元 ----
export const SceneHeading = z.object({
  int_ext: IntExt,
  location: z.string(),
  time: z.union([TimeOfDay, z.string()]).optional(),
});
export const Scene = z.object({
  id: z.string(),
  heading: SceneHeading,
  mode: SceneMode.default("normal"),                    // 闪回/梦境/蒙太奇
  synopsis: z.string().optional(),
  characters_present: z.array(z.string()).default([]),  // character ids
  elements: z.array(Element),                           // 空场景不在此硬失败，由组装期清理（见 §3.6）
  needs_review: z.boolean().default(false),             // 靠推断/降级处置时置 true
  note: z.string().optional(),                          // 为什么需复核
});
export const Unit = z.object({
  id: z.string(),
  source_chapter: z.number().optional(),                // 溯源
  title: z.string().optional(),
  summary: z.string().optional(),                       // 滚动摘要
  scenes: z.array(Scene),
});

// ---- 元信息 / 根 ----
export const Meta = z.object({
  title: z.string(),
  logline: z.string().optional(),
  genre: z.array(z.string()).default([]),
  target_format: z.enum(["cn-standard", "hollywood", "short-drama", "stage"]).optional(),
  language: z.string().default("zh"),
  source: z.object({
    novel_title: z.string().optional(),
    author: z.string().optional(),
    chapter_count: z.number().optional(),
  }).optional(),
});

export const Screenplay = z.object({
  version: z.literal("0.1"),
  meta: Meta,
  bible: Bible,
  script: z.array(Unit),
});

export type Screenplay = z.infer<typeof Screenplay>;
```

---

## 6. 关键设计决策汇总（为什么这么定）

| 决策 | 原因 |
|---|---|
| 内容/格式分离，格式不进 schema | 一份数据多格式渲染；避免锁死单一剧本格式（一键切中式/好莱坞的前提） |
| 两层：bible + script | bible 框定全局、可输入可反推；同时是世界书注入的数据源，保一致性 |
| heading 拆成 int_ext/location/time | 不同格式 slug 拼法不同；可按地点排期、按时间过滤 |
| 角色用 id 引用，非裸名字 | 改名/别名/重名安全；戏量统计、关键词匹配可靠；机器可消费 |
| characters 带 keywords + injection | 实现常驻/选择性世界书注入，防上下文丢失又不撑爆 context |
| elements 用有序 type-tagged union | 贴合剧本"动作/台词/转场顺序交替"的线性本质；Zod 按类型精确校验 |
| unit.summary（滚动摘要） | 一字段两用：pipeline 记忆 + 作者导航 |
| unit.source_chapter（溯源） | 重跑/编辑单章可精准定位，不波及其它章 |
| 极小必填 + 大量 optional | 渐进填充：AI 先出粗稿、作者逐步打磨 |
| 边界降级规则入 schema+prompt | 同类模糊情形每次走同一路；`needs_review` 把不确定性显式化交作者，不静默幻觉 |
| version 字段 | schema 演进的迁移锚点 |
| Zod 为真源 | TS-first 运行时校验，单一定义派生类型/JSON Schema/文档，防漂移 |
| LLM 出 JSON → 校验 → 转 YAML | JSON 输出更可靠；YAML 更适合人读写与 diff |

---

## 7. 校验、版本与扩展

- **结构校验**：LLM 产出 JSON → `Unit.safeParse()` / `Bible.safeParse()` → 失败把错误信息回灌让模型自修复（`withRepair`，最多重试 2 次）。角色 id 唯一性也收进 Bible 的 `superRefine`，重复即触发修复。
- **引用完整性校验**（结构合法之外的语义校验，见 §3.5）：组装后检查每个 `dialogue.character` / `characters_present` 都在 `bible.characters` 内；未知引用回填 stub 角色并把场景标 `needs_review`。
- **JSON Schema 派生**：转换期把出参 Zod 用 `z.toJSONSchema()`（Zod 4 内置）转成 function-calling 的工具入参 schema，不手写第二份。
- **版本迁移**：`version` 升级时写一个 `migrate(old) -> new` 函数；renderer 按 version 分支。
- **预留扩展（不入 v0.1，避免过度设计）**：
  - 元素类型可扩：`montage`（蒙太奇）、`dual_dialogue`（对白并置）、`super`（字幕）——加进 discriminated union 即可。
  - `dialogue` 可加 `emotion`/`voice` 字段，供 TTS 配音（量子探险式下游）。
  - `scene` 可加 `act_id` 反向关联 outline 节点，做结构可视化。
  - 这些都靠"加 optional 字段 / 加 union 成员"实现，不破坏既有数据——这正是渐进式 schema 的好处。
