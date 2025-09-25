import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/mobile.css'
import './styles/dark-mode.css'
import './styles/dark-mode-complete.css'
import './styles/force-dark.css'

import './utils/fixUserRole'
import './utils/quickFix'
import './utils/forceDarkMode'
import './lib/posthog' // PostHog analytics başlat
import { overrideConsole } from './utils/logger' // Production'da console.log'ları kapat

// Production'da console.log'ları kapat
if (import.meta.env.PROD) {
  overrideConsole();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)