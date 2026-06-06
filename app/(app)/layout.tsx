/**
 * 应用区布局（/app/*）：常驻顶栏 + 居中容器。
 * 落地页（/）不走这里，各自独立。
 */
import { AppHeader } from '@/components/app-header'

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-[1440px]">{children}</main>
    </>
  )
}
