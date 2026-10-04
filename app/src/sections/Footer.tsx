import { Instagram, Facebook, MessageCircle } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="w-full bg-[#1a1a1a] text-stone-400">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center gap-5">
          {/* Brand */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-1 hover:opacity-90 transition-opacity"
          >
            <span className="logo-font text-xl text-white">Barbershop</span>
            <span className="logo-font text-2xl text-white">Mo</span>
            <span className="logo-font-italic text-lg text-[#d4af37]">&</span>
            <span className="logo-font text-2xl text-white">Ma</span>
          </button>

          {/* Socials */}
          <div className="flex gap-3">
            <a
              href="https://www.instagram.com/barbershopmo_ma/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 bg-[#6b0f1a] rounded-full flex items-center justify-center hover:bg-[#8b1523] transition-colors"
            >
              <Instagram className="h-4 w-4 text-white" />
            </a>
            <a
              href="https://www.facebook.com/people/Barbershop-Mo-Ma/100023827575021/?mibextid=wwXIfr&rdid=tOPPgZTp2hP5Yo7q&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F14iDtCwZp1P%2F%3Fmibextid%3DwwXIfr"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 bg-[#6b0f1a] rounded-full flex items-center justify-center hover:bg-[#8b1523] transition-colors"
            >
              <Facebook className="h-4 w-4 text-white" />
            </a>
            <a
              href="https://wa.me/31685171198"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 bg-[#6b0f1a] rounded-full flex items-center justify-center hover:bg-[#8b1523] transition-colors"
            >
              <MessageCircle className="h-4 w-4 text-white" />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <p className="text-xs text-stone-500">
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

