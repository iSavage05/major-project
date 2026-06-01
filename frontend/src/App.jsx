import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Suppliers from './pages/Suppliers';
import ARViewer from './pages/ARViewer';
import VastuAudit from './pages/VastuAudit';

const isUserAuthenticated = () => Boolean(localStorage.getItem('token'));

const ProtectedRoute = ({ children }) => (
  isUserAuthenticated() ? children : <Navigate to="/login" replace />
);

const PublicOnlyRoute = ({ children }) => (
  isUserAuthenticated() ? <Navigate to="/dashboard" replace /> : children
);

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />

          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
               <Dashboard />
              </ProtectedRoute>             
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <ProjectDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/suppliers"
            element={
              <ProtectedRoute>
                <Suppliers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ar-viewer"
            element={
              <ProtectedRoute>
                <ARViewer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vastu-audit"
            element={
              <ProtectedRoute>
                <VastuAudit />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
