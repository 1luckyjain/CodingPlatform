import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

/* context */
import { AuthProvider, useAuth } from './context/AuthContext';

/* guards */
import ProtectedRoute, { GuestRoute } from './components/common/ProtectedRoute';

/* layout */
import Navbar from './components/layout/Navbar';

/* common pages */
import Landing from './pages/Landing';
import Profile from './pages/Profile';

/* auth pages */
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

/* user pages */
import UserDashboard from './pages/user/UserDashboard';
import ProblemsList from './pages/user/ProblemsList';
import ProblemDetail from './pages/user/ProblemDetail';
import Submissions from './pages/user/Submissions';
import Contests from './pages/user/Contests';
import ContestDetail from './pages/user/ContestDetail';
import Leaderboard from './pages/user/Leaderboard';

/* host pages */
import HostDashboard from './pages/host/HostDashboard';
import CreateProblem from './pages/host/CreateProblem';
import ManageProblems from './pages/host/ManageProblems';
import CreateContest from './pages/host/CreateContest';
import ManageContests from './pages/host/ManageContests';
import AnalyticsDashboard from './pages/host/AnalyticsDashboard';

/* ── Page wrapper that adds navbar + content padding ── */
const PageLayout = ({ children, wide }) => (
  <div className="page-wrapper">
    <Navbar />
    <main
      className={wide ? 'main-content-wide' : 'main-content'}
      style={wide ? { padding: '1rem', maxWidth: '100%' } : {}}
    >
      {children}
    </main>
  </div>
);

/* ── Loading fallback ── */
const LoadingScreen = () => (
  <div className="loading-container" style={{ minHeight: '100vh' }}>
    <div className="spinner"></div>
    <p>Loading…</p>
  </div>
);

/* ── Root redirect based on auth state ── */
const RootRedirect = () => {
  const { isAuthenticated, isHost, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <PageLayout><Landing /></PageLayout>;
  return <Navigate to={isHost ? '/host/dashboard' : '/dashboard'} replace />;
};

/* ── Not Found ── */
const NotFound = () => (
  <PageLayout>
    <div className="empty-state" style={{ minHeight: '60vh' }}>
      <div className="empty-icon">🔍</div>
      <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>404</h2>
      <h3>Page Not Found</h3>
      <p>The page you're looking for doesn't exist.</p>
      <a href="/" className="btn btn-primary mt-md">Go Home</a>
    </div>
  </PageLayout>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>

            {/* ── Public routes ── */}
            <Route path="/" element={<RootRedirect />} />

            <Route
              path="/login"
              element={
                <GuestRoute>
                  <Login />
                </GuestRoute>
              }
            />

            <Route
              path="/register"
              element={
                <GuestRoute>
                  <Register />
                </GuestRoute>
              }
            />

            {/* Problems list is public (read-only) */}
            <Route
              path="/problems"
              element={
                <PageLayout>
                  <ProblemsList />
                </PageLayout>
              }
            />

            {/* Contest list is public */}
            <Route
              path="/contests"
              element={
                <PageLayout>
                  <Contests />
                </PageLayout>
              }
            />

            {/* Contest detail is public */}
            <Route
              path="/contests/:id"
              element={
                <PageLayout>
                  <ContestDetail />
                </PageLayout>
              }
            />

            {/* Global leaderboard is public */}
            <Route
              path="/leaderboard"
              element={
                <PageLayout>
                  <Leaderboard />
                </PageLayout>
              }
            />

            {/* ── Protected (any authenticated user) ── */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <PageLayout>
                    <Profile />
                  </PageLayout>
                </ProtectedRoute>
              }
            />

            {/* Problem detail – wide layout (editor takes full height) */}
            <Route
              path="/problems/:id"
              element={
                <ProtectedRoute>
                  <PageLayout wide>
                    <ProblemDetail />
                  </PageLayout>
                </ProtectedRoute>
              }
            />

            {/* ── User-role routes ── */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredRole="user">
                  <PageLayout>
                    <UserDashboard />
                  </PageLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/submissions"
              element={
                <ProtectedRoute requiredRole="user">
                  <PageLayout>
                    <Submissions />
                  </PageLayout>
                </ProtectedRoute>
              }
            />

            {/* ── Host-role routes ── */}
            <Route
              path="/host/dashboard"
              element={
                <ProtectedRoute requiredRole="host">
                  <PageLayout>
                    <HostDashboard />
                  </PageLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/host/problems"
              element={
                <ProtectedRoute requiredRole="host">
                  <PageLayout>
                    <ManageProblems />
                  </PageLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/host/problems/create"
              element={
                <ProtectedRoute requiredRole="host">
                  <PageLayout>
                    <CreateProblem />
                  </PageLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/host/contests"
              element={
                <ProtectedRoute requiredRole="host">
                  <PageLayout>
                    <ManageContests />
                  </PageLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/host/contests/create"
              element={
                <ProtectedRoute requiredRole="host">
                  <PageLayout>
                    <CreateContest />
                  </PageLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/host/analytics"
              element={
                <ProtectedRoute requiredRole="host">
                  <PageLayout>
                    <AnalyticsDashboard />
                  </PageLayout>
                </ProtectedRoute>
              }
            />

            {/* ── Catch-all ── */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>

        {/* Global toast notifications */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-light)',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
              padding: '0.875rem 1.25rem',
              boxShadow: 'var(--shadow-lg)',
            },
            success: { iconTheme: { primary: '#10b981', secondary: 'var(--bg-card)' } },
            error: { iconTheme: { primary: '#ef4444', secondary: 'var(--bg-card)' } },
          }}
        />
      </Router>
    </AuthProvider>
  );
}

export default App;