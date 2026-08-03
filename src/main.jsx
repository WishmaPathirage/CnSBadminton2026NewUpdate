import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { AuthProvider } from './context/AuthContext'

// Clear any stale Service Workers & CacheStorage that might have cached old domain redirects
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister()
    }
  })
}
if ('caches' in window) {
  caches.keys().then((names) => {
    for (const name of names) {
      caches.delete(name)
    }
  })
}
//upto here
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)