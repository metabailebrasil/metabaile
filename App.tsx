import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Auth from './pages/Auth';

function App() {
   return (
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
         <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
         </Routes>
      </Router>
   );
}

export default App;