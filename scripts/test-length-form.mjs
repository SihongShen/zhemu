// 冒烟测试 ②体量：长片 / 短剧 / 剧集三档都能跑通 convert-chapter，且返回合法 unit。
// 先 `npm run dev`（需配置 LLM_API_KEY），再另开终端：
//   node scripts/test-length-form.mjs
// 用同一篇小说 + 同一份 bible，仅切换 settings.lengthForm，验证三档均合法并打印场景数对比。
const BASE = process.env.BASE ?? 'http://localhost:3000'

const NOVEL = `第一章 雨夜
林夏在旧书店值夜。门铃响，顾明推门进来，要找一本绝版书《潮汐手记》。
"你是林夏吧。"顾明轻声说。她点头，心里一紧——这本书，正是父亲失踪那天手里攥着的。
两人在书架间低声交谈，窗外暴雨倾盆。顾明说他在追查一桩旧案，而线索指向这家书店。`

const LENGTH_FORMS = ['feature', 'short', 'series']

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
  console.log('0) POST /api/extract-bible（三档共用同一份设定）...')
  const b = await post('/api/extract-bible', { novel: NOVEL })
  if (b.status !== 200) throw new Error(`extract-bible ${b.status}: ${JSON.stringify(b.json)}`)
  const bible = b.json.bible
  console.log('   ✅ characters:', bible.characters.map((c) => c.id).join(', '))

  const chapter = { index: 1, title: '第一章 雨夜', text: NOVEL }
  const results = []

  for (const lengthForm of LENGTH_FORMS) {
    console.log(`\n→ lengthForm = ${lengthForm}`)
    const settings = { lengthForm, adaptationMode: 'balanced', style: 'cn-standard' }
    const c = await post('/api/convert-chapter', { chapter, bible, runningSummary: '', settings })
    if (c.status !== 200) throw new Error(`convert-chapter[${lengthForm}] ${c.status}: ${JSON.stringify(c.json)}`)
    const unit = c.json.unit
    if (!unit || !Array.isArray(unit.scenes) || unit.scenes.length === 0) {
      throw new Error(`convert-chapter[${lengthForm}] 返回空 unit/scenes`)
    }
    const shotCount = unit.scenes.reduce(
      (n, s) => n + (s.elements?.filter((e) => e.type === 'shot').length ?? 0),
      0,
    )
    results.push({ lengthForm, scenes: unit.scenes.length, shots: shotCount })
    console.log(`   ✅ scenes=${unit.scenes.length}  shots=${shotCount}`)
  }

  console.log('\n📊 三档对比（仅供眼检，LLM 输出非确定性）：')
  for (const r of results) {
    console.log(`   ${r.lengthForm.padEnd(8)} scenes=${r.scenes}  shots=${r.shots}`)
  }
  console.log('\n🎉 体量三档全部跑通且返回合法 unit')
}

main().catch((e) => {
  console.error('❌', e.message)
  process.exit(1)
})
