import type { PostType, Theme, PostStatus } from '../../posts/types'

export type PostFilterProps = {
  selectedTypes?: PostType[]
  selectedThemes?: Theme[]
  selectedStatuses?: PostStatus[]
  onTypeChange?: (types: PostType[]) => void
  onThemeChange?: (themes: Theme[]) => void
  onStatusChange?: (statuses: PostStatus[]) => void
}

export function PostFilter({
  selectedTypes = [],
  selectedThemes = [],
  selectedStatuses = [],
  onTypeChange,
  onThemeChange,
  onStatusChange,
}: PostFilterProps) {
  const postTypes: PostType[] = ['single-image', 'carousel', 'document', 'video']
  const themes: Theme[] = ['light', 'dark']
  const statuses: PostStatus[] = ['draft', 'ready', 'published']

  const handleTypeToggle = (type: PostType) => {
    if (!onTypeChange) return
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type]
    onTypeChange(newTypes)
  }

  const handleThemeToggle = (theme: Theme) => {
    if (!onThemeChange) return
    const newThemes = selectedThemes.includes(theme)
      ? selectedThemes.filter((t) => t !== theme)
      : [...selectedThemes, theme]
    onThemeChange(newThemes)
  }

  const handleStatusToggle = (status: PostStatus) => {
    if (!onStatusChange) return
    const newStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter((s) => s !== status)
      : [...selectedStatuses, status]
    onStatusChange(newStatuses)
  }

  return (
    <aside className="post-filter-rail">
      <div className="post-filter-header">
        <h2 className="post-filter-title">Filters</h2>
      </div>
      <div className="post-filter-content">
        <div className="post-filter-group">
          <h3 className="post-filter-group-title">Type</h3>
          <div className="post-filter-options">
            {postTypes.map((type) => (
              <button
                key={type}
                type="button"
                className={`post-filter-option ${selectedTypes.includes(type) ? 'post-filter-option-active' : ''}`}
                onClick={() => handleTypeToggle(type)}
                aria-pressed={selectedTypes.includes(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        <div className="post-filter-group">
          <h3 className="post-filter-group-title">Theme</h3>
          <div className="post-filter-options">
            {themes.map((theme) => (
              <button
                key={theme}
                type="button"
                className={`post-filter-option ${selectedThemes.includes(theme) ? 'post-filter-option-active' : ''}`}
                onClick={() => handleThemeToggle(theme)}
                aria-pressed={selectedThemes.includes(theme)}
              >
                {theme}
              </button>
            ))}
          </div>
        </div>
        <div className="post-filter-group">
          <h3 className="post-filter-group-title">Status</h3>
          <div className="post-filter-options">
            {statuses.map((status) => (
              <button
                key={status}
                type="button"
                className={`post-filter-option ${selectedStatuses.includes(status) ? 'post-filter-option-active' : ''}`}
                onClick={() => handleStatusToggle(status)}
                aria-pressed={selectedStatuses.includes(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}

