import { MapPin, Phone, Mail, Clock, Instagram, Facebook, MessageCircle, Award } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="w-full bg-[#1a1a1a] text-stone-400">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-6">
            <button 
              onClick={() => onNavigate('home')}
              className="flex items-center gap-1 hover:opacity-90 transition-opacity"
            >
              <span className="logo-font text-4xl text-white">Mo</span>
              <span className="logo-font-italic text-3xl text-[#d4af37]">&</span>
              <span className="logo-font text-4xl text-white">Ma</span>
            </button>
            <p className="text-sm leading-relaxed">
              Dé mannenkapper van Edam-Volendam. In onze barbershop in het 
              mooie centrum van Volendam kunnen mannen van jong tot oud 
              terecht voor het knippen en stylen van hun haar.
            </p>
            <div className="flex gap-3">
              <a 
                href="https://www.instagram.com/barbershopmo.ma/" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-[#6b0f1a] rounded-full flex items-center justify-center hover:bg-[#8b1523] transition-colors"
              >
                <Instagram className="h-5 w-5 text-white" />
              </a>
              <a 
                href="https://www.facebook.com/barbershopmoma" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-[#6b0f1a] rounded-full flex items-center justify-center hover:bg-[#8b1523] transition-colors"
              >
                <Facebook className="h-5 w-5 text-white" />
              </a>
              <a 
                href="https://wa.me/31685171198" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-[#6b0f1a] rounded-full flex items-center justify-center hover:bg-[#8b1523] transition-colors"
              >
                <MessageCircle className="h-5 w-5 text-white" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
              <Award className="h-5 w-5 text-[#d4af37]" />
              Snelle Links
            </h3>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => onNavigate('home')}
                  className="hover:text-[#d4af37] transition-colors"
                >
                  Home
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('services')}
                  className="hover:text-[#d4af37] transition-colors"
                >
                  Tarieven
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('booking')}
                  className="hover:text-[#d4af37] transition-colors"
                >
                  Afspraak Maken
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('admin')}
                  className="hover:text-[#d4af37] transition-colors"
                >
                  Admin
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#d4af37]" />
              Contact
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-[#6b0f1a] flex-shrink-0 mt-0.5" />
                <span className="text-sm">
                  W. J. Tuijnstraat 14A<br />
                  1131 ZJ Volendam
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-[#6b0f1a] flex-shrink-0" />
                <a href="tel:0685171198" className="text-sm hover:text-[#d4af37]">
                  06-85171198
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-[#6b0f1a] flex-shrink-0" />
                <a href="mailto:info@barbershopmo-ma.nl" className="text-sm hover:text-[#d4af37]">
                  info@barbershopmo-ma.nl
                </a>
              </li>
            </ul>
          </div>

          {/* Opening Hours */}
          <div>
            <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#d4af37]" />
              Openingstijden
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span>Maandag</span>
                <span className="text-white">10:00 - 18:00</span>
              </li>
              <li className="flex justify-between">
                <span>Dinsdag - Vrijdag</span>
                <span className="text-white">09:00 - 18:00</span>
              </li>
              <li className="flex justify-between">
                <span>Zaterdag</span>
                <span className="text-white">08:00 - 17:00</span>
              </li>
              <li className="flex justify-between">
                <span>Zondag</span>
                <span className="text-stone-600">Gesloten</span>
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t border-stone-800">
              <p className="text-xs text-stone-500">
                Ma, Di, Vr, Za: Op afspraak<br />
                Wo, Do: Inloop
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-stone-500">
              &copy; {new Date().getFullYear()} Barbershop Mo&Ma. Alle rechten voorbehouden.
            </p>
            <p className="text-xs text-stone-600">
              KvK: 83317619
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
