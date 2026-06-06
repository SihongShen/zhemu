'use client'
/**
 * 落地页顶栏：复用站点统一外壳（SiteHeaderShell）。右侧 = 锚点 + 「进入折幕」(→ /works)。
 */
import Link from 'next/link'
import { SiteHeaderShell, HEADER_PRIMARY } from '@/components/site-header'

export function LandingHeader() {
  return (
    <SiteHeaderShell
      right={
        <>
          <a
            href="#fold"
            className="hidden text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            怎么折
          </a>
          <Link href="/works" className={HEADER_PRIMARY}>
            进入折幕
          </Link>
        </>
      }
    />
  )
}
