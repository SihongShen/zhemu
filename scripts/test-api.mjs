// 测 Day3-A 的三个 HTTP 路由。先开一个终端 `npm run dev`，再另开一个终端跑：
//   node scripts/test-api.mjs
// 用一篇极短小说，串起 extract-bible → convert-chapter → update-summary，并验校验返回 400。
const BASE = process.env.BASE ?? 'http://localhost:3000'

const NOVEL = `第一章 雨夜
林夏在旧书店值夜。门铃响，顾明推门进来，要找一本绝版书《潮汐手记》。
"你是林夏吧。"顾明轻声说。她点头，心里一紧——这本书，正是父亲失踪那天手里攥着的。`

async function post(path, body) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, json }
}

async function main() {
  console.log('1) POST /api/extract-bible ...')
  const b = await post('/api/extract-bible', { novel: NOVEL })
  if (b.status !== 200) throw new Error(`extract-bible ${b.status}: ${JSON.stringify(b.json)}`)
  const bible = b.json.bible
  console.log('   ✅ characters:', bible.characters.map((c) => c.id).join(', '))

  const chapter = { index: 1, title: '第一章 雨夜', text: NOVEL }
  const settings = { lengthForm: 'feature', adaptationMode: 'balanced', style: 'cn-standard' }

  console.log('2) POST /api/convert-chapter ...')
  const c = await post('/api/convert-chapter', { chapter, bible, runningSummary: '', settings })
  if (c.status !== 200) throw new Error(`convert-chapter ${c.status}: ${JSON.stringify(c.json)}`)
  console.log('   ✅ scenes:', c.json.unit.scenes.length)

  console.log('3) POST /api/update-summary ...')
  const s = await post('/api/update-summary', { prevSummary: '', chapter })
  if (s.status !== 200) throw new Error(`update-summary ${s.status}: ${JSON.stringify(s.json)}`)
  console.log('   ✅ summary:', s.json.summary.slice(0, 50) + '…')

  console.log('4) 边界校验：空 body 应返回 400 ...')
  const bad = await post('/api/convert-chapter', {})
  console.log(`   status=${bad.status}`, bad.status === 400 ? '✅ 校验生效' : '⚠️ 期望 400')

  console.log('\n🎉 A 三个路由全通')
}

main().catch((e) => {
  console.error('❌', e.message)
  process.exit(1)
})
