import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

// 1. Lazy Import pages
const Login = lazy(() => import('./pages/Login'));
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Orders = lazy(() => import('./pages/Orders'));
const Feedback = lazy(() => import('./pages/Feedback'));
const Support = lazy(() => import('./pages/Support'));

// 2. Create a Loading Spinner Component
const PageLoader = () => (
  <div className="h-screen w-full flex items-center justify-center bg-gray-50">
    <Loader2 className="animate-spin text-blue-600" size={40} />
  </div>
);

function App() {
  return (
    <>
      <Toaster position="top-right" />
      {/* 3. Wrap Routes in Suspense */}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/support" element={<Support />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

export default App;