import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Post from './pages/Post'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/post" element={<Post />} />
    </Routes>
  )
}

export default App
