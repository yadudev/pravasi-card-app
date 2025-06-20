import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import SearchResultsPage from './pages/SearchResultsPage';
import UserProtectedRoute from './components/UserProtectedRoute';
import { useAuth } from './constants/AuthContext';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="space-x-4">
          <button
            onClick={() => navigate('/')}
            className="bg-[#3D3C96] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#2D2C76] transition-colors"
          >
            Go Home
          </button>
          <button
            onClick={() => navigate(-1)}
            className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

const RootPage = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3D3C96] mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <SearchPage /> : <HomePage />;
};

function UserApp() {
  const navigate = useNavigate();
  const location = useLocation();

  // Enhanced navigation handler
  const handleNavigate = (route) => {
    try {
      switch (route) {
        case 'home':
        case '':
          navigate('/');
          break;
        case 'search':
          navigate('/');
          break;
        default:
          // Handle routes that already have leading slash
          if (route.startsWith('/')) {
            navigate(route);
          } else {
            navigate(`/${route}`);
          }
      }
    } catch (error) {
      console.error('Navigation error:', error);
      navigate('/');
    }
  };

  // Scroll to top when route changes (optional but good UX)
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onNavigate={handleNavigate} />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<RootPage />} />

          <Route
            path="/search"
            element={
              <UserProtectedRoute>
                <SearchPage />
              </UserProtectedRoute>
            }
          />

          <Route
            path="/search-results"
            element={
              <UserProtectedRoute>
                <SearchResultsPage />
              </UserProtectedRoute>
            }
          />

          <Route path="/welcome" element={<HomePage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default UserApp;
