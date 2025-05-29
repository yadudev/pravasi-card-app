import React from 'react';
import Header from './components/layout/Header';
import HomePage from './pages/HomePage';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <HomePage />
      </main>
    </div>
  );
}

export default App;