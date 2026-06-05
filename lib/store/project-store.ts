/**
 * 客户端会话态(前端)。四步向导共享状态 + 版本管理快照。
 * persist → localStorage:刷新可留,清缓存即失。不入库、不跨设备(留 v1)。
 *
 * @see docs/DEVELOPMENT_PLAN.md · 版本管理(最小落地)
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SnapshotOrigin = 'convert' | 'edit' | 'regen'

export interface Snapshot {
  id: string // snap_<序号>
  label: string // 自动生成或手动命名
  origin: SnapshotOrigin
  yaml: string // 该时刻完整 YAML 文本(快照真源)
  valid: boolean // 打快照时 Zod 是否通过 → 列表红/绿点
  createdAt: number
}

export type WizardStep = 'input' | 'bible' | 'conversion' | 'editor'

const MAX_SNAPSHOTS = 20

interface ProjectState {
  step: WizardStep
  novel: string
  currentYaml: string
  snapshots: Snapshot[]
  seq: number // 单调递增的快照编号源:只增不减,即便 capSnapshots 删过也不复用 id

  setStep: (s: WizardStep) => void
  setNovel: (n: string) => void
  setYaml: (y: string) => void

  /** 打一个快照(转换完成 / 手动存 / 单章重生时调用)。 */
  snapshot: (args: { label: string; origin: SnapshotOrigin; valid: boolean }) => void
  /** 回滚:先把当前态自动存一份防丢,再把 currentYaml 换成目标快照。 */
  rollback: (id: string) => void
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      step: 'input',
      novel: '',
      currentYaml: '',
      snapshots: [],
      seq: 0,

      setStep: (step) => set({ step }),
      setNovel: (novel) => set({ novel }),
      setYaml: (currentYaml) => set({ currentYaml }),

      snapshot: ({ label, origin, valid }) => {
        const { snapshots, currentYaml, seq } = get()
        const nextSeq = seq + 1
        const snap: Snapshot = {
          id: `snap_${nextSeq}`,
          label,
          origin,
          yaml: currentYaml,
          valid,
          createdAt: Date.now(),
        }
        // 上限保护:超出丢弃最旧的自动快照(保留手动命名的 edit)
        set({ snapshots: capSnapshots([...snapshots, snap]), seq: nextSeq })
      },

      rollback: (id) => {
        const { snapshots, currentYaml, seq } = get()
        const target = snapshots.find((s) => s.id === id)
        if (!target) return
        const nextSeq = seq + 1
        // 回滚前先把当前态存一份,防止用户丢未保存的编辑
        const guard: Snapshot = {
          id: `snap_${nextSeq}`,
          label: '回滚前自动保存',
          origin: 'edit',
          yaml: currentYaml,
          valid: false, // 未知,按未校验处理
          createdAt: Date.now(),
        }
        set({
          snapshots: capSnapshots([...snapshots, guard]),
          currentYaml: target.yaml,
          seq: nextSeq,
        })
      },
    }),
    { name: 'zhemu-project' },
  ),
)

/** 超过上限时,优先丢弃最旧的 convert/regen 自动快照,尽量保留 edit。 */
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
  // 若自动快照不够丢,退而丢最旧的
  return kept.length > MAX_SNAPSHOTS ? kept.slice(kept.length - MAX_SNAPSHOTS) : kept
}
