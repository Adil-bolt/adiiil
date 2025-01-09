import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginPage from './LoginPage';
import ProtectedRoute from './ProtectedRoute';
import Dashboard from '../pages/Dashboard';
import Agenda2 from '../pages/Agenda2';
import { TreatedPatients } from '../pages/TreatedPatients';
import Billing from '../pages/Billing';
import CabinetManagement from '../pages/CabinetManagement';
import AdminPanel from '../pages/AdminPanel';
import Backup from '../pages/Backup';
import Notifications from '../pages/Notifications';
import Statistics from '../pages/Statistics';
import Patients2 from '../pages/Patients2';

export default function AppContent() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={
        user ? <Navigate to="/" replace /> : <LoginPage />
      } />
      
      <Route path="/" element={
        <ProtectedRoute requiredPermissions={['view_dashboard']}>
          <Dashboard />
        </ProtectedRoute>
      } />

      <Route path="/agenda2" element={
        <ProtectedRoute requiredPermissions={['view_appointments']}>
          <Agenda2 />
        </ProtectedRoute>
      } />

      <Route path="/soigne" element={
        <ProtectedRoute requiredPermissions={['view_patients']}>
          <TreatedPatients />
        </ProtectedRoute>
      } />

      <Route path="/patients2" element={
        <ProtectedRoute requiredPermissions={['view_patients']}>
          <Patients2 />
        </ProtectedRoute>
      } />

      <Route path="/billing" element={
        <ProtectedRoute requiredPermissions={['view_billing']}>
          <Billing />
        </ProtectedRoute>
      } />

      <Route path="/cabinet" element={
        <ProtectedRoute requiredPermissions={['view_cabinet']}>
          <CabinetManagement />
        </ProtectedRoute>
      } />

      <Route path="/admin" element={
        <ProtectedRoute requiredPermissions={['admin']}>
          <AdminPanel />
        </ProtectedRoute>
      } />

      <Route path="/backup" element={
        <ProtectedRoute requiredPermissions={['manage_backup']}>
          <Backup />
        </ProtectedRoute>
      } />

      <Route path="/notifications" element={
        <ProtectedRoute requiredPermissions={['view_notifications']}>
          <Notifications />
        </ProtectedRoute>
      } />

      <Route path="/supplies" element={
        <ProtectedRoute requiredPermissions={['admin']}>
          <CabinetManagement />
        </ProtectedRoute>
      } />

      <Route path="/users" element={
        <ProtectedRoute requiredPermissions={['admin']}>
          <AdminPanel />
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute requiredPermissions={['admin']}>
          <CabinetManagement />
        </ProtectedRoute>
      } />

      <Route path="/statistics" element={
        <ProtectedRoute requiredPermissions={['view_statistics']}>
          <Statistics />
        </ProtectedRoute>
      } />

      <Route path="/statistics2" element={
        <Navigate to="/statistics" replace />
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}