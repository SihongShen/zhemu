'use client'
/**
 * 应用区顶栏：与主页同一套外壳（SiteHeaderShell），按当前路由切换右侧动作。
 * - /works  我的作品：右侧「首页」+「+ 上传作品」（新建并进入向导）
 * - /studio 上传作品：右侧 作品名 +「← 我的作品」
 */
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { SiteHeaderShell, HEADER_PRIMARY, HEADER_GHOST } from '@/components/site-header'
import { useLibraryStore, useActiveWork } from '@/lib/store/project-store'

export function AppHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const activeWork = useActiveWork()
  const createWork = useLibraryStore((s) => s.createWork)

  const onStudio = pathname?.startsWith('/studio')

  const newWork = () => {
    createWork()
    router.push('/studio')
  }

  return (
    <SiteHeaderShell
      right={
        onStudio ? (
          <>
            {activeWork && (
              <span className="hidden max-w-[14rem] truncate text-sm text-muted-foreground sm:inline">
                {activeWork.title}
              </span>
            )}
            <Link href="/works" className={HEADER_GHOST}>
              ← 我的作品
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/"
              className="hidden text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              首页
            </Link>
            <button onClick={newWork} className={HEADER_PRIMARY}>
              + 上传作品
            </button>
          </>
        )
      }
    />
  )
}
