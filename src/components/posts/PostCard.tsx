import type { Post } from '../../posts/types'

export type PostCardProps = {
  post: Post
  onOpen?: (postId: string) => void
}

export function PostCard({ post, onOpen }: PostCardProps) {
  const handleClick = () => {
    if (onOpen) {
      onOpen(post.postId)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onOpen && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onOpen(post.postId)
    }
  }

  const metaText = `${post.postType} · ${post.aspectRatio} · ${post.status}`

  const cardContent = (
    <>
      <div className="post-card-cover">
        <img src={post.cover.src} alt={post.cover.alt} />
      </div>
      <div className="post-card-content">
        <h3 className="post-card-title">{post.title}</h3>
        {post.summary && (
          <p className="post-card-summary">{post.summary}</p>
        )}
        <div className="post-card-meta">{metaText}</div>
        {post.tags.length > 0 && (
          <div className="post-card-tags">
            {post.tags.map((tag) => (
              <span key={tag} className="post-card-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  )

  if (onOpen) {
    return (
      <button
        type="button"
        className="post-card post-card-interactive"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={`Open post ${post.postId}`}
      >
        {cardContent}
      </button>
    )
  }

  return (
    <div className="post-card">
      {cardContent}
    </div>
  )
}

