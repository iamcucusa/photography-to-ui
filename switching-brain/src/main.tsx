import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import '@tokens/fonts.css'
import '@tokens/dist/tokens.css'
import './styles/base.css'
import './styles/viz-tokens.css'
import './styles/app.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
