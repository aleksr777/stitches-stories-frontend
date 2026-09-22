import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AuthProvider from './features/auth/model/auth-provider';
import './index.css';
import App from './app.tsx';

const rootElement = document.getElementById('root');

document.addEventListener('dragstart', (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (target instanceof HTMLImageElement || target.closest('a')) event.preventDefault();
});

createRoot(rootElement!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
