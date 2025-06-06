// AdminApp.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function AdminApp() {
  return (
    <div className="min-h-screen">
      <Routes>
        {/* Admin Login - Public */}
        <Route path="/login" element={<AdminLogin />} />
        
        {/* Admin Dashboard - Protected */}
        <Route 
          path="dashboard" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Redirect /admin to /admin/login */}
        <Route path="/" element={<Navigate to="/admin/login" replace />} />
        
        {/* 404 for admin routes */}
        <Route path="*" element={<AdminNotFound />} />
      </Routes>
    </div>
  );
}

// Simple 404 component for admin routes
function AdminNotFound() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-gray-600 mb-4">Admin page not found</p>
        <a 
          href="/admin/login" 
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Return to Admin Login
        </a>
      </div>
    </div>
  );
}

export default AdminApp;