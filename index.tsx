import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App';
import './src/index.css';
import './src/styles/global.css';
import './src/styles/Header.css';
import './src/styles/StatsCard.css';
import { GoogleOAuthProvider } from '@react-oauth/google';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
