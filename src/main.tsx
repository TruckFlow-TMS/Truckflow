import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { migrateStorage } from './lib/migrateStorage';
import './styles/index.css';

// Must run before React mounts: AuthContext and App read storage during
// their initial useState, which happens inside render.
migrateStorage();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
