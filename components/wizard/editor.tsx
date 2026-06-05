'use client'
/**
 * ④ Editor(前端):CodeMirror YAML 编辑 + 实时 Zod 校验(红波浪线)
 * + 版本快照/回滚(VersionPanel)+ 下载。
 *
 * @see docs/DEVELOPMENT_PLAN.md · Day 3 / 版本管理
 */
import { useProjectStore } from '@/lib/store/project-store'
import { VersionPanel } from '@/components/wizard/version-panel'

export function Editor() {
  const yaml = useProjectStore((s) => s.currentYaml)
  const setYaml = useProjectStore((s) => s.setYaml)
  void yaml
  void setYaml

  // TODO(Day3): CodeMirror(yaml) + 实时 schema 校验 + 下载按钮
  return (
    <section data-step="editor" className="flex gap-4">
      <div className="flex-1">
        <h2>④ 编辑 YAML</h2>
        {/* CodeMirror */}
      </div>
      <VersionPanel />
    </section>
  )
}
