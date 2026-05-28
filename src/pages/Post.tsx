import { useNavigate } from 'react-router-dom'
import { PostFilter } from '../components/posts/PostFilter'
import { mockPosts } from '../post/data/mockPosts'
import { PostEntityCard } from '../post/components/PostEntityCard'

// Debug mode: set to true to show LinkedIn format labels and outlines
const DEBUG_LINKEDIN_FORMAT = false

function Post() {
  const navigate = useNavigate()

  return (
    <div className="app">
      <button
        className="page-title"
        onClick={() => navigate('/')}
        aria-label="Return to homepage"
      >
        <span className="page-title-top">Photography</span>
        <span className="page-title-arrow">↓</span>
        <span className="page-title-bottom">Product UI</span>
      </button>
      <div className="layout layout--posts">
        <div className="posts-header">
          <div className="posts-header-title">
            <h1 className="primary-panel-headline">
              Posts
              <span className="headline-cursor">_</span>
            </h1>
            <span className="posts-header-count">{mockPosts.length}</span>
          </div>
          <p className="primary-panel-supporting">
            A coded post library. Designed for LinkedIn-ready assets.
          </p>
        </div>
        <div className="posts-content">
          <div className="posts-masonry">
            {mockPosts.map((post) => (
              <PostEntityCard key={post.id} post={post} debug={DEBUG_LINKEDIN_FORMAT} />
            ))}
          </div>
          <PostFilter />
        </div>
        <button
          className="back-home-nav"
          onClick={() => navigate('/')}
          aria-label="Back to home"
        >
          <span className="back-home-arrow">←</span>
          <span className="back-home-label">back home</span>
        </button>
      </div>
      <div className="credit">
        <a
          href="https://www.linkedin.com/in/iamcucusa"
          target="_blank"
          rel="noopener noreferrer"
          className="credit-link"
        >
          Designed in code by <span className="credit-handle">@iamcucusa</span>
        </a>
      </div>
    </div>
  )
}

export default Post

