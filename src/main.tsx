/**
 * Copyright (c) 2026 Yash Killamsetty
 * All rights reserved.
 * Unauthorized copying, modification, or distribution of this
 * software, via any medium, is strictly prohibited.
 * Proprietary and confidential.
 */
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <App />,
);
