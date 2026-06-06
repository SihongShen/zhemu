'use client'
/**
 * 我的作品（/works）：作品库。新建 / 打开都进入 /studio 向导。
 * UI 与主页统一：硬描边、硬投影、直角、Playfair 标题。
 */
import { useRouter } from 'next/navigation'
import { useLibraryStore, useHasHydrated, type WorkStatus } from '@/lib/store/project-store'

const STATUS: Record<WorkStatus, { t: string; cls: string }> = {
  draft: { t: '草稿', cls: 'border-foreground bg-muted text-muted-foreground' },
  bible_ready: { t: '设定就绪', cls: 'border-foreground bg-accent text-accent-foreground' },
  converting: { t: '生成中', cls: 'border-foreground bg-accent text-accent-foreground' },
  done: { t: '已完成', cls: 'border-primary bg-primary text-primary-foreground' },
  error: { t: '出错', cls: 'border-destructive bg-destructive text-destructive-foreground' },
}

export default function WorksPage() {
  const router = useRouter()
  const hydrated = useHasHydrated()
  const createWork = useLibraryStore((s) => s.createWork)
  const openWork = useLibraryStore((s) => s.openWork)
  const deleteWork = useLibraryStore((s) => s.deleteWork)
  const listWorks = useLibraryStore((s) => s.listWorks)

  const works = listWorks()

  const handleCreate = () => {
    createWork()
    router.push('/studio')
  }
  const handleOpen = (id: string) => {
    openWork(id)
    router.push('/studio')
  }

  return (
    <div className="px-4 py-12 sm:px-6">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b-2 border-foreground pb-6">
        <div>
          <h1 className="font-heading text-4xl font-black tracking-tight sm:text-5xl">我的作品</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {works.length ? `共 ${works.length} 部 · 一折一幕，把小说折成剧本` : '从一篇小说开始吧'}
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="border-2 border-foreground bg-foreground px-6 py-3 font-bold text-background shadow-brutal transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0"
        >
          + 上传作品
        </button>
      </div>

      {!hydrated ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse border-2 border-border bg-muted" />
          ))}
        </div>
      ) : works.length === 0 ? (
        <div className="border-2 border-dashed border-foreground bg-card px-6 py-20 text-center">
          <p className="font-heading text-2xl font-bold">空舞台</p>
          <p className="mt-2 text-sm text-muted-foreground">点右上角「上传作品」，丢进第一篇小说。</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {works.map((w) => (
            <li
              key={w.id}
              className="group relative border-2 border-foreground bg-card shadow-brutal transition-transform duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-lg"
            >
              <button onClick={() => handleOpen(w.id)} className="block w-full px-5 py-5 text-left">
                <span
                  className={`inline-block border-2 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${STATUS[w.status].cls}`}
                >
                  {STATUS[w.status].t}
                </span>
                <span className="mt-3 block truncate text-lg font-bold">{w.title}</span>
                <span className="mt-1 block text-xs text-muted-foreground">点击进入向导 →</span>
              </button>
              <button
                onClick={() => {
                  if (confirm(`删除「${w.title}」？此操作不可撤销。`)) deleteWork(w.id)
                }}
                className="absolute right-3 top-3 border-2 border-transparent px-2 py-0.5 text-xs font-bold text-muted-foreground opacity-0 transition hover:border-destructive hover:text-destructive group-hover:opacity-100"
              >
                删除
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
