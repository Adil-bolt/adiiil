import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { DataProvider } from './contexts/DataContext';
import { AppointmentProvider } from './contexts/AppointmentContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DataProvider>
      <AppointmentProvider>
        <App />
      </AppointmentProvider>
    </DataProvider>
  </StrictMode>
);