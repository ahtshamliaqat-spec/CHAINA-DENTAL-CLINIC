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
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('china_dental_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('china_dental_user');
      }
    }
    setInitialized(true);
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('china_dental_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('china_dental_user');
  };

  if (!initialized) return null;

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const isAdmin = currentUser.role === UserRole.ADMIN;

  return (
    <Router>
      <Layout onLogout={handleLogout} currentUser={currentUser}>
        <Routes>
          <Route path="/" element={isAdmin ? <Dashboard /> : <Navigate to="/appointments" replace />} />
          <Route path="/appointments" element={<AppointmentScheduler currentUser={currentUser} />} />
          
          {isAdmin && (
            <>
              <Route path="/patients" element={<PatientList />} />
              <Route path="/doctors" element={<DoctorsList />} />
              <Route path="/clinical" element={<ClinicalView />} />
              <Route path="/billing" element={<BillingView />} />
            </>
          )}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;