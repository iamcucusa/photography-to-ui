import './PostTags.css'

export type PostTagsProps = {
  tags: string[]
  className?: string
  tagClassName?: string
}

/**
 * Reusable tags component for posts
 * Supports custom styling via className props for flexibility
 */
export function PostTags({ tags, className = '', tagClassName = '' }: PostTagsProps) {
  if (tags.length === 0) {
    return null
  }

  return (
    <ul className={`post-tags ${className}`} aria-label="Post tags">
      {tags.map((tag) => (
        <li key={tag} className={`post-tag ${tagClassName}`}>
          <span className="post-tag-hash" aria-hidden="true">
            #
          </span>
          {tag}
        </li>
      ))}
    </ul>
  )
}
