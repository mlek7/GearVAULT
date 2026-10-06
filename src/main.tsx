import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { runSeedDataCleanup } from './services/storage';

// Run one-time cleanup of demo/seed items from previous app versions (Requirement 4)
runSeedDataCleanup();

// Register service worker for offline caching and iOS home-screen standalone experience
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
