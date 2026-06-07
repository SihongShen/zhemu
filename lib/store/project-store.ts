/**
 * 客户端持久化 + 作品库（前端）。单用户、无 auth。
 * 全部落 IndexedDB（不是 localStorage —— 多作品 × 多快照会撑爆 ~5MB）。
 * 一个 Work = 一部作品（原文 + 四维度设置 + currentYaml + 版本快照）。
 *
 * @see docs/DEVELOPMENT_PLAN.md · 持久化与作品库 / 版本管理 / 四个维度
 */
import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval'
import type { Bible, Unit } from '@/lib/schema'

// ——— 四个维度（命名见 DEVELOPMENT_PLAN）———
export type Style = 'cn-standard' | 'hollywood' //          ① 制式：自由，可切
export type LengthForm = 'feature' | 'short' | 'series' //  ② 体量：烤进数据，改了要重转
export type AdaptationMode = 'faithful' | 'balanced' | 'free' // ④ 改编自由度：烤进数据
export type ExportFormat = 'yaml' | 'text' | 'pdf' //      ③ 输出：自由，导出时选

export interface WorkSettings {
  lengthForm: LengthForm // ②
  adaptationMode: AdaptationMode // ④
  style: Style // ① 默认值，编辑器可改
  adaptationBrief?: string // ④ 可选自定义改编要求（v2）
}

export const DEFAULT_SETTINGS: WorkSettings = {
  lengthForm: 'feature',
  adaptationMode: 'balanced',
  style: 'cn-standard',
}

export type SnapshotOrigin = 'convert' | 'edit' | 'regen'

export interface Snapshot {
  id: string
  label: string
  origin: SnapshotOrigin
  yaml: string
  valid: boolean
  createdAt: number
}

export type WizardStep = 'input' | 'bible' | 'conversion' | 'editor'
export type WorkStatus = 'draft' | 'bible_ready' | 'converting' | 'done' | 'error'

/** 逐章转换的断点续跑进度（落在 work 上、持久化到 IndexedDB）。同一 job（sig 相同）才复用。 */
export interface ConvertProgress {
  sig: string // job 指纹：小说长度 + 章数 + ②④①设置；变了就视为新任务、不复用旧进度
  units: Unit[] // 已成功转换的章节单元（按章序）
  runningSummary: string // 截至最后一个已完成章的滚动摘要，用于续跑下一章
}

export interface Work {
  id: string
  title: string
  status: WorkStatus
  settings: WorkSettings
  novel: string
  bibleDoc?: string // ① 可选上传的「世界观/人设」设定文档，抽取时作 grounding
  bible?: Bible // ① 抽取 → ② 确认 → ③ 转换都用它（id 权威源）
  currentYaml: string
  snapshots: Snapshot[]
  convert?: ConvertProgress // ③ 转换中的断点（成功后清空）；中途失败可续跑
  seq: number // 单调快照编号源（只增不减，避免删除后复用 id）
  createdAt: number
  updatedAt: number
}

const MAX_SNAPSHOTS = 20

interface LibraryState {
  works: Record<string, Work>
  activeWorkId: string | null
  step: WizardStep
  workSeq: number // 单调，作品 id 用

  // —— 作品库（多作品）——
  createWork: (title?: string) => string
  /** 直接导入一部成形作品（用于「加载示例」/未来的导入功能），落一个初始快照并设为活动作品。 */
  importWork: (data: {
    title: string
    novel?: string
    bible?: Bible
    currentYaml: string
    settings?: Partial<WorkSettings>
    status?: WorkStatus
    snapshotLabel?: string
  }) => string
  deleteWork: (id: string) => void
  openWork: (id: string) => void
  closeWork: () => void // 回到作品库
  listWorks: () => Work[] // 派生：按 updatedAt 倒序

  // —— 当前作品（都作用在 activeWorkId 上，无活动作品则 no-op）——
  setStep: (s: WizardStep) => void
  setNovel: (n: string) => void
  setBibleDoc: (t: string) => void
  setBible: (b: Bible) => void
  setYaml: (y: string) => void
  setStatus: (s: WorkStatus) => void
  updateSettings: (patch: Partial<WorkSettings>) => void
  setConvertProgress: (p: ConvertProgress | undefined) => void // 落/清转换断点
  snapshot: (args: { label: string; origin: SnapshotOrigin; valid: boolean }) => void
  rollback: (id: string) => void
}

