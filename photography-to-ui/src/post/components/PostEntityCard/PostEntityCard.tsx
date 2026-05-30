import { useMemo } from 'react'
import type { PostEntity, LinkedInFormat, SinglePostContent } from '../../model'
import { CarouselPost } from '../CarouselPost'
import { PostNarrative } from '../PostNarrative/PostNarrative'
import { PostTags } from '../PostTags/PostTags'
import { PostQuote } from '../PostQuote/PostQuote'
import { buildNarrativeText } from '../../utils/narrative'
import './PostEntityCard.css'

export type PostEntityCardProps = {
  post: PostEntity
  onOpen?: (postId: string) => void
  debug?: boolean
}

/**
 * Maps LinkedIn format to CSS aspect ratio
 * square: 1 / 1
 * portrait: 4 / 5
 * landscape: 1.91 / 1 (191 / 100)
 */
function getAspectRatio(format: LinkedInFormat): string {
  const aspectMap: Record<LinkedInFormat, string> = {
    square: '1 / 1',
    portrait: '4 / 5',
    landscape: '191 / 100',
  }
  return aspectMap[format]
}

export function PostEntityCard({ post, onOpen, debug = false }: PostEntityCardProps) {
  const narrativeText = useMemo(
    () => buildNarrativeText(post.title, post.narrative),
    [post.title, post.narrative],
  )

  if (post.type === 'carousel') {
    return <CarouselPost post={post} onOpen={onOpen} />
  }

  const content = post.content as SinglePostContent
  const isImageLed = content.caption && !content.belief
  const aspectRatio = content.cover ? getAspectRatio(post.linkedinFormat) : undefined

  return (
    <article
      className={`post-entity-card post-entity-card--single ${debug ? 'post-entity-card--debug' : ''}`}
      data-post-id={post.id}
      data-linkedin-format={post.linkedinFormat}
    >
      {narrativeText && (
        <PostNarrative narrative={narrativeText} className="post-entity-card-narrative" />
      )}
      <PostTags
        tags={post.tags}
        className="post-entity-card-tags"
        tagClassName="post-entity-card-tag"
      />
      {content.quote && (
        <PostQuote
          quote={content.quote.text}
          author={content.quote.author}
          highlightedPhrase={content.quote.highlightedPhrase}
          className={`post-entity-card-quote ${content.quote.variant ? `post-quote--variant-${content.quote.variant}` : ''}`}
          linkedinFormat={post.linkedinFormat}
          category={content.quote.category}
          number={content.quote.number}
        />
      )}
      {content.cover?.src && (
        <div className="post-entity-card-cover" style={{ aspectRatio }}>
          <img src={content.cover.src} alt={content.cover.alt} />
          {debug && (
            <div className="post-entity-card-debug-label">
              {post.linkedinFormat} ({aspectRatio})
            </div>
          )}
        </div>
      )}
      <div className="post-entity-card-content">
        {isImageLed && content.caption && !post.narrative && (
          <p className="post-entity-card-caption">
            {content.caption
              .split(/([.?!])\s*/)
              .filter(Boolean)
              .map((part, index, array) => {
                const isPunctuation = /^[.?!]$/.test(part)
                const nextPart = array[index + 1]
                const shouldBreak = isPunctuation && nextPart && !/^[.?!]$/.test(nextPart)
                return (
                  <span key={index}>
                    {part}
                    {shouldBreak && <br />}
                  </span>
                )
              })}
          </p>
        )}
        {!isImageLed && (
          <>
            {content.primaryLine && (
              <div className="post-entity-card-primary-line">{content.primaryLine}</div>
            )}
            {content.secondaryLines && (
              <div className="post-entity-card-secondary-lines">{content.secondaryLines}</div>
            )}
            {content.belief && content.reframe && (
              <div className="post-entity-card-belief-reframe">
                <div className="post-entity-card-belief">
                  <span className="post-entity-card-belief-label">Belief:</span>
                  <span className="post-entity-card-belief-text">{content.belief}</span>
                </div>
                <div className="post-entity-card-reframe">
                  <span className="post-entity-card-reframe-label">Reframe:</span>
                  <span className="post-entity-card-reframe-text">{content.reframe}</span>
                </div>
              </div>
            )}
            {content.caption && <p className="post-entity-card-caption">{content.caption}</p>}
            {content.summary && <p className="post-entity-card-summary">{content.summary}</p>}
          </>
        )}
      </div>
    </article>
  )
}
