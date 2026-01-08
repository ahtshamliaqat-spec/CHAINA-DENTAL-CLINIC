import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import PatientList from './components/PatientList';
import DoctorsList from './components/DoctorsList';
import AppointmentScheduler from './components/AppointmentScheduler';
import ClinicalView from './components/ClinicalView';
import BillingView from './components/BillingView';
import Login from './components/Login';
import { User, UserRole } from './types';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Check if user is already logged in (simulated)
  useEffect(() => {
    const savedUser = localStorage.getItem('china_dental_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('china_dental_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('china_dental_user');
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const isAdmin = currentUser.role === UserRole.ADMIN;

  return (
    <Router>
      <Layout onLogout={handleLogout} currentUser={currentUser}>
        <Routes>
          {/* Patients only get access to certain pages or limited views */}
          <Route path="/" element={isAdmin ? <Dashboard /> : <Navigate to="/appointments" />} />
          <Route path="/appointments" element={<AppointmentScheduler currentUser={currentUser} />} />
          
          {/* Admin Protected Routes */}
          {isAdmin && (
            <>
              <Route path="/patients" element={<PatientList />} />
              <Route path="/doctors" element={<DoctorsList />} />
              <Route path="/clinical" element={<ClinicalView />} />
              <Route path="/billing" element={<BillingView />} />
            </>
          )}

          {/* Fallback for Patients trying to access Admin pages */}
          {!isAdmin && (
            <>
              <Route path="/patients" element={<Navigate to="/appointments" />} />
              <Route path="/doctors" element={<Navigate to="/appointments" />} />
              <Route path="/clinical" element={<Navigate to="/appointments" />} />
              <Route path="/billing" element={<Navigate to="/appointments" />} />
            </>
          )}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;