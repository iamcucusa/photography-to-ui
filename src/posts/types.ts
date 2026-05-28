export type PostType = 'single-image' | 'carousel' | 'document' | 'video'

export type AspectRatio = '1:1' | '4:5' | '1.91:1' | '16:9'

export type Theme = 'light' | 'dark'

export type PostStatus = 'draft' | 'ready' | 'published'

export type Post = {
  postId: string
  title: string
  postType: PostType
  aspectRatio: AspectRatio
  theme: Theme
  status: PostStatus
  tags: string[]
  createdAt: string // ISO string
  cover: {
    src: string
    alt: string
  }
  summary?: string
}


