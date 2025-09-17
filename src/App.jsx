
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/loginPage.jsx';
import PatientList from './pages/PatientList.jsx';
import Odontograma from './components/Odontograma.jsx';
import './App.css';

function ProtectedRoute({ isAuth, children }) {
  return isAuth ? children : <Navigate to="/login" replace />;
}

function App() {
  const [isAuth, setIsAuth] = useState(() => {
    // Mantener login en localStorage para persistencia básica
    return localStorage.getItem('isAuth') === 'true';
  });

  const handleLogin = () => {
    setIsAuth(true);
    localStorage.setItem('isAuth', 'true');
  };

  const handleLogout = () => {
    setIsAuth(false);
    localStorage.removeItem('isAuth');
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route
          path="/"
          element={
            <ProtectedRoute isAuth={isAuth}>
              <PatientList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/odontograma/:id"
          element={
            <ProtectedRoute isAuth={isAuth}>
              <Odontograma />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to={isAuth ? "/" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
