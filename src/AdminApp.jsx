import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function AdminApp() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        {/* Admin Login - Public */}
        <Route path="/login" element={<AdminLogin />} />

        {/* Admin Dashboard - Protected */}
        <Route
          path="/dashboard"
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
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-400 mb-4">404</h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Admin Page Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            The admin page you're looking for doesn't exist.
          </p>
        </div>
        <div className="space-x-4">
          <a
            href="/admin/login"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Return to Admin Login
          </a>
          <a
            href="/admin/dashboard"
            className="inline-block border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

export default AdminApp;
