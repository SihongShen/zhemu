/**
 * 野兽派共享样式常量（与主页 / 顶栏统一）。
 * 硬黑描边 + 硬投影 + 直角 + 按压位移。供向导各步骤复用，确保视觉一致。
 * 注：这些字符串会被 Tailwind 的 content 扫描（含 .ts），类名照常生成。
 */

/** 主按钮：墨块 + 硬投影，hover 按压。 */
export const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 border-2 border-foreground bg-foreground px-6 py-3 font-bold text-background shadow-brutal transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 disabled:translate-x-0 disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none'

/** 次按钮：描边底。 */
export const BTN_GHOST =
  'inline-flex items-center justify-center gap-2 border-2 border-foreground bg-background px-5 py-3 font-bold shadow-brutal transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0'

/** 小号次按钮（工具栏用）。 */
export const BTN_GHOST_SM =
  'inline-flex items-center justify-center gap-1.5 border-2 border-foreground bg-background px-3 py-1.5 text-sm font-bold transition-colors duration-200 hover:bg-accent disabled:opacity-50'

/** 卡片 / 面板：硬描边 + 硬投影。 */
export const CARD = 'border-2 border-foreground bg-card shadow-brutal'

/** 输入 / 文本域：硬描边，聚焦主色环。 */
export const INPUT =
  'w-full border-2 border-foreground bg-background p-3 text-sm leading-relaxed outline-none transition focus:ring-2 focus:ring-primary'

/** 区块小标题标签（大写描边）。 */
export const TAG =
  'inline-block border-2 border-foreground bg-background px-3 py-1 text-xs font-bold uppercase tracking-[0.16em]'
