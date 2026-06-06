'use client'
/**
 * 折幕 · 品牌落地页（野兽派 / 滚动叙事）—— 站点首页（/）。
 *
 * 设计来源：ui-ux-pro-max → Scroll-Triggered Storytelling + Exaggerated Minimalism。
 * 复用「雾港」配色与全局零圆角；动效纯 CSS + IntersectionObserver，prefers-reduced-motion 全量降级。
 * 隐喻：幕布开合 / 折叠 / 一折一幕 / 剧本台词。
 *
 * 布局：中心元素横向铺到 max-w-[1440px]，左右留白取原方案一半（px-4 sm:px-6）。
 */
import Link from 'next/link'
import { Reveal } from '@/components/landing/reveal'
import { Marquee, Tag } from '@/components/landing/marquee'

const NOVEL = `林晚把伞收进门廊，雨水顺着伞骨滴成
一条细线。"你终于来了。"她没有回头，
声音里有十年的疲惫。`

const YAML = `- unit: 1
  type: scene
  heading:
    int_ext: INT
    location: 门廊
    time: 雨夜
  characters: [林晚]
  action: 林晚收伞，雨水顺伞骨滴落成线。
  dialogue:
    - who: 林晚
      paren: (没有回头)
      line: 你终于来了。
  subtext: 十年的疲惫`

