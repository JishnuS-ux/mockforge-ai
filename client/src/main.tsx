import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'hsl(224, 18%, 15%)',
            color: 'hsl(220, 15%, 95%)',
            border: '1px solid hsla(220, 15%, 30%, 0.5)',
            borderRadius: '12px',
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px',
          },
          success: { iconTheme: { primary: 'hsl(142, 76%, 48%)', secondary: '#fff' } },
          error:   { iconTheme: { primary: 'hsl(0, 85%, 60%)',   secondary: '#fff' } },
        }}
      />
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
