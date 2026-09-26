import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';

// Lazy loaded page components for optimal bundle performance
const EditorPage = lazy(() => import('./pages/EditorPage'));
const MarketplacePage = lazy(() => import('./pages/MarketplacePage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const DataQualityPage = lazy(() => import('./pages/DataQualityPage'));
const APITestingPage = lazy(() => import('./pages/APITestingPage'));
const VersionsPage = lazy(() => import('./pages/VersionsPage'));

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 20, background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: 32, borderRadius: 16, maxWidth: 480, textAlign: 'center' }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Workspace Error Handled</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
              {this.state.error?.message || 'An unexpected rendering state occurred.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = '/login';
              }}
              style={{ padding: '10px 20px', borderRadius: 8, background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              Reset & Return to Sign In
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function PageLoader() {
  return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
      <div className="skeleton" style={{ height: 200, width: '100%', borderRadius: 16 }} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index          element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"  element={<DashboardPage />} />
          <Route path="/projects"   element={<ProjectsPage />} />
          <Route
            path="/projects/:id/editor"
            element={
              <Suspense fallback={<PageLoader />}>
                <EditorPage />
              </Suspense>
            }
          />
          <Route
            path="/quality"
            element={
              <Suspense fallback={<PageLoader />}>
                <DataQualityPage />
              </Suspense>
            }
          />
          <Route
            path="/api-testing"
            element={
              <Suspense fallback={<PageLoader />}>
                <APITestingPage />
              </Suspense>
            }
          />
          <Route
            path="/versions"
            element={
              <Suspense fallback={<PageLoader />}>
                <VersionsPage />
              </Suspense>
            }
          />
          <Route
            path="/marketplace"
            element={
              <Suspense fallback={<PageLoader />}>
                <MarketplacePage />
              </Suspense>
            }
          />
          <Route
            path="/history"
            element={
              <Suspense fallback={<PageLoader />}>
                <HistoryPage />
              </Suspense>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Suspense fallback={<PageLoader />}>
                  <AdminPage />
                </Suspense>
              </AdminRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
