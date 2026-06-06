/**
 * 落地页共享原语：跑马灯 + 大写描边标签。从 page.tsx 拆出复用。
 */
import type { ReactNode } from 'react'

/** 横向无限滚动跑马灯。 */
export function Marquee({ items, className = '' }: { items: string[]; className?: string }) {
  const row = [...items, ...items]
  return (
    <div className={`flex overflow-hidden border-y-2 border-foreground ${className}`} aria-hidden>
      <div className="flex shrink-0 animate-marquee whitespace-nowrap">
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-4 px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.18em]">
            {t}
            <span className="text-primary">◆</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/** 大写描边小标签。 */
export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block border-2 border-foreground bg-background px-3 py-1 text-xs font-bold uppercase tracking-[0.16em]">
      {children}
    </span>
  )
}
