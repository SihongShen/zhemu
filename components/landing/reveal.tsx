'use client'
/**
 * 滚动揭示容器：元素进入视口时加 .is-visible 触发显形（见 globals.css .reveal）。
 * 支持 delay 做错峰。prefers-reduced-motion 下 CSS 已强制可见，这里无副作用。
 */
import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react'

export function Reveal({
  children,
  as: Tag = 'div',
  delay = 0,
  className = '',
}: {
  children: ReactNode
  as?: ElementType
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || shown) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [shown])

  return (
    <Tag
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={`reveal ${shown ? 'is-visible' : ''} ${className}`}
    >
      {children}
    </Tag>
  )
}
