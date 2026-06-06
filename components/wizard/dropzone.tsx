'use client'
/**
 * 拖拽上传区。默认是拖拽/点击上传，而非输入框；上传后可展开查看，或切到粘贴/编辑。
 * 支持多文件（.txt/.md/.docx，按文件名顺序拼接，docx 用 mammoth 解析）。
 * 视觉：野兽派硬描边 + 直角，与主页统一。
 *
 * @see docs/DAY3_PLAN.md · §2.C
 */
import { useRef, useState } from 'react'
import { readNovelFiles } from '@/lib/parse-upload'
import { INPUT } from '@/components/brutal-ui'

function UploadGlyph() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
    >
      <path d="M12 16V4" />
      <path d="M7 9l5-5 5 5" />
      <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
    </svg>
  )
}

export function Dropzone({
  label,
  value,
  onChange,
  optional,
  hint,
  accept = '.txt,.md,.docx',
}: {
  label: string
  value: string
  onChange: (text: string) => void
  optional?: boolean
  hint?: string
  accept?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return
    setError('')
    setBusy(true)
    try {
      onChange(await readNovelFiles(files))
      setEditing(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.08em]">
          <span className="inline-block h-3 w-3 border-2 border-foreground bg-primary" aria-hidden />
          {label}
          {optional && <span className="text-xs font-normal normal-case tracking-normal text-muted-foreground">（可选）</span>}
        </span>
        <div className="flex items-center gap-3 text-xs font-bold">
          {value && <span className="text-muted-foreground">约 {value.trim().length} 字</span>}
          {editing ? (
            <button onClick={() => setEditing(false)} className="text-primary hover:underline">
              完成
            </button>
          ) : value ? (
            <button onClick={() => setEditing(true)} className="hover:underline">
              编辑
            </button>
          ) : (
            <button onClick={() => setEditing(true)} className="hover:underline">
              粘贴文本
            </button>
          )}
          {value && (
            <button onClick={() => onChange('')} className="text-muted-foreground hover:text-destructive">
              清除
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <textarea
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="直接粘贴文本…"
          className={`h-48 resize-y ${INPUT}`}
        />
      ) : value ? (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="block max-h-40 w-full cursor-text overflow-auto whitespace-pre-wrap border-2 border-foreground bg-card p-4 text-left text-sm leading-relaxed text-muted-foreground shadow-brutal focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {value.slice(0, 400)}
          {value.length > 400 ? ' …' : ''}
        </button>
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-label={`上传${label}`}
          onDragOver={(e) => {
            e.preventDefault()
            setOver(true)
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setOver(false)
            void handleFiles(e.dataTransfer.files)
          }}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          data-over={over}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed border-foreground bg-card px-6 py-14 text-center transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary data-[over=true]:border-solid data-[over=true]:border-primary data-[over=true]:bg-primary/15"
        >
          <span className="text-foreground">
            <UploadGlyph />
          </span>
          <span className="text-sm font-bold">{busy ? '解析中…' : '拖拽文件到这里，或点击选择'}</span>
          <span className="text-xs text-muted-foreground">{hint ?? '支持 .txt / .md / .docx，可多选'}</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />
      {error && <p className="text-xs font-bold text-destructive">{error}</p>}
    </div>
  )
}
