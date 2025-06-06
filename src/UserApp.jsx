import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
// Import other user pages here

function UserApp() {
  const navigate = useNavigate();
  
  const handleNavigate = (route) => {
    if (route === 'login') {
      navigate('/login');
    } else if (route === 'home') {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={handleNavigate} />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          {/* Add more user routes here */}
          <Route path="/register" element={<div>Register Page</div>} />
          <Route path="/profile" element={<div>Profile Page</div>} />
          <Route path="/shops" element={<div>Shops Page</div>} />
          <Route path="/about" element={<div>About Page</div>} />
          <Route path="/contact" element={<div>Contact Page</div>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default UserApp;