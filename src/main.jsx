
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import '@/index.css';

const StrictModeWrapper = ({ children }) => {
  // StrictMode is disabled because it was causing some issues with third-party libraries.
  return <>{children}</>;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictModeWrapper>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <App />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictModeWrapper>
);
