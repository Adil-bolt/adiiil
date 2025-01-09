import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ReminderProvider } from './contexts/ReminderContext';
import { WhatsAppProvider } from './contexts/WhatsAppContext';
import { PaymentProvider } from './contexts/PaymentContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { LogoProvider } from './contexts/LogoContext';
import { PatientManagementProvider } from './contexts/PatientManagementContext';
import { DataProvider } from './contexts/DataContext';
import { UpdateProvider } from './contexts/UpdateContext';
import { UnifiedDataProvider } from './contexts/UnifiedDataContext';
import AppContent from './components/AppContent';
import Layout from './components/Layout';

// Future flags pour React Router v7
const routerOptions = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

export default function App() {
  return (
    <BrowserRouter {...routerOptions}>
      <AuthProvider>
        <DataProvider>
          <UnifiedDataProvider>
            <LogoProvider>
              <PaymentProvider>
                <WhatsAppProvider>
                  <ReminderProvider>
                    <SidebarProvider>
                      <PatientManagementProvider>
                        <UpdateProvider>
                          <Layout>
                            <AppContent />
                          </Layout>
                        </UpdateProvider>
                      </PatientManagementProvider>
                    </SidebarProvider>
                  </ReminderProvider>
                </WhatsAppProvider>
              </PaymentProvider>
            </LogoProvider>
          </UnifiedDataProvider>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}