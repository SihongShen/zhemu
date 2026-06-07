/**
 * Screenplay ↔ YAML 序列化。js-yaml 是面向人的形态；真源仍是 Zod。
 * 编辑器也用这两个：onChange → fromYaml 校验。
 */
import { dump, load } from 'js-yaml'
import { Screenplay } from '@/lib/schema'

export function screenplayToYaml(s: Screenplay): string {
  return dump(s, { lineWidth: 100, noRefs: true, sortKeys: false })
}

/** 解析 + Zod 校验；非法会抛错（编辑器据此显示红波浪线）。 */
export function yamlToScreenplay(text: string): Screenplay {
  return Screenplay.parse(load(text))
}
