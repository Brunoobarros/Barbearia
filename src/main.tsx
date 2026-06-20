import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Esmaece e remove a Splash Screen de forma suave após 2 segundos
setTimeout(() => {
  const splash = document.getElementById('splash-screen');
  if (splash) {
    splash.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    splash.style.opacity = '0';
    splash.style.transform = 'scale(1.05)';
    setTimeout(() => {
      splash.remove();
    }, 600);
  }
}, 2000);
