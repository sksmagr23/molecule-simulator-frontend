import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Landing from './pages/Landing';
import Simulator from './pages/Simulator';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/simulator" element={<Simulator />} />
      </Routes>
    </Router>
  );
};

export default App;
