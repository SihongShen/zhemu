/**
 * Demo 预置作品《雾港》三档体量（电影 / 短剧 / 剧集）。
 * 用当前代码跑出、refresh-demo.mjs 写下的三份 fixture，现场点对应入口即可秒进编辑器，
 * 对比"同一个故事、三种体量"的形态差异（短剧场景更碎、shot 更多）。
 * fixture 较大，按需 dynamic import，不塞进 /works 初始 bundle。
 */
import { screenplayToYaml } from '@/lib/serialize'
import type { Bible, Screenplay } from '@/lib/schema'
import type { LengthForm } from '@/lib/store/project-store'

export interface DemoSample {
  key: LengthForm
  title: string
  label: string // 按钮短标签
}

export const DEMO_SAMPLES: DemoSample[] = [
  { key: 'feature', title: '雾港 · 电影', label: '电影' },
  { key: 'short', title: '雾港 · 短剧', label: '短剧' },
  { key: 'series', title: '雾港 · 剧集', label: '剧集' },
]

// feature 复用 smoke-convert 的 mock fixture；short/series 单独存。
const LOADERS: Record<LengthForm, () => Promise<{ default: unknown }>> = {
  feature: () => import('@/app/api/smoke-convert/demo-screenplay.json'),
  short: () => import('@/lib/_dev/wugang-short.json'),
  series: () => import('@/lib/_dev/wugang-series.json'),
}

/** 异步构造可喂给 store.importWork 的成形作品（按 key 懒加载对应 fixture）。 */
export async function buildDemoWork(key: LengthForm) {
  const sample = DEMO_SAMPLES.find((s) => s.key === key) ?? DEMO_SAMPLES[0]
  const sp = (await LOADERS[key]()).default as unknown as Screenplay
  return {
    title: sample.title,
    bible: sp.bible as Bible,
    currentYaml: screenplayToYaml(sp),
    status: 'done' as const,
    snapshotLabel: `示例 · ${sample.label} v1`,
    settings: { lengthForm: key, adaptationMode: 'balanced' as const, style: 'cn-standard' as const },
  }
}
