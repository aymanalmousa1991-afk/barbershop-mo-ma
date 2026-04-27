import { useState } from 'react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/sections/Navbar';
import { Hero } from '@/sections/Hero';
import { Services } from '@/sections/Services';
import { Booking } from '@/sections/Booking';
import { AdminLogin } from '@/sections/AdminLogin';
import { AdminDashboard } from '@/sections/AdminDashboard';
import { Footer } from '@/sections/Footer';
import { Toaster } from '@/components/ui/sonner';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('home');
  const { isAuthenticated } = useAuth();

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <>
            <Hero onNavigate={handleNavigate} />
            <Services onNavigate={handleNavigate} />
          </>
        );
      case 'services':
        return <Services onNavigate={handleNavigate} />;
      case 'booking':
        return <Booking />;
      case 'admin':
        if (isAuthenticated) {
          return <AdminDashboard onNavigate={handleNavigate} />;
        }
        return <AdminLogin onNavigate={handleNavigate} />;
      case 'admin-dashboard':
        if (isAuthenticated) {
          return <AdminDashboard onNavigate={handleNavigate} />;
        }
        return <AdminLogin onNavigate={handleNavigate} />;
      default:
        return (
          <>
            <Hero onNavigate={handleNavigate} />
            <Services onNavigate={handleNavigate} />
          </>
        );
    }
  };

  const showFooter = !['admin', 'admin-dashboard'].includes(currentPage);

  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col">
      <Navbar onNavigate={handleNavigate} currentPage={currentPage} />
      <main className="flex-1">
        {renderPage()}
      </main>
      {showFooter && <Footer onNavigate={handleNavigate} />}
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
