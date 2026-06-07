// lib/diff.ts 的离线单元测试（纯函数，不打网络、不耗 API）。
// Node 23.6+ 默认擦除 TS 类型，直接跑：
//   node scripts/test-diff.mts
import { diffLines, collapseUnchanged, diffStat, type DiffRow } from '../lib/diff.ts'

let passed = 0
let failed = 0
function check(name: string, cond: boolean, extra?: unknown) {
  if (cond) {
    passed++
    console.log(`  ✅ ${name}`)
  } else {
    failed++
    console.log(`  ❌ ${name}`, extra !== undefined ? JSON.stringify(extra) : '')
  }
}

console.log('1) 完全相同 → 全 same，无增删')
{
  const d = diffLines('a\nb\nc', 'a\nb\nc')
  const st = diffStat(d)
  check('全部 same', d.every((l) => l.type === 'same'))
  check('stat = 0/0', st.add === 0 && st.del === 0, st)
}

console.log('2) 改一行 → 该行 del + add，其余 same')
{
  const d = diffLines('a\nb\nc', 'a\nB\nc')
  const st = diffStat(d)
  check('stat = +1/−1', st.add === 1 && st.del === 1, st)
  const sames = d.filter((l) => l.type === 'same').map((l) => l.text)
  check('保留的同行是 a、c', sames.join(',') === 'a,c', sames)
  check('有 del b', d.some((l) => l.type === 'del' && l.text === 'b'))
  check('有 add B', d.some((l) => l.type === 'add' && l.text === 'B'))
}

console.log('3) 行号正确（新增行只有 newNo，删除行只有 oldNo）')
{
  const d = diffLines('x', 'x\ny')
  const add = d.find((l) => l.type === 'add')
  check('add 行 newNo = 2', add?.type === 'add' && add.newNo === 2, add)
  const same = d.find((l) => l.type === 'same')
  check('same 行 oldNo=1 newNo=1', same?.type === 'same' && same.oldNo === 1 && same.newNo === 1, same)
}

console.log('4) 空串边界（不应产生幽灵空行）')
{
  const allAdd = diffLines('', 'x\ny')
  check('空旧 → 全 add，且只有 2 行', allAdd.length === 2 && allAdd.every((l) => l.type === 'add'), allAdd)
  const allDel = diffLines('x\ny', '')
  check('空新 → 全 del，且只有 2 行', allDel.length === 2 && allDel.every((l) => l.type === 'del'), allDel)
  const both = diffLines('', '')
  check('双空 → 无任何行', both.length === 0, both)
}

console.log('5) collapseUnchanged 折叠长段未改动')
{
  // L1..L20，仅 L10 改成 L10x：前 9 行同、后 10 行同
  const old = Array.from({ length: 20 }, (_, i) => `L${i + 1}`).join('\n')
  const next = old.replace('L10', 'L10x')
  const rows = collapseUnchanged(diffLines(old, next), 3)
  const gaps = rows.filter((r): r is Extract<DiffRow, { type: 'gap' }> => r.type === 'gap')
  check('出现 2 个 gap（首段9行、尾段10行各被折叠）', gaps.length === 2, gaps.map((g) => g.count))
  check('首段 gap = 9−2*3 = 3', gaps[0]?.count === 3, gaps[0])
  check('尾段 gap = 10−2*3 = 4', gaps[1]?.count === 4, gaps[1])
  // 改动行与上下文仍在
  check('保留 del L10', rows.some((r) => r.type === 'del' && r.text === 'L10'))
  check('保留 add L10x', rows.some((r) => r.type === 'add' && r.text === 'L10x'))
}

console.log('6) 短未改动段不折叠（≤ 2*context+1 全留）')
{
  const old = 'a\nb\nc\nd\ne\nf\ng' // 改 a、g，中间 5 行未改 ≤ 7 → 不折叠
  const next = 'A\nb\nc\nd\ne\nf\nG'
  const rows = collapseUnchanged(diffLines(old, next), 3)
  check('无 gap', !rows.some((r) => r.type === 'gap'), rows.filter((r) => r.type === 'gap'))
}

console.log(`\n${failed === 0 ? '🎉' : '⚠️'} diff 单测：${passed} 通过 / ${failed} 失败`)
process.exit(failed === 0 ? 0 : 1)
