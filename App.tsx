import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
const Home = React.lazy(() => import('./pages/Home'));
const Auth = React.lazy(() => import('./pages/Auth'));
const AdminEvents = React.lazy(() => import('./pages/AdminEvents'));
const TestChat = React.lazy(() => import('./pages/TestChat'));

function App() {
   return (
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
         <React.Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
               <div className="animate-pulse flex flex-col items-center">
                  <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="font-display font-bold tracking-widest text-sm text-brand-primary">CARREGANDO METABAILE...</p>
               </div>
            </div>
         }>
            <Routes>
               <Route path="/" element={<Home />} />
               <Route path="/auth" element={<Auth />} />
               <Route path="/test-chat" element={<TestChat />} />
               <Route element={<ProtectedRoute allowedEmail="andinho@hotmail.com" />}>
                  <Route path="/admin" element={<AdminEvents />} />
               </Route>
            </Routes>
         </React.Suspense>
      </Router>
   );
}

export default App;