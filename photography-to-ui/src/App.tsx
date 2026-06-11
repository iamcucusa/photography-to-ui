import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Post from './pages/Post'
import { useTheme } from './hooks/useTheme'

function ModeToggle() {
  const { mode, toggle } = useTheme()
  return (
    <button
      className="mode-toggle"
      onClick={toggle}
      aria-pressed={mode === 'light'}
      aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
    >
      mode: {mode}
    </button>
  )
}

function App() {
  return (
    <>
      <ModeToggle />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/post" element={<Post />} />
      </Routes>
    </>
  )
}

export default App
