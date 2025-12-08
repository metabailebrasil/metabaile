import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Auth from './pages/Auth';
import AdminEvents from './pages/AdminEvents';

function App() {
   return (
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
         <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<AdminEvents />} />
         </Routes>
      </Router>
   );
}

export default App;