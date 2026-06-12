import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './lib/auth';
import { FocusProvider } from './lib/focus';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <FocusProvider>
          <App />
        </FocusProvider>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);
