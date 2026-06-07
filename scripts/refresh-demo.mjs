// 用当前代码对《雾港》全本跑两个维度的完整链路（extractBible → 逐章 convert+摘要 → assemble → 校验 → 渲染），
// 打印校验对比，并把结果写成 demo fixture。
//   体量（均 balanced 改编）：电影 / 短剧 / 剧集
//   改编（均 feature 体量，以电影为基准）：忠实 / 自由（平衡 = 电影，复用同一份，不重复生成）
// 共 5 份 fixture。需先 `npm run dev`（.env.local 配好 LLM_API_KEY），再：node scripts/refresh-demo.mjs
import fs from 'node:fs'

const BASE = process.env.BASE ?? 'http://localhost:3000'

// 「自由」示例的改编要求。⚠️ 必须与 lib/_dev/demo-work.ts 的 FREE_DEMO_BRIEF 完全一致。
const FREE_DEMO_BRIEF =
  '把背景从旧港口搬到近未来赛博都市：雾是数据烟尘、码头变数据港、纸质账本变成被篡改的链上记录；人物关系与寻亲悬疑主线保留不变。'

// 每个 job = 一次全链路 → 一份 fixture
const JOBS = [
  { name: '电影/平衡基准', length: 'feature', mode: 'balanced', out: 'app/api/smoke-convert/demo-screenplay.json' },
  { name: '短剧', length: 'short', mode: 'balanced', out: 'lib/_dev/wugang-short.json' },
  { name: '剧集', length: 'series', mode: 'balanced', out: 'lib/_dev/wugang-series.json' },
  { name: '忠实改编', length: 'feature', mode: 'faithful', out: 'lib/_dev/wugang-faithful.json' },
  { name: '自由改编(赛博)', length: 'feature', mode: 'free', brief: FREE_DEMO_BRIEF, out: 'lib/_dev/wugang-free.json' },
]

function shotsOf(sp) {
  let shots = 0
  let dialogues = 0
  for (const u of sp.script) for (const s of u.scenes) for (const el of s.elements) {
    if (el.type === 'shot') shots++
    else if (el.type === 'dialogue') dialogues++
  }
  return { shots, dialogues }
}

async function runOne(job) {
  const briefQs = job.brief ? `&brief=${encodeURIComponent(job.brief)}` : ''
  const res = await fetch(`${BASE}/api/smoke-convert?length=${job.length}&mode=${job.mode}${briefQs}`)
  const json = await res.json()
  if (!res.ok || !json.ok) {
    throw new Error(`[${job.name}] ${res.status}: ${JSON.stringify(json).slice(0, 300)}`)
  }
  const c = json.checks
  const { shots, dialogues } = shotsOf(json.screenplay)
  return {
    job,
    screenplay: json.screenplay,
    row: {
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
  for (const job of JOBS) {
    console.log(`\n→ 跑 ${job.name}（length=${job.length} mode=${job.mode}）全链路…`)
    const t0 = process.hrtime.bigint()
    const r = await runOne(job)
    const sec = Number(process.hrtime.bigint() - t0) / 1e9
    results.push(r)
    console.log(`   ✅ ${job.name} 用时 ${sec.toFixed(1)}s ·`, JSON.stringify(r.row))
  }

  console.log('\n📊 全链路对比（雾港全本）：')
  console.table(Object.fromEntries(results.map((r) => [r.job.name, r.row])))

  // 引用完整性硬校验：任一档悬空引用都算链路有问题
  const broken = results.filter((r) => !r.row.引用完整)
  if (broken.length) {
    throw new Error(`引用完整性失败：${broken.map((b) => b.job.name).join(', ')}`)
  }

  for (const r of results) {
    fs.writeFileSync(r.job.out, JSON.stringify(r.screenplay, null, 2) + '\n', 'utf8')
    console.log(`💾 ${r.job.name} → ${r.job.out}`)
  }
  console.log('🎉 全部全链路均通过，引用完整，fixture 已刷新')
}

main().catch((e) => {
  console.error('\n❌', e.message)
  process.exit(1)
})
