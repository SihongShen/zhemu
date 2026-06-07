/**
 * 纯函数行级 diff（LCS），给「版本对比」用。零第三方依赖，可在客户端直接跑。
 * - diffLines：两份文本逐行比对，返回 same/add/del 序列（带原始行号）。
 * - collapseUnchanged：把长段「未改动」折叠成占位，只留改动附近的上下文，长文件也能一眼看出差异。
 * - diffStat：统计 +新增 / −删除 行数。
 */
export type DiffLine =
  | { type: 'same'; text: string; oldNo: number; newNo: number }
  | { type: 'add'; text: string; newNo: number }
  | { type: 'del'; text: string; oldNo: number }

export type DiffRow = DiffLine | { type: 'gap'; count: number }

/** 行级 LCS diff。空串视为 0 行，避免 ''.split('\n') 产生一行空行。 */
export function diffLines(oldText: string, newText: string): DiffLine[] {
  const a = oldText.length ? oldText.split('\n') : []
  const b = newText.length ? newText.split('\n') : []
  const n = a.length
  const m = b.length

  // dp[i][j] = a[i..] 与 b[j..] 的 LCS 长度（自底向上）
  const dp: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1))
  for (let i = n - 1; i >= 0; i--) {
    const row = dp[i]
    const next = dp[i + 1]
    for (let j = m - 1; j >= 0; j--) {
      row[j] = a[i] === b[j] ? next[j + 1] + 1 : Math.max(next[j], row[j + 1])
    }
  }

  const out: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ type: 'same', text: a[i], oldNo: i + 1, newNo: j + 1 })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: 'del', text: a[i], oldNo: i + 1 })
      i++
    } else {
      out.push({ type: 'add', text: b[j], newNo: j + 1 })
      j++
    }
  }
  while (i < n) {
    out.push({ type: 'del', text: a[i], oldNo: i + 1 })
    i++
  }
  while (j < m) {
    out.push({ type: 'add', text: b[j], newNo: j + 1 })
    j++
  }
  return out
}

/** +新增 / −删除 行数统计。 */
export function diffStat(lines: DiffLine[]): { add: number; del: number } {
  let add = 0
  let del = 0
  for (const l of lines) {
    if (l.type === 'add') add++
    else if (l.type === 'del') del++
  }
  return { add, del }
}

/**
 * 折叠长段未改动行：每段连续 same 若长于 2*context+1，只留首尾各 context 行，中间压成 gap。
 * 改动行（add/del）原样保留。
 */
export function collapseUnchanged(lines: DiffLine[], context = 3): DiffRow[] {
  const rows: DiffRow[] = []
  const n = lines.length
  let i = 0
  while (i < n) {
    if (lines[i].type !== 'same') {
      rows.push(lines[i])
      i++
      continue
    }
    let j = i
    while (j < n && lines[j].type === 'same') j++
    const runLen = j - i
    if (runLen <= context * 2 + 1) {
      for (let k = i; k < j; k++) rows.push(lines[k])
    } else {
      for (let k = i; k < i + context; k++) rows.push(lines[k])
      rows.push({ type: 'gap', count: runLen - context * 2 })
      for (let k = j - context; k < j; k++) rows.push(lines[k])
    }
    i = j
  }
  return rows
}
