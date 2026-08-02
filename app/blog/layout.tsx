import { BlogHeader } from '@/features/blog/components/BlogHeader'
import { Footer } from '@/components/Footer'

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F4F0EA]">
      <BlogHeader />
      <main className="flex-1 w-full">{children}</main>
      <Footer />
    </div>
  )
}
