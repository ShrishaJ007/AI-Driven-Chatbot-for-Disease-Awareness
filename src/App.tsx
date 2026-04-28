import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import NearbyCareFinder from './pages/NearbyCareFinder';
import { Landing } from './pages/Landing';
import { Signup } from './pages/Signup';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { HealthProfilePage } from './pages/HealthProfile';
import DiseasePrediction from './pages/DiseasePrediction';
import { History } from './pages/History';
import { NotFound } from './pages/NotFound';
import HealthAssistant from './pages/HealthAssistant';

function AuthRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return user ? <Navigate to="/dashboard" replace /> : <Landing />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<AuthRedirect />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <HealthProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/prediction"
          element={
            <ProtectedRoute>
              <DiseasePrediction />
            </ProtectedRoute>
            }
          />

          

          <Route
            path="/nearby-care"
            element={
              <ProtectedRoute>
                <NearbyCareFinder />
              </ProtectedRoute>
            }
          />

          <Route
            path="/health-assistant"
            element={
              <ProtectedRoute>
                <HealthAssistant />
              </ProtectedRoute>
            }
          />

          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
