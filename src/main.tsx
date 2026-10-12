import '@fontsource-variable/noto-sans';
import '@fontsource-variable/noto-serif';
import '@fontsource-variable/noto-sans-armenian';
import '@fontsource-variable/noto-sans-mono';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';
import './styles/print.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
