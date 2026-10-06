import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { runSeedDataCleanup } from './services/storage';

// Run cleanup of demo/seed items from previous app versions
runSeedDataCleanup();

// Register service worker safely with error handling for sandboxed iframes
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    registerSW({
      immediate: true,
      onRegisterError(err) {
        console.warn('PWA service worker registration note:', err);
      },
    });
  }
} catch {
  // Gracefully handle iframe restrictions
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
