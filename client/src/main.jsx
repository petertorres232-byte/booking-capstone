import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/layout-stability.css'
import App from './App.jsx'
import { initTheme } from './utils/theme.js'

// Re-apply a saved light/dark choice before the app renders
initTheme()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)