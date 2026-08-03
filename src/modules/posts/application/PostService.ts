import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { requireCurrentUser } from '@/lib/auth'

function cleanText(value: string, maxLength: number) {
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

export class PostService {
  static async createPost(content: string) {
    const user = await requireCurrentUser()
    const cleanedContent = cleanText(content, 500)
    if (!cleanedContent) return { ok: false, message: 'Write something before posting.' }

    await prisma.post.create({ data: { userId: user.id, content: cleanedContent } })
    revalidatePath('/app/profile')
    return { ok: true }
  }

  static async deletePost(id: string) {
    const user = await requireCurrentUser()
    const deleted = await prisma.post.deleteMany({ where: { id, userId: user.id } })
    if (!deleted.count) return { ok: false, message: 'Post not found.' }

    revalidatePath('/app/profile')
    return { ok: true }
  }
}
