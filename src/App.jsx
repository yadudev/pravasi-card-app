import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UserApp from './UserApp';
import AdminApp from './AdminApp';
import PrivilegeCard from './components/PrivilegeCard';

function App() {
  return (
    // <Router>
    //   <Routes>
    //     {/* Admin routes - no header/footer */}
    //     <Route path="/admin/*" element={<AdminApp />} />

    //     {/* User routes - with header/footer */}
    //     <Route path="/*" element={<UserApp />} />
    //   </Routes>
    // </Router>
    <>
      <PrivilegeCard />
    </>
  );
}

export default App;
