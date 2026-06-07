/**
 * 上传文件 → 小说正文。支持**多文件**（按文件名自然排序后拼接，如 第1章 → 第2章 …）。
 * .txt / .md → 直接读文本；.docx → 动态 import mammoth 抽纯文本。
 * 老式 .doc（二进制）与 PDF 不支持。
 */
export async function readNovelFiles(files: FileList | File[]): Promise<string> {
  const arr = Array.from(files).sort((a, b) =>
    a.name.localeCompare(b.name, 'zh-Hans-CN', { numeric: true }),
  )
  const parts: string[] = []
  for (const f of arr) parts.push(await readOne(f))
  return parts.filter(Boolean).join('\n\n')
}

async function readOne(file: File): Promise<string> {
  const name = file.name.toLowerCase()

  if (name.endsWith('.docx')) {
    const mod = await import('mammoth')
    const m = mod as unknown as {
      extractRawText?: (o: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>
      default?: { extractRawText: (o: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }> }
    }
    const fn = m.extractRawText ?? m.default?.extractRawText
    if (!fn) throw new Error('docx 解析器加载失败')
    const { value } = await fn({ arrayBuffer: await file.arrayBuffer() })
    return value.trim()
  }

  if (name.endsWith('.doc')) {
    throw new Error('暂不支持老式 .doc，请另存为 .docx 或 .txt 再上传')
  }

  // .txt / .md / 其它纯文本
  return (await file.text()).trim()
}