export default function Landing() {
  return (
    <div className="bg-background text-foreground">
      {/* ============ HERO：开幕 ============ */}
      <section className="relative overflow-hidden border-b-2 border-foreground">
        <div className="absolute inset-0 bg-grid opacity-60" aria-hidden />
        <Marquee
          className="border-t-0 bg-primary text-primary-foreground"
          items={['NOVEL → SCREENPLAY', '小说 · 折成 · 剧本', '一折一幕', 'STRUCTURED YAML', '跨章节一致']}
        />

        <div className="relative px-4 pb-24 pt-16 sm:px-6">
          <div className="mx-auto grid max-w-[1440px] items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            {/* 左：文案 */}
            <div>
              <Reveal>
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <Tag>AI 剧本工具</Tag>
                  <Tag>Schema v0.1</Tag>
                  <span className="text-sm text-muted-foreground">内容与格式分离 · 一份数据多格式渲染</span>
                </div>
              </Reveal>

              {/* 巨型标题 + 幕布开合 */}
              <h1 className="font-heading font-black leading-[0.92] tracking-tight">
                <span className="block origin-top animate-curtain text-[clamp(3.5rem,13vw,10rem)]">折幕</span>
                <span
                  className="block origin-top animate-curtain text-[clamp(1.6rem,5vw,3.5rem)] text-primary"
                  style={{ animationDelay: '0.18s' }}
                >
                  把小说折成一幕幕剧本
                </span>
              </h1>

              <Reveal delay={120}>
                <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">
                  折幕把三章以上的小说，自动折叠成一份
                  <span className="font-semibold text-foreground">人能改、机器也能用</span>
                  的结构化剧本数据。一份 YAML，可再渲染成中式 / 好莱坞等多种制式。
                </p>
              </Reveal>

              <Reveal delay={200}>
                <div className="mt-9 flex flex-wrap items-center gap-4">
                  <Link
                    href="/works"
                    className="group inline-flex items-center gap-2 border-2 border-foreground bg-foreground px-7 py-3.5 text-base font-bold text-background shadow-brutal transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0"
                  >
                    进入折幕
                    <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </Link>
                  <a
                    href="#fold"
                    className="inline-flex items-center gap-2 border-2 border-foreground bg-background px-7 py-3.5 text-base font-bold shadow-brutal transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5"
                  >
                    看它怎么折 ↓
                  </a>
                </div>
              </Reveal>
            </div>

            {/* 右：终端式标语 */}
            <Reveal delay={160} className="w-full">
              <div className="origin-top animate-curtain border-2 border-foreground bg-card font-mono text-sm shadow-brutal-lg" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center gap-2 border-b-2 border-foreground bg-secondary px-4 py-2.5">
                  <span className="h-3 w-3 border-2 border-foreground" />
                  <span className="h-3 w-3 border-2 border-foreground bg-primary" />
                  <span className="h-3 w-3 border-2 border-foreground" />
                  <span className="ml-2 text-xs text-muted-foreground">zhemu — convert</span>
                </div>
                <pre className="px-5 py-4 leading-loose">
                  <span className="text-muted-foreground">$</span> 折 小说.txt{'\n'}
                  <span className="text-primary">⤷</span> 解析章节 · 抽取设定 · 生成场景…{'\n'}
                  <span className="text-foreground">✓ 输出 script.yaml</span>
                  <span className="ml-1 inline-block w-2.5 animate-blink bg-foreground align-middle">&nbsp;</span>
                </pre>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ 第一幕：小说 → YAML 折叠演示 ============ */}
      <section id="fold" className="border-b-2 border-foreground px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-[1440px]">
          <Reveal>
            <p className="mb-2 font-mono text-sm font-bold uppercase tracking-[0.2em] text-primary">第一幕 / Act I</p>
            <h2 className="font-heading text-[clamp(2rem,5vw,3.5rem)] font-black leading-tight">一折，散文成场景</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              左边是小说原文，右边是折出来的结构化剧本。中间那条折线，就是折幕做的事。
            </p>
          </Reveal>

          <div className="mt-12 grid items-stretch gap-0 lg:grid-cols-[1fr_auto_1fr]">
            {/* 原文 */}
            <Reveal className="h-full">
              <div className="flex h-full flex-col border-2 border-foreground bg-card p-7 shadow-brutal">
                <div className="mb-5 flex items-center justify-between">
                  <Tag>小说原文</Tag>
                  <span className="font-mono text-xs text-muted-foreground">novel.txt</span>
                </div>
                <p className="whitespace-pre-line font-heading text-lg leading-loose text-foreground">{NOVEL}</p>
              </div>
            </Reveal>

            {/* 折线 */}
            <div className="flex items-center justify-center py-6 lg:flex-col lg:px-10">
              <div className="hidden h-px w-full origin-left animate-fold-grow bg-foreground lg:block lg:h-full lg:w-px lg:origin-top" />
              <div className="flex items-center justify-center border-2 border-foreground bg-primary px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-primary-foreground shadow-brutal">
                折 ⟶
              </div>
              <div className="hidden h-px w-full origin-right animate-fold-grow bg-foreground lg:block lg:h-full lg:w-px lg:origin-bottom" />
            </div>

            {/* YAML */}
            <Reveal className="h-full" delay={150}>
              <div className="flex h-full flex-col border-2 border-foreground bg-foreground p-7 shadow-brutal">
                <div className="mb-5 flex items-center justify-between">
                  <span className="inline-block border-2 border-background px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-background">
                    结构化剧本
                  </span>
                  <span className="font-mono text-xs text-background/60">script.yaml</span>
                </div>
                <pre className="overflow-x-auto font-mono text-[13px] leading-relaxed text-background">{YAML}</pre>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ 第二幕：四个正交维度 ============ */}
      <section className="border-b-2 border-foreground bg-secondary px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-[1440px]">
          <Reveal>
            <p className="mb-2 font-mono text-sm font-bold uppercase tracking-[0.2em] text-primary">第二幕 / Act II</p>
            <h2 className="font-heading text-[clamp(2rem,5vw,3.5rem)] font-black leading-tight">四个正交维度</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              别把它们混成一个「格式」。制式、体量、改编自由度、输出格式——各管各的，自由组合。
            </p>
          </Reveal>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: '01', t: '制式', d: '中式 / 好莱坞排版规则，渲染期决定。', e: '渲染' },
              { n: '02', t: '体量', d: '短片到长剧，控制场景密度与展开。', e: '规模' },
              { n: '03', t: '改编自由度', d: '忠实还原 ↔ 大胆重构，转换前烤进数据。', e: '转换' },
              { n: '04', t: '输出格式', d: 'YAML / Fountain / 富文本，导出期切换。', e: '导出' },
            ].map((c, i) => (
              <Reveal key={c.n} delay={i * 90}>
                <div className="group h-full cursor-default border-2 border-foreground bg-card p-6 shadow-brutal transition-transform duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-lg">
                  <div className="flex items-baseline justify-between">
                    <span className="font-heading text-4xl font-black text-primary">{c.n}</span>
                    <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{c.e}</span>
                  </div>
                  <h3 className="mt-5 text-xl font-bold">{c.t}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{c.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 第三幕：跨章节一致性 ============ */}
      <section className="border-b-2 border-foreground px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <Reveal>
              <p className="mb-2 font-mono text-sm font-bold uppercase tracking-[0.2em] text-primary">第三幕 / Act III</p>
              <h2 className="font-heading text-[clamp(2rem,5vw,3.5rem)] font-black leading-tight">章节之间，不失忆</h2>
              <p className="mt-4 max-w-xl text-muted-foreground">
                分章处理，章节间传递 running state——角色状态与剧情摘要随幕推进，
                第十章的人物，还记得第一章的伤。
              </p>
              <ul className="mt-7 space-y-3">
                {['角色状态：关系 / 处境逐幕累积', '剧情摘要：上一幕的结，喂给下一幕', 'Story Bible 双向：作者输入或 AI 反推后确认'].map(
                  (t) => (
                    <li key={t} className="flex items-start gap-3 border-l-4 border-primary pl-4 text-sm">
                      <span>{t}</span>
                    </li>
                  )
                )}
              </ul>
            </Reveal>

            {/* 章节链：state 传递 */}
            <Reveal delay={150}>
              <div className="border-2 border-foreground bg-card p-7 shadow-brutal-lg">
                <div className="space-y-3">
                  {[1, 2, 3].map((ch, i) => (
                    <div key={ch}>
                      <div
                        className="flex items-center gap-4 border-2 border-foreground bg-background p-4 animate-float-y"
                        style={{ animationDelay: `${i * 0.4}s` }}
                      >
                        <span className="font-heading text-2xl font-black text-primary">第{ch}章</span>
                        <div className="flex-1 font-mono text-xs text-muted-foreground">
                          <div>characters: 林晚, 江野…</div>
                          <div>summary: …十年后重逢于雨夜</div>
                        </div>
                      </div>
                      {ch < 3 && (
                        <div className="flex items-center gap-2 py-1.5 pl-6">
                          <span className="font-mono text-xs font-bold text-primary">↓ running state</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ 第四幕：多格式渲染 + 本地持久化 ============ */}
      <section className="border-b-2 border-foreground bg-foreground px-4 py-24 text-background sm:px-6">
        <div className="mx-auto max-w-[1440px]">
          <Reveal>
            <p className="mb-2 font-mono text-sm font-bold uppercase tracking-[0.2em] text-primary">第四幕 / Act IV</p>
            <h2 className="font-heading text-[clamp(2rem,5vw,3.5rem)] font-black leading-tight">一份数据，多副面孔</h2>
          </Reveal>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { t: '多格式渲染', d: '同一份 YAML，纯函数 renderer 出中式 / 好莱坞剧本，零重写。', k: 'render' },
              { t: '本地持久化', d: '纯客户端 IndexedDB，无登录即留存，多作品库并行。', k: 'idb' },
              { t: '版本管理', d: '整本快照、回滚，每一次打磨都可追溯。', k: 'snapshot' },
            ].map((c, i) => (
              <Reveal key={c.k} delay={i * 100}>
                <div className="group h-full border-2 border-background bg-foreground p-7 transition-colors duration-200 hover:bg-primary hover:text-primary-foreground">
                  <span className="font-mono text-[11px] uppercase tracking-widest opacity-60">{c.k}</span>
                  <h3 className="mt-3 font-heading text-2xl font-black">{c.t}</h3>
                  <p className="mt-3 text-sm leading-relaxed opacity-80">{c.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 终幕：CTA ============ */}
      <section className="relative overflow-hidden px-4 py-28 sm:px-6">
        <div className="absolute inset-0 bg-grid opacity-60" aria-hidden />
        <Reveal className="relative mx-auto max-w-3xl text-center">
          <p className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-primary">终幕 / Finale</p>
          <h2 className="mt-4 font-heading text-[clamp(2.5rem,9vw,6rem)] font-black leading-[0.95]">现在开折</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            把第一篇小说丢进来，几分钟后拿走一份能改、能续、能多格式导出的结构化剧本。
          </p>
          <Link
            href="/works"
            className="group mt-9 inline-flex items-center gap-3 border-2 border-foreground bg-primary px-10 py-4 text-lg font-black text-primary-foreground shadow-brutal-lg transition-transform duration-200 hover:-translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0"
          >
            进入折幕
            <span className="transition-transform duration-200 group-hover:translate-x-1.5">→</span>
          </Link>
        </Reveal>
      </section>

      <Marquee
        className="bg-foreground text-background"
        items={['折幕 ZHÉMÙ', '一折一幕', '把小说折成剧本', 'STRUCTURED SCREENPLAY', 'Schema v0.1']}
      />
      <footer className="px-4 py-8 text-center text-sm text-muted-foreground sm:px-6">
        折幕 Zhémù · 内容与格式分离 · 本地优先 · © 2026
      </footer>
    </div>
  )
}
