import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, Phone, Clock, MapPin } from 'lucide-react';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export function Navbar({ onNavigate, currentPage }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'services', label: 'Tarieven' },
    { id: 'booking', label: 'Afspraak' },
    { id: 'admin', label: 'Admin' },
  ];

  return (
    <>
      {/* Top Bar */}
      <div className="bg-[#6b0f1a] text-white py-2 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#d4af37]" />
              W. J. Tuijnstraat 14A, Volendam
            </span>
            <span className="hidden sm:flex items-center gap-2">
              <Phone className="h-4 w-4 text-[#d4af37]" />
              06-85171198
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#d4af37]" />
            <span className="hidden sm:inline">Ma-Za: 08:00-18:00</span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav 
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/95 backdrop-blur-md shadow-lg' 
            : 'bg-white'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <button 
              onClick={() => onNavigate('home')}
              className="flex items-center gap-1 hover:opacity-90 transition-opacity"
            >
              <span className="logo-font text-3xl text-[#6b0f1a]">Mo</span>
              <span className="logo-font-italic text-2xl text-[#d4af37]">&</span>
              <span className="logo-font text-3xl text-[#6b0f1a]">Ma</span>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`relative text-sm font-medium tracking-wide uppercase transition-colors ${
                    currentPage === item.id
                      ? 'text-[#6b0f1a]'
                      : 'text-stone-600 hover:text-[#6b0f1a]'
                  }`}
                >
                  {item.label}
                  {currentPage === item.id && (
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-[#d4af37]" />
                  )}
                </button>
              ))}
              <Button
                onClick={() => onNavigate('booking')}
                className="bg-[#6b0f1a] hover:bg-[#8b1523] text-white px-6 btn-shine"
              >
                Maak Afspraak
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 text-[#6b0f1a]" />
              ) : (
                <Menu className="h-6 w-6 text-[#6b0f1a]" />
              )}
            </Button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-stone-200 bg-white">
              <div className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setIsMenuOpen(false);
                    }}
                    className={`px-4 py-3 text-sm font-medium text-left transition-colors ${
                      currentPage === item.id
                        ? 'bg-[#6b0f1a]/10 text-[#6b0f1a]'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
                <Button
                  onClick={() => {
                    onNavigate('booking');
                    setIsMenuOpen(false);
                  }}
                  className="mt-2 bg-[#6b0f1a] hover:bg-[#8b1523] text-white"
                >
                  Maak Afspraak
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
