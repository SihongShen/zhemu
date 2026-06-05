'use client'
/**
 * ① NovelInput(前端):粘贴/上传小说 + 自动分章预览(可选 bible 文档先行区)。
 *
 * @see docs/DEVELOPMENT_PLAN.md · Day 3
 */
import { useProjectStore } from '@/lib/store/project-store'

export function NovelInput() {
  const novel = useProjectStore((s) => s.novel)
  const setNovel = useProjectStore((s) => s.setNovel)

  // TODO(Day3): textarea + 上传 + 分章预览 + "下一步"
  return (
    <section data-step="input">
      <h2>① 输入小说</h2>
      <textarea value={novel} onChange={(e) => setNovel(e.target.value)} />
    </section>
  )
}
