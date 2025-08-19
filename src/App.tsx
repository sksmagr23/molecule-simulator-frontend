import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { FileProvider } from './contexts/FileContext';
import ProtectedRoute from './components/ProtectedRoute';
import Auth from './pages/Auth';
import Landing from './pages/Landing';
import Simulation from './pages/Simulation';

const App = () => {
  return (
    <AuthProvider>
      <FileProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route 
              path="/landing" 
              element={
                <ProtectedRoute>
                  <Landing />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/simulation" 
              element={
                <ProtectedRoute>
                  <Simulation />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Router>
      </FileProvider>  
    </AuthProvider>
  );
};

export default App;