// IndexedDB 适配器（idb-keyval）。SSR/预渲染时无 indexedDB → 守卫成 no-op，避免 build 崩。
const idbStorage: StateStorage = {
  getItem: async (name) => {
    if (typeof indexedDB === 'undefined') return null
    return (await idbGet(name)) ?? null
  },
  setItem: async (name, value) => {
    if (typeof indexedDB === 'undefined') return
    await idbSet(name, value)
  },
  removeItem: async (name) => {
    if (typeof indexedDB === 'undefined') return
    await idbDel(name)
  },
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => {
      // 在 activeWork 上做不可变更新；自动 bump updatedAt
      const mutateActive = (fn: (w: Work) => Work) => {
        const { works, activeWorkId } = get()
        if (!activeWorkId) return
        const w = works[activeWorkId]
        if (!w) return
        set({ works: { ...works, [activeWorkId]: { ...fn(w), updatedAt: Date.now() } } })
      }

      return {
        works: {},
        activeWorkId: null,
        step: 'input',
        workSeq: 0,

        createWork: (title) => {
          const { works, workSeq } = get()
          const seq = workSeq + 1
          const id = `work_${seq}`
          const now = Date.now()
          const work: Work = {
            id,
            title: title?.trim() || `未命名作品 ${seq}`,
            status: 'draft',
            settings: { ...DEFAULT_SETTINGS },
            novel: '',
            currentYaml: '',
            snapshots: [],
            seq: 0,
            createdAt: now,
            updatedAt: now,
          }
          set({ works: { ...works, [id]: work }, activeWorkId: id, workSeq: seq, step: 'input' })
          return id
        },

        importWork: (data) => {
          const { works, workSeq } = get()
          const seq = workSeq + 1
          const id = `work_${seq}`
          const now = Date.now()
          const hasYaml = !!data.currentYaml
          const firstSnap: Snapshot = {
            id: 'snap_1',
            label: data.snapshotLabel ?? '初始版本',
            origin: 'convert',
            yaml: data.currentYaml,
            valid: true,
            createdAt: now,
          }
          const work: Work = {
            id,
            title: data.title?.trim() || `未命名作品 ${seq}`,
            status: data.status ?? 'done',
            settings: { ...DEFAULT_SETTINGS, ...data.settings },
            novel: data.novel ?? '',
            bible: data.bible,
            currentYaml: data.currentYaml,
            snapshots: hasYaml ? [firstSnap] : [],
            seq: hasYaml ? 1 : 0,
            createdAt: now,
            updatedAt: now,
          }
          set({ works: { ...works, [id]: work }, activeWorkId: id, workSeq: seq, step: 'editor' })
          return id
        },

        deleteWork: (id) => {
          const { works, activeWorkId } = get()
          const rest = { ...works }
          delete rest[id]
          set({ works: rest, activeWorkId: activeWorkId === id ? null : activeWorkId })
        },

        openWork: (id) => {
          const { works } = get()
          const w = works[id]
          if (w) set({ activeWorkId: id, step: w.status === 'done' ? 'editor' : 'input' })
        },

        closeWork: () => set({ activeWorkId: null }),

        listWorks: () => Object.values(get().works).sort((a, b) => b.updatedAt - a.updatedAt),

        setStep: (step) => set({ step }),
        setNovel: (novel) => mutateActive((w) => ({ ...w, novel })),
        setBibleDoc: (bibleDoc) => mutateActive((w) => ({ ...w, bibleDoc })),
        setBible: (bible) => mutateActive((w) => ({ ...w, bible })),
        setYaml: (currentYaml) => mutateActive((w) => ({ ...w, currentYaml })),
        setStatus: (status) => mutateActive((w) => ({ ...w, status })),
        updateSettings: (patch) =>
          mutateActive((w) => ({ ...w, settings: { ...w.settings, ...patch } })),

        setConvertProgress: (convert) => mutateActive((w) => ({ ...w, convert })),

        snapshot: ({ label, origin, valid }) =>
          mutateActive((w) => {
            const nextSeq = w.seq + 1
            const snap: Snapshot = {
              id: `snap_${nextSeq}`,
              label,
              origin,
              yaml: w.currentYaml,
              valid,
              createdAt: Date.now(),
            }
            return { ...w, seq: nextSeq, snapshots: capSnapshots([...w.snapshots, snap]) }
          }),

        rollback: (id) =>
          mutateActive((w) => {
            const target = w.snapshots.find((s) => s.id === id)
            if (!target) return w
            const nextSeq = w.seq + 1
            // 回滚前先把当前态存一份，防止丢未保存的编辑
            const guard: Snapshot = {
              id: `snap_${nextSeq}`,
              label: '回滚前自动保存',
              origin: 'edit',
              yaml: w.currentYaml,
              valid: false,
              createdAt: Date.now(),
            }
            return {
              ...w,
              seq: nextSeq,
              snapshots: capSnapshots([...w.snapshots, guard]),
              currentYaml: target.yaml,
            }
          }),
      }
    },
    {
      name: 'zhemu-library',
      storage: createJSONStorage(() => idbStorage),
      version: 1,
    },
  ),
)

/** 取当前活动作品（无则 null）。读当前作品字段统一用它。 */
export const useActiveWork = (): Work | null =>
  useLibraryStore((s) => (s.activeWorkId ? s.works[s.activeWorkId] ?? null : null))

/**
 * 等待 persist 的异步水合（IndexedDB）完成。
 * 用于 /studio 这类「直连即判断活动作品」的页面，避免水合前误判为无作品而错误跳转。
 */
export function useHasHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    if (useLibraryStore.persist.hasHydrated()) setHydrated(true)
    const unsub = useLibraryStore.persist.onFinishHydration(() => setHydrated(true))
    return unsub
  }, [])
  return hydrated
}

/** 超过上限时，优先丢弃最旧的 convert/regen 自动快照，尽量保留手动 edit。 */
function capSnapshots(list: Snapshot[]): Snapshot[] {
  if (list.length <= MAX_SNAPSHOTS) return list
  const overflow = list.length - MAX_SNAPSHOTS
  let dropped = 0
  const kept: Snapshot[] = []
  for (const s of list) {
    if (dropped < overflow && s.origin !== 'edit') {
      dropped++
      continue
    }
    kept.push(s)
  }
  return kept.length > MAX_SNAPSHOTS ? kept.slice(kept.length - MAX_SNAPSHOTS) : kept
}
