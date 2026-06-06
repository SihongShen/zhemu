/**
 * 站点统一顶栏外壳：与主页同一套野兽派语汇（sticky / 硬底边 / 毛玻璃 / Playfair 品牌）。
 * 品牌恒定指向首页；右侧动作由各区域注入。落地页与应用区共用，保证风格一致。
 */
import Link from 'next/link'
import type { ReactNode } from 'react'

export function SiteHeaderShell({ right }: { right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-foreground bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-8">
        <Link href="/" className="flex items-baseline gap-2.5">
          <span className="font-heading text-2xl font-black tracking-tight">折幕</span>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Zhémù</span>
        </Link>
        <nav className="flex items-center gap-3 sm:gap-5">{right}</nav>
      </div>
    </header>
  )
}

/** 主按钮（墨块 + 硬投影） */
export const HEADER_PRIMARY =
  'border-2 border-foreground bg-foreground px-5 py-2 text-sm font-bold text-background shadow-brutal transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0'

/** 次按钮（描边） */
export const HEADER_GHOST =
  'border-2 border-foreground bg-background px-5 py-2 text-sm font-bold shadow-brutal transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0'
