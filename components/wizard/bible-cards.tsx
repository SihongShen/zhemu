'use client'
/**
 * 「确认设定」的展示/编辑卡片（从 bible-editor 拆出）：世界观 / 人物 / 大纲。
 * 纯展示 + 受控编辑，状态留在 BibleEditor。
 */
import type { Bible } from '@/lib/schema'
import { CARD, INPUT, TAG } from '@/components/brutal-ui'

const ROLE_CN: Record<string, string> = {
  protagonist: '主角',
  antagonist: '反派',
  supporting: '配角',
  minor: '次要',
}

export function WorldCard({
  world,
  onChange,
}: {
  world: Bible['world']
  onChange: (summary: string) => void
}) {
  return (
    <div className={`${CARD} space-y-3 p-5`}>
      <span className={TAG}>世界观</span>
      <textarea
        value={world.summary}
        onChange={(e) => onChange(e.target.value)}
        className={`h-20 resize-y ${INPUT}`}
      />
      {world.tone && <p className="text-xs text-muted-foreground">基调：{world.tone}</p>}
      {world.locations.length > 0 && (
        <p className="text-xs text-muted-foreground">主要地点：{world.locations.join('、')}</p>
      )}
    </div>
  )
}

export function CharacterCard({
  character,
  onPatch,
}: {
  character: Bible['characters'][number]
  onPatch: (key: 'name' | 'description', val: string) => void
}) {
  const c = character
  return (
    <div className="space-y-2 border-2 border-foreground bg-background p-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={c.name}
          onChange={(e) => onPatch('name', e.target.value)}
          className="border-2 border-foreground bg-card px-2 py-1 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
        />
        {c.role && (
          <span className="border-2 border-foreground bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
            {ROLE_CN[c.role] ?? c.role}
          </span>
        )}
        {c.aliases.length > 0 && (
          <span className="text-xs text-muted-foreground">又称 {c.aliases.join(' / ')}</span>
        )}
        <span className="ml-auto font-mono text-[11px] text-muted-foreground">{c.id}</span>
      </div>
      <textarea
        value={c.description ?? ''}
        onChange={(e) => onPatch('description', e.target.value)}
        className="h-14 w-full resize-y border-2 border-foreground bg-card p-2 text-xs leading-relaxed text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  )
}

export function OutlineCard({ outline }: { outline: Bible['outline'] }) {
  if (outline.length === 0) return null
  return (
    <div className={`${CARD} space-y-3 p-5`}>
      <span className={TAG}>大纲 · {outline.length}</span>
      <ol className="space-y-2 text-sm">
        {outline.map((b) => (
          <li key={b.id} className="flex gap-2 border-l-4 border-primary pl-3">
            <span className="font-bold">{b.title}</span>
            {b.summary && <span className="text-muted-foreground">— {b.summary}</span>}
          </li>
        ))}
      </ol>
    </div>
  )
}
