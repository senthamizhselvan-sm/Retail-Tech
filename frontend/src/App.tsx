import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Generate from './pages/Generate';
import Editor from './pages/Editor';
import Favorites from './pages/Favorites';
import Profile from './pages/Profile';
import Admin from './pages/Admin';

// Business Operating System Pages
import BusinessHome from './pages/BusinessHome';
import BusinessProfile from './pages/BusinessProfile';
import Inventory from './pages/Inventory';
import DailyAssistant from './pages/DailyAssistant';
import OfferPlanning from './pages/OfferPlanning';
import CustomerCommunication from './pages/CustomerCommunication';
import CompetitorAwareness from './pages/CompetitorAwareness';
import BrandMemory from './pages/BrandMemory';
import SalesReflection from './pages/SalesReflection';
import VendorAssistant from './pages/VendorAssistant';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div style={{ minHeight: '100vh' }}>
            <Navbar />
            <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Business Operating System Routes */}
            <Route
              path="/business-home"
              element={
                <ProtectedRoute>
                  <BusinessHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business-profile"
              element={
                <ProtectedRoute>
                  <BusinessProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory"
              element={
                <ProtectedRoute>
                  <Inventory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/daily-assistant"
              element={
                <ProtectedRoute>
                  <DailyAssistant />
                </ProtectedRoute>
              }
            />
            <Route
              path="/offer-planning"
              element={
                <ProtectedRoute>
                  <OfferPlanning />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer-communication"
              element={
                <ProtectedRoute>
                  <CustomerCommunication />
                </ProtectedRoute>
              }
            />
            <Route
              path="/competitor-awareness"
              element={
                <ProtectedRoute>
                  <CompetitorAwareness />
                </ProtectedRoute>
              }
            />
            <Route
              path="/brand-memory"
              element={
                <ProtectedRoute>
                  <BrandMemory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales-reflection"
              element={
                <ProtectedRoute>
                  <SalesReflection />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor-assistant"
              element={
                <ProtectedRoute>
                  <VendorAssistant />
                </ProtectedRoute>
              }
            />
            
            {/* Legacy Routes (now Marketing Tools) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/generate"
              element={
                <ProtectedRoute>
                  <Generate />
                </ProtectedRoute>
              }
            />
            <Route
              path="/editor"
              element={
                <ProtectedRoute>
                  <Editor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/favorites"
              element={
                <ProtectedRoute>
                  <Favorites />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <Admin />
                </ProtectedRoute>
              }
            />
          </Routes>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  </ThemeProvider>
  );
};

export default App;
