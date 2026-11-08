import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

if (import.meta.env.MODE === 'encrypted' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}course-offline-sw.js`).catch(() => {
      // Learning still works online. The access page explains browser offline limits.
      console.warn('Offline shell registration unavailable');
    });
  });
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
