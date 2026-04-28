import { ReactNode, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loading } from './ui/Loading';
import { FloatingHealthAssistant } from './FloatingHealthAssistant';
import { HealthAssistantPanel } from './HealthAssistantPanel';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  if (loading) {
    return <Loading fullScreen text="Loading..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      {children}

      <FloatingHealthAssistant onClick={() => setIsAssistantOpen(true)} />

      <HealthAssistantPanel
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
      />
    </>
  );
}