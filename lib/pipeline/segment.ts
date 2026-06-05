/**
 * 分章 / 分场（workflow step）。有显式章节按章切，无章节按长度切。
 *
 * @see docs/DAY1_PLAN.md · §2
 */

export interface Chapter {
  index: number // 1-based，用于 unit_ch<章号>
  title?: string
  text: string
}

// 匹配「第X章/回/节 + 可选标题」整行，X 支持阿拉伯与中文数字
const CHAPTER_RE = /^[ \t]*第\s*[0-9零一二三四五六七八九十百千两]+\s*[章回节][^\n]*$/gm

const FALLBACK_CHUNK = 3500 // 无章节时按约 3500 字切

export function segment(novel: string): Chapter[] {
  const text = novel.replace(/\r\n/g, '\n').trim()
  if (!text) return []

  // 1) 找所有章节标题位置
  const heads: { title: string; start: number }[] = []
  for (const m of Array.from(text.matchAll(CHAPTER_RE))) {
    heads.push({ title: m[0].trim(), start: m.index ?? 0 })
  }

  // 2) 有章节 → 按标题切
  if (heads.length > 0) {
    const chapters: Chapter[] = []
    // 标题前若有正文（楔子等），并入第 1 章之前可忽略；这里从首个标题起算
    for (let i = 0; i < heads.length; i++) {
      const start = heads[i].start
      const end = i + 1 < heads.length ? heads[i + 1].start : text.length
      const body = text.slice(start, end).trim()
      chapters.push({ index: i + 1, title: heads[i].title, text: body })
    }
    return chapters
  }

  // 3) 无章节 → 按长度切成伪章节
  const chunks: Chapter[] = []
  for (let i = 0, idx = 1; i < text.length; i += FALLBACK_CHUNK, idx++) {
    chunks.push({ index: idx, text: text.slice(i, i + FALLBACK_CHUNK).trim() })
  }
  return chunks
}
