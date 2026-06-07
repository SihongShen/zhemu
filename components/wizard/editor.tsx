'use client'
/**
 * ④ 编辑与导出：CodeMirror 改 YAML + 实时 Zod 校验 + ①制式即时切换预览 + 导出 + 版本面板。
 */
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useLibraryStore, useActiveWork, type Style } from '@/lib/store/project-store'
import { yamlToScreenplay } from '@/lib/serialize'
import { renderCnStandard } from '@/lib/render/cn-standard'
import { renderHollywood } from '@/lib/render/hollywood'
import type { Screenplay } from '@/lib/schema'
import { ScriptPreview } from './script-preview'
import { VersionPanel } from './version-panel'
import { EditorToolbar } from './editor-toolbar'

const YamlEditor = dynamic(() => import('./yaml-editor'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">加载编辑器…</div>
  ),
})

type Parsed = { ok: true; screenplay: Screenplay } | { ok: false; error: string }

function renderFor(s: Screenplay, style: Style) {
  return style === 'hollywood' ? renderHollywood(s) : renderCnStandard(s)
}

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function Editor() {
  const work = useActiveWork()
  const setYaml = useLibraryStore((s) => s.setYaml)
  const updateSettings = useLibraryStore((s) => s.updateSettings)
  const [parsed, setParsed] = useState<Parsed>({ ok: false, error: '' })

  const currentYaml = work?.currentYaml ?? ''
  const style: Style = work?.settings.style ?? 'cn-standard'

  // 防抖：改完 ~400ms 再解析 + Zod 校验
  useEffect(() => {
    const t = setTimeout(() => {
      if (!currentYaml.trim()) return setParsed({ ok: false, error: '（空）' })
      try {
        setParsed({ ok: true, screenplay: yamlToScreenplay(currentYaml) })
      } catch (e) {
        setParsed({ ok: false, error: e instanceof Error ? e.message : String(e) })
      }
    }, 400)
    return () => clearTimeout(t)
  }, [currentYaml])

  if (!work) return null
  const title = work.title

  return (
    <section className="space-y-4">
      <EditorToolbar
        valid={parsed.ok}
        empty={!parsed.ok && parsed.error === '（空）'}
        style={style}
        onStyle={(s) => updateSettings({ style: s })}
        onExportYaml={() => download(`${title}.yaml`, currentYaml)}
        onExportText={() => parsed.ok && download(`${title}-${style}.txt`, renderFor(parsed.screenplay, style))}
      />

      {/* 编辑 | 预览 | 版本 */}
      <div className="flex flex-col gap-4 xl:flex-row">
        <div className="grid flex-1 gap-4 lg:grid-cols-2">
          <div className="overflow-hidden border-2 border-foreground bg-card shadow-brutal">
            <YamlEditor value={currentYaml} onChange={setYaml} />
          </div>
          <div>
            {parsed.ok ? (
              <ScriptPreview screenplay={parsed.screenplay} style={style} />
            ) : (
              <div className="flex h-full items-center justify-center whitespace-pre-line border-2 border-foreground bg-muted/40 p-4 text-center text-sm text-muted-foreground shadow-brutal">
                {parsed.error === '（空）' ? '还没有内容' : `YAML 有误，无法渲染预览：\n${parsed.error}`}
              </div>
            )}
          </div>
        </div>
        <VersionPanel valid={parsed.ok} />
      </div>
    </section>
  )
}
