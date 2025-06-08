import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App ticker="BTC/USD" />
    <App ticker="XAU/USD" />
  </StrictMode>
);
