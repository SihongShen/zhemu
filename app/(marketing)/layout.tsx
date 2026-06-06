/**
 * 落地页布局（/）：独立顶栏，不受应用容器宽度约束（中心元素可横向铺开）。
 */
import { LandingHeader } from '@/components/landing/landing-header'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LandingHeader />
      {children}
    </>
  )
}
