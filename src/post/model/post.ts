export type CarouselSlideKind = 'cover' | 'principle' | 'example' | 'closing'

export type ImageMode = 'full' | 'split-right' | 'split-top'

export type CarouselSlide = {
  id: string
  kind: CarouselSlideKind
  eyebrow?: string
  number?: string
  headline: string
  subhead?: string
  cta?: string
  emphasizedWords?: string[]
  image?: {
    src: string
    alt: string
    mode: ImageMode
  }
  footer?: {
    handle?: string
    attribution?: string
  }
}

export type CarouselPostContent = {
  aspect: '4:5' | '1:1'
  slides: CarouselSlide[]
}

export type SinglePostContent = {
  cover?: {
    src: string
    alt: string
  }
  quote?: {
    text: string
    author: string
    highlightedPhrase?: string | string[]
    category?: string
    number?: string
    variant?: 'minimal' | 'horizontal' | 'dots' | 'clean' | 'surface' | 'code'
  }
  summary?: string
  primaryLine?: string
  secondaryLines?: string
  belief?: string
  reframe?: string
  caption?: string
}

export type LinkedInFormat = 'square' | 'portrait' | 'landscape'

export type PostEntity = {
  id: string
  type: 'single' | 'carousel'
  title: string
  topic: string
  tags: string[]
  createdAt: string
  linkedinFormat: LinkedInFormat
  content: SinglePostContent | CarouselPostContent
  narrative?: string
}

