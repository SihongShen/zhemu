/**
 * 抽取的冒烟 / 演示端点：浏览器直接看「小说(+可选设定文档) → 合法 Bible」的效果。
 * 内置三个案例，逐个自检并返回 bible。
 *
 * - **本地 dev**：实时调用 LLM 真抽取（未配 LLM_API_KEY 返回 500，无副作用）。
 * - **线上 production**：返回预生成的静态结果（sample-result.json），**不触发付费 LLM**，
 *   避免这个无鉴权公开端点被反复请求刷爆额度。
 *
 * 跑法：
 *   - 全部案例： /api/smoke
 *   - 单个案例： /api/smoke?case=with-bible-doc   （省时省钱）
 *
 * @see docs/DAY1_PLAN.md · §3
 */
import { NextResponse } from 'next/server'
import { Bible } from '@/lib/schema'
import { extractBible } from '@/lib/pipeline/extract-bible'
import { segment } from '@/lib/pipeline/segment'
import sampleResult from './sample-result.json'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 本地 dev 无限制；多案例较慢，线上用 ?case= 单跑

interface SmokeCase {
  name: string
  desc: string
  novel: string
  bibleDoc?: string
  /** 软校验：这些名字应出现在某个角色的 name/aliases 里（验证 grounding 生效）。 */
  expectCharacters?: string[]
}

// 案例 A：只有小说原文 + 有章节 → 纯反推
const NOVEL_A = `第一章 雨夜来客
林夏在城郊的旧书店里值最后一班夜。雨敲着玻璃，店里只剩她和满架旧书的霉味。
快打烊时，门铃响了，一个穿灰风衣的男人走进来，自称顾明，说要找一本绝版的《潮汐手记》。
林夏记得那本书——三年前她父亲失踪那天，手里正攥着同名的书。顾明看她的眼神，像早就认识她。

第二章 同名的书
顾明留下一张写着地址的纸条就消失在雨里。林夏整夜没睡，第二天循着地址找到城东的废弃灯塔。
灯塔管理员老周是个独臂老人，听到"潮汐手记"四个字，脸色骤变，却什么都不肯说，只让她"别再来"。
回程的公交上，林夏发现风衣口袋里多了半张照片：父亲和年轻时的老周，并肩站在这座灯塔下。

第三章 灯亮了
当晚，熄灭多年的灯塔忽然亮起。林夏赶到时，顾明已等在塔顶，手里正是那本《潮汐手记》。
他说，她父亲并非失踪，而是为了护住书里的秘密自愿消失，而顾明，是父亲托付的人。
风停了。林夏接过书，扉页上是父亲的字：给夏夏，等你长大就懂。她终于落下泪来。`

// 案例 B：小说 + 完整世界观/人设设定文档 → grounding（应采信文档的设定与角色）
const NOVEL_B = `方舟城的第七环永远在下雨——人造雨，用来洗掉空气里的盐。基拉站在忆晶黑市的角落，兜帽压得很低。
"又是你。"诺亚从柜台后抬眼，把一枚泛蓝的忆晶推过来，"这枚是真的，淹没前的海，价钱你懂。"
基拉没接。三年前正是这种"淹没前的记忆"，让她弄丢了自己的一段。她只问："卖家是谁？"
诺亚笑了笑，没答。雨声里，远处传来巡逻无人机的嗡鸣。`

const BIBLE_DOC_B = `【世界观】时间 2098 年。海平面上升淹没大半陆地，幸存者迁入悬浮城邦「方舟」。
核心设定：人的记忆可被提取、封装成「忆晶」交易；忆晶猎人受雇追回或盗取特定记忆。基调冷峻、赛博朋克。
【主要角色】
- 基拉（Kira）：女，主角，忆晶猎人，沉默寡言，三年前丢失了一段自己的记忆。
- 诺亚（Noah）：男，方舟黑市的记忆商人，基拉的旧识。`

