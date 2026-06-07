/**
 * Demo 预置作品《雾港》，两个维度对比：
 *  - 体量（均 balanced 改编）：电影 / 短剧 / 剧集
 *  - 改编（均 feature 体量，以电影为基准）：忠实 / 平衡 / 自由
 * 「平衡」就是「电影」那一格（feature + balanced），复用同一份 fixture，不重复生成。
 * fixture 较大，按需 dynamic import，不塞进 /works 初始 bundle。
 */
import { screenplayToYaml } from '@/lib/serialize'
import type { Bible, Screenplay } from '@/lib/schema'
import type { LengthForm, AdaptationMode } from '@/lib/store/project-store'

type FixtureKey = 'feature' | 'short' | 'series' | 'faithful' | 'free'

// 「自由」示例用的自定义改编要求。⚠️ 必须与 scripts/refresh-demo.mjs 里 free job 的 brief 完全一致，
// 否则展示的 brief 与实际生成 fixture 用的不符。
export const FREE_DEMO_BRIEF =
  '把背景从旧港口搬到近未来赛博都市：雾是数据烟尘、码头变数据港、纸质账本变成被篡改的链上记录；人物关系与寻亲悬疑主线保留不变。'

// feature 复用 smoke-convert 的 mock fixture；其余单独存在 lib/_dev。
const LOADERS: Record<FixtureKey, () => Promise<{ default: unknown }>> = {
  feature: () => import('@/app/api/smoke-convert/demo-screenplay.json'),
  short: () => import('@/lib/_dev/wugang-short.json'),
  series: () => import('@/lib/_dev/wugang-series.json'),
  faithful: () => import('@/lib/_dev/wugang-faithful.json'),
  free: () => import('@/lib/_dev/wugang-free.json'),
}

export interface DemoSample {
  id: string
  group: '体量' | '改编'
  label: string // 按钮短标签
  title: string // 作品标题
  lengthForm: LengthForm
  adaptationMode: AdaptationMode
  fixture: FixtureKey
  brief?: string // 自定义改编要求（仅自由档示范用）
}

export const DEMO_SAMPLES: DemoSample[] = [
  // 体量（均 balanced 改编）
  { id: 'len-feature', group: '体量', label: '电影', title: '雾港 · 电影', lengthForm: 'feature', adaptationMode: 'balanced', fixture: 'feature' },
  { id: 'len-short', group: '体量', label: '短剧', title: '雾港 · 短剧', lengthForm: 'short', adaptationMode: 'balanced', fixture: 'short' },
  { id: 'len-series', group: '体量', label: '剧集', title: '雾港 · 剧集', lengthForm: 'series', adaptationMode: 'balanced', fixture: 'series' },
  // 改编（均 feature 体量，以电影为基准）
  { id: 'adp-faithful', group: '改编', label: '忠实', title: '雾港 · 忠实改编', lengthForm: 'feature', adaptationMode: 'faithful', fixture: 'faithful' },
  { id: 'adp-balanced', group: '改编', label: '平衡', title: '雾港 · 平衡改编', lengthForm: 'feature', adaptationMode: 'balanced', fixture: 'feature' },
  { id: 'adp-free', group: '改编', label: '自由·赛博', title: '雾港 · 自由改编（赛博版）', lengthForm: 'feature', adaptationMode: 'free', fixture: 'free', brief: FREE_DEMO_BRIEF },
]

/** 异步构造可喂给 store.importWork 的成形作品（按 sample 懒加载对应 fixture）。 */
export async function buildDemoWork(sample: DemoSample) {
  const sp = (await LOADERS[sample.fixture]()).default as unknown as Screenplay
  return {
    title: sample.title,
    bible: sp.bible as Bible,
    currentYaml: screenplayToYaml(sp),
    status: 'done' as const,
    snapshotLabel: `示例 · ${sample.label} v1`,
    settings: {
      lengthForm: sample.lengthForm,
      adaptationMode: sample.adaptationMode,
      style: 'cn-standard' as const,
      ...(sample.brief ? { adaptationBrief: sample.brief } : {}),
    },
  }
}
