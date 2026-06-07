// 用当前代码对《雾港》全本跑三档体量的完整链路（extractBible → 逐章 convert+摘要 → assemble → 校验 → 渲染），
// 打印三档校验对比，并用 feature 那份刷新 app/api/smoke-convert/demo-screenplay.json。
// 需先 `npm run dev`（.env.local 配好 LLM_API_KEY），再：node scripts/refresh-demo.mjs
import fs from 'node:fs'

const BASE = process.env.BASE ?? 'http://localhost:3000'
// feature 复用 smoke-convert 的 mock；short/series 单独存到 lib/_dev。
const OUT = {
  feature: 'app/api/smoke-convert/demo-screenplay.json',
  short: 'lib/_dev/wugang-short.json',
  series: 'lib/_dev/wugang-series.json',
}
const LENGTHS = ['feature', 'short', 'series']

function shotsOf(sp) {
  let shots = 0
  let dialogues = 0
  for (const u of sp.script) for (const s of u.scenes) for (const el of s.elements) {
    if (el.type === 'shot') shots++
    else if (el.type === 'dialogue') dialogues++
  }
  return { shots, dialogues }
}

async function runOne(length) {
  const res = await fetch(`${BASE}/api/smoke-convert?length=${length}`)
  const json = await res.json()
  if (!res.ok || !json.ok) {
    throw new Error(`[${length}] ${res.status}: ${JSON.stringify(json).slice(0, 300)}`)
  }
  const c = json.checks
  const { shots, dialogues } = shotsOf(json.screenplay)
  return {
    length,
    screenplay: json.screenplay,
    row: {
      章: c.chapterCount,
      场景: c.sceneCount,
      shot: shots,
      对白: dialogues,
      人物: c.characterCount,
      引用完整: c.refIntegrity,
      回填: c.backfilled.length,
      待核: c.flaggedScenes.length,
    },
  }
}

async function main() {
  const results = []
  for (const length of LENGTHS) {
    console.log(`\n→ 跑 ${length} 全链路…（extractBible + 5 章 convert/摘要 + assemble）`)
    const t0 = process.hrtime.bigint()
    const r = await runOne(length)
    const sec = Number(process.hrtime.bigint() - t0) / 1e9
    results.push(r)
    console.log(`   ✅ ${length} 用时 ${sec.toFixed(1)}s ·`, JSON.stringify(r.row))
  }

  console.log('\n📊 三档全链路对比（雾港全本）：')
  console.table(Object.fromEntries(results.map((r) => [r.length, r.row])))

  // 引用完整性硬校验：任一档悬空引用都算链路有问题
  const broken = results.filter((r) => !r.row.引用完整)
  if (broken.length) {
    throw new Error(`引用完整性失败：${broken.map((b) => b.length).join(', ')}`)
  }

  // 三档各写一份 fixture
  for (const r of results) {
    fs.writeFileSync(OUT[r.length], JSON.stringify(r.screenplay, null, 2) + '\n', 'utf8')
    console.log(`💾 ${r.length} → ${OUT[r.length]}`)
  }
  console.log('🎉 三档全链路均通过，引用完整，fixture 已刷新')
}

main().catch((e) => {
  console.error('\n❌', e.message)
  process.exit(1)
})
