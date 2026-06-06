'use client'
/**
 * ScriptPreview（前端）：把当前 Screenplay 按所选 ①制式 渲染成文本预览。
 * 制式切换 = 换 renderer 重渲染，即时、纯前端——招牌瞬间。
 *
 * @see docs/DAY3_PLAN.md · §2.B
 */
import { useMemo } from 'react'
import type { Screenplay } from '@/lib/schema'
import type { Style } from '@/lib/store/project-store'
import { renderCnStandard } from '@/lib/render/cn-standard'
import { renderHollywood } from '@/lib/render/hollywood'

export function ScriptPreview({ screenplay, style }: { screenplay: Screenplay; style: Style }) {
  const text = useMemo(
    () => (style === 'hollywood' ? renderHollywood(screenplay) : renderCnStandard(screenplay)),
    [screenplay, style],
  )
  return (
    <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded border bg-muted/30 p-4 font-mono text-sm leading-relaxed">
      {text}
    </pre>
  )
}
