import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './api/client';
import Layout from './components/Layout';
import Login from './pages/Login';
import LogCall from './pages/LogCall';
import Dashboard from './pages/Dashboard';
import SmsHistory from './pages/SmsHistory';
import ManageReps from './pages/ManageReps';
import ChangePassword from './pages/ChangePassword';

function ProtectedRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.must_change_password) {
    return <Navigate to="/change-password" replace />;
  }
  return children;
}

function AdminRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.must_change_password) {
    return <Navigate to="/change-password" replace />;
  }
  if (!user.is_admin) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { user } = await auth.me();
      setUser(user);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            user ? (
              user.must_change_password ? (
                <Navigate to="/change-password" replace />
              ) : (
                <Navigate to="/" replace />
              )
            ) : (
              <Login setUser={setUser} />
            )
          }
        />
        <Route
          path="/change-password"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : !user.must_change_password ? (
              <Navigate to="/" replace />
            ) : (
              <ChangePassword user={user} setUser={setUser} />
            )
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute user={user}>
              <Layout user={user} setUser={setUser}>
                <LogCall user={user} />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute user={user}>
              <Layout user={user} setUser={setUser}>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sms-history"
          element={
            <ProtectedRoute user={user}>
              <Layout user={user} setUser={setUser}>
                <SmsHistory />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reps"
          element={
            <AdminRoute user={user}>
              <Layout user={user} setUser={setUser}>
                <ManageReps />
              </Layout>
            </AdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
