/**
 * ==============================================================================
 * Application Root Component
 * ==============================================================================
 * Renders either the AppDashboard (for authenticated users) or the Landing Page
 * with ThemeProvider, AuthProvider, and modal controllers.
 * ==============================================================================
 */

import React from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import AuthModal from './components/auth/AuthModal';
import AppDashboard from './components/dashboard/AppDashboard';
import HeroSection from './components/HeroSection';
import ProblemSection from './components/ProblemSection';
import HowItWorksSection from './components/HowItWorksSection';
import ProductShowcaseSection from './components/ProductShowcaseSection';
import ProvidersSection from './components/ProvidersSection';
import WaitlistSection from './components/WaitlistSection';
import Footer from './components/Footer';

function MainRouter() {
  const { isAuthenticated, loading } = useAuth();

  // Instantaneous rendering without artificial loading spinners
  if (loading) {
    return null;
  }

  // If user is authenticated, render the Dashboard view
  if (isAuthenticated) {
    return <AppDashboard />;
  }

  // Otherwise, show the Public Landing Page
  return (
    <div className="min-h-screen bg-[#F2F3F5] text-ink font-sans antialiased selection:bg-brand/15 selection:text-brand-dark">
      {/* Global Auth Modal */}
      <AuthModal />

      {/* Landing Page Sections */}
      <main>
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <ProductShowcaseSection />
        <ProvidersSection />
        <WaitlistSection />
      </main>
      
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainRouter />
      </AuthProvider>
    </ThemeProvider>
  );
}
