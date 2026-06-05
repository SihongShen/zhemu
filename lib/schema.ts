/**
 * Zod 真源(single source of truth)。
 * 三层共享:workflow 用它做 structured output 校验,后端按它定 API 契约,
 * 前端编辑器用它做实时校验(红波浪线)。
 *
 * Day 1:把 Schema 设计文档第 5 节落成 Zod —— Screenplay / Bible / Unit / Scene / Element。
 * 真正类型由 `z.infer` 推导,下面是占位,实现后删除占位、改为 `export type X = z.infer<typeof XSchema>`。
 *
 * @see docs/DEVELOPMENT_PLAN.md · Day 1
 */

// import { z } from 'zod'

// ——— 占位类型(Day 1 用 z.infer 替换)———
export type Bible = unknown
export type Screenplay = unknown
export type Unit = unknown
export type Scene = unknown
export type Element = unknown

// id slug 约定(便于 debug 与人工编辑):
//   char_<拼音>  /  sc_<序号>  /  unit_ch<章号>
export {}
