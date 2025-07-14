import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import UserApp from './UserApp';
import AdminApp from './AdminApp';

function App() {
  return (
    <Router>
      <Routes>
        {/* Admin routes - no header/footer */}
        <Route path="/admin/*" element={<AdminApp />} />

        {/* User routes - with header/footer */}
        <Route path="/*" element={<UserApp />} />
      </Routes>

      {/* Toast notifications - works across entire app */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          // Define default options
          className: '',
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            fontSize: '14px',
            borderRadius: '8px',
            padding: '12px 16px',
            maxWidth: '500px',
          },
          
          // Default options for specific types
          success: {
            duration: 3000,
            style: {
              background: '#059669',
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#059669',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: '#dc2626',
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#dc2626',
            },
          },
          loading: {
            duration: Infinity,
            style: {
              background: '#3b82f6',
              color: '#fff',
            },
          },
        }}
      />
    </Router>
  );
}

export default App;