// 案例 C：无章节标记的短篇 → 测 segment 长度切分 + 无章节小说也能抽
const NOVEL_C = `便利店的灯在凌晨三点最亮。阿May把关东煮的汤舀给那个总在这个点来的老陈。
"今天也睡不着？"她问。老陈没答，只把硬币一枚枚码在台面上，像在数什么。
她忽然发现，他每次来，码的硬币数都比上次少一枚。等硬币码完的那天，他大概就不会再来了。`

const CASES: SmokeCase[] = [
  { name: 'novel-only', desc: '只有小说原文（有章节）→ 纯反推', novel: NOVEL_A },
  {
    name: 'with-bible-doc',
    desc: '小说 + 完整世界观/人设设定文档 → grounding',
    novel: NOVEL_B,
    bibleDoc: BIBLE_DOC_B,
    expectCharacters: ['基拉', '诺亚'],
  },
  { name: 'no-chapter', desc: '无章节标记的短篇 → 测 segment 长度切分', novel: NOVEL_C },
]

async function runCase(c: SmokeCase) {
  try {
    const chapters = segment(c.novel)
    const bible = await extractBible(c.novel, { bibleDoc: c.bibleDoc })
    Bible.parse(bible) // schema 合法性，抛错即失败

    const ids = bible.characters.map((ch) => ch.id)
    const dupIds = ids.filter((id, i) => ids.indexOf(id) !== i)
    const badPrefix = ids.filter((id) => !id.startsWith('char_'))

    // grounding 软校验：期望角色是否出现在 name/aliases 里
    let characterCoverage: string | undefined
    if (c.expectCharacters?.length) {
      const hit = c.expectCharacters.filter((want) =>
        bible.characters.some(
          (ch) => ch.name.includes(want) || ch.aliases.some((a) => a.includes(want)),
        ),
      )
      characterCoverage = `${hit.length}/${c.expectCharacters.length}（命中：${hit.join('、') || '无'}）`
    }

    return {
      name: c.name,
      desc: c.desc,
      ok: dupIds.length === 0 && badPrefix.length === 0 && bible.world.summary.trim().length > 0,
      checks: {
        chapterCount: chapters.length,
        characterCount: ids.length,
        idsUnique: dupIds.length === 0,
        idsPrefixed: badPrefix.length === 0,
        worldSummaryNonEmpty: bible.world.summary.trim().length > 0,
        outlineCount: bible.outline.length,
        ...(characterCoverage ? { characterCoverage } : {}),
        dupIds,
        badPrefix,
      },
      bible,
    }
  } catch (err) {
    return {
      name: c.name,
      desc: c.desc,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

export async function GET(req: Request) {
  const only = new URL(req.url).searchParams.get('case')

  // 生产环境：返回预生成的静态结果，**不触发付费 LLM 调用**。
  // 这是个无鉴权公开端点，线上实时跑会被反复请求刷爆额度；本地 dev 才实时抽取。
  if (process.env.NODE_ENV === 'production') {
    const results = only
      ? sampleResult.results.filter((r) => r.name === only)
      : sampleResult.results
    return NextResponse.json({
      mode: 'static',
      note: '线上为预生成示例（不实时调用 LLM）；本地 `npm run dev` 为实时抽取。',
      ok: results.every((r) => r.ok),
      passed: results.filter((r) => r.ok).length,
      total: results.length,
      results,
    })
  }

  // —— 以下为开发环境实时抽取 ——
  if (!process.env.LLM_API_KEY) {
    return NextResponse.json(
      { ok: false, error: '未配置 LLM_API_KEY，请在 .env.local 填好后重启 dev' },
      { status: 500 },
    )
  }

  const selected = only ? CASES.filter((c) => c.name === only) : CASES
  if (only && selected.length === 0) {
    return NextResponse.json(
      { ok: false, error: `未知 case：${only}。可选：${CASES.map((c) => c.name).join(' / ')}` },
      { status: 400 },
    )
  }

  // 串行跑，避免并发打 API；一个失败不影响其它
  const results = []
  for (const c of selected) results.push(await runCase(c))

  return NextResponse.json({
    ok: results.every((r) => r.ok),
    passed: results.filter((r) => r.ok).length,
    total: results.length,
    results,
  })
}
