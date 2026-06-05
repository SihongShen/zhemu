'use client'
/**
 * ① NovelInput（前端）：粘贴/上传小说 + 自动分章预览 + 【转换设置】。
 * 转换设置 = ②体量 + ④改编自由度（都烤进数据，转换前定）+ ①默认制式（可后改）。
 *
 * @see docs/DEVELOPMENT_PLAN.md · Day 3 · 四个维度
 */
import { useLibraryStore, useActiveWork } from '@/lib/store/project-store'

export function NovelInput() {
  const work = useActiveWork()
  const setNovel = useLibraryStore((s) => s.setNovel)
  const updateSettings = useLibraryStore((s) => s.updateSettings)
  if (!work) return null
  const { settings } = work

  // TODO(Day3): 上传 + 分章预览 + "下一步"
  return (
    <section data-step="input" className="space-y-6">
      <div>
        <h2 className="mb-2 font-semibold">输入小说</h2>
        <textarea
          className="h-48 w-full rounded border p-2"
          value={work.novel}
          onChange={(e) => setNovel(e.target.value)}
          placeholder="粘贴小说正文（3+ 章）…"
        />
      </div>

      {/* 转换设置：②④ 烤进数据，①默认。真做的可选，未做的灰置标 v2 */}
      <fieldset className="space-y-3 rounded border p-3">
        <legend className="px-1 text-sm font-semibold">转换设置</legend>

        <label className="flex items-center gap-2 text-sm">
          ② 体量
          <select
            value={settings.lengthForm}
            onChange={(e) => updateSettings({ lengthForm: e.target.value as never })}
          >
            <option value="feature">电影 / 标准长片</option>
            <option value="short" disabled>
              短剧（v2）
            </option>
            <option value="series" disabled>
              电视剧（v2）
            </option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm">
          ④ 改编自由度
          <select
            value={settings.adaptationMode}
            onChange={(e) => updateSettings({ adaptationMode: e.target.value as never })}
          >
            <option value="faithful">忠实原作</option>
            <option value="balanced">平衡</option>
            <option value="free">自由改编</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm">
          ① 默认制式
          <select
            value={settings.style}
            onChange={(e) => updateSettings({ style: e.target.value as never })}
          >
            <option value="cn-standard">中式</option>
            <option value="hollywood">好莱坞</option>
          </select>
        </label>
      </fieldset>
    </section>
  )
}
