'use client'
/**
 * 生成进度 / 错误态。逐章进度条（野兽派粗框 + 主色填充）。
 */
import { BTN_GHOST } from '@/components/brutal-ui'

export function ConversionProgress({
  phase,
  done,
  total,
  error,
  onRetry,
  onBack,
}: {
  phase: 'running' | 'error'
  done: number
  total: number
  error: string
  onRetry: () => void
  onBack: () => void
}) {
  const pct = total ? Math.round((done / total) * 100) : 0

  return (
    <section className="space-y-5 py-8">
      {phase === 'error' ? (
        <div className="space-y-4">
          <p className="border-2 border-destructive bg-destructive/10 px-4 py-2 text-sm font-bold text-destructive">
            生成中断：{error}
          </p>
          <div className="flex gap-3">
            <button onClick={onRetry} className={BTN_GHOST}>
              重试
            </button>
            <button onClick={onBack} className={BTN_GHOST}>
              ← 改设置
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-sm font-bold">
              <span>{total ? `正在生成 第 ${Math.min(done + 1, total)} / ${total} 章…` : '正在分章…'}</span>
              <span className="font-mono text-muted-foreground">{pct}%</span>
            </div>
            <div className="h-4 w-full overflow-hidden border-2 border-foreground bg-background">
              <div className="h-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            逐章生成，并用滚动摘要保持跨章连贯。整本较长时需要几分钟，请保持页面打开。
          </p>
        </>
      )}
    </section>
  )
}
