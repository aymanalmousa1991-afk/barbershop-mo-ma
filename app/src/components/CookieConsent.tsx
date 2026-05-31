import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Cookie, Shield, Info } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'moma_cookie_consent';

interface CookieConsentProps {
  onNavigate?: (page: string) => void;
}

export function CookieConsent({ onNavigate }: CookieConsentProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [acceptedTypes, setAcceptedTypes] = useState<Record<string, boolean>>({
    necessary: true,  // Altijd aan
    functional: true,
    analytics: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Na een korte vertraging tonen, tenzij al ingesteld
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
    try {
      const parsed = JSON.parse(consent);
      setAcceptedTypes(prev => ({ ...prev, ...parsed }));
    } catch {
      // ignored
    }
  }, []);

  const handleAcceptAll = () => {
    const all = { necessary: true, functional: true, analytics: true };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(all));
    setAcceptedTypes(all);
    setShowBanner(false);
  };

  const handleAcceptSelected = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(acceptedTypes));
    setShowBanner(false);
  };

  const handleAcceptNecessary = () => {
    const minimal = { necessary: true, functional: false, analytics: false };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(minimal));
    setAcceptedTypes(minimal);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4" role="dialog" aria-label="Cookie instellingen" aria-modal="false">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex w-12 h-12 bg-[#6b0f1a]/10 rounded-full items-center justify-center flex-shrink-0">
              <Cookie className="h-6 w-6 text-[#6b0f1a]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-bold text-lg text-[#1a1a1a]">Cookie-instellingen</h3>
                <button
                  onClick={() => setShowBanner(false)}
                  className="text-stone-400 hover:text-stone-600 p-1 -m-1"
                  aria-label="Sluiten"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-stone-600 mt-2">
                Barbershop Mo &amp; Ma gebruikt cookies om de website goed te laten werken, 
                de prestaties te analyseren en je ervaring te verbeteren.
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-[#6b0f1a] underline ml-1 hover:text-[#8b1523] text-sm"
                >
                  {showDetails ? 'Minder tonen' : 'Meer informatie'}
                </button>
              </p>

              {showDetails && (
                <div className="mt-4 space-y-3 border-t pt-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={acceptedTypes.necessary} disabled
                      className="mt-1 h-4 w-4 rounded border-stone-300 text-[#6b0f1a] focus:ring-[#6b0f1a]" />
                    <div>
                      <span className="font-medium text-sm text-[#1a1a1a]">Noodzakelijk (altijd actief)</span>
                      <p className="text-xs text-stone-500">Voor basisfunctionaliteit zoals inloggen en beveiliging.</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={acceptedTypes.functional}
                      onChange={(e) => setAcceptedTypes(prev => ({ ...prev, functional: e.target.checked }))}
                      className="mt-1 h-4 w-4 rounded border-stone-300 text-[#6b0f1a] focus:ring-[#6b0f1a]" />
                    <div>
                      <span className="font-medium text-sm text-[#1a1a1a]">Functioneel</span>
                      <p className="text-xs text-stone-500">Onthoudt je voorkeuren voor een betere ervaring.</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={acceptedTypes.analytics}
                      onChange={(e) => setAcceptedTypes(prev => ({ ...prev, analytics: e.target.checked }))}
                      className="mt-1 h-4 w-4 rounded border-stone-300 text-[#6b0f1a] focus:ring-[#6b0f1a]" />
                    <div>
                      <span className="font-medium text-sm text-[#1a1a1a]">Analytisch</span>
                      <p className="text-xs text-stone-500">Anonieme data om de website te verbeteren.</p>
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="bg-stone-50 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2 border-t">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <Info className="h-3.5 w-3.5" />
            <span>
              <button onClick={() => onNavigate?.('privacy')} className="underline hover:text-[#6b0f1a]">Privacybeleid</button>
              {' '}&middot;{' '}
              <button onClick={() => onNavigate?.('privacy')} className="underline hover:text-[#6b0f1a]">Cookiebeleid</button>
            </span>
          </div>
          <div className="flex gap-2">
            {showDetails && (
              <Button variant="outline" size="sm" onClick={handleAcceptSelected}
                className="border-stone-300 text-stone-700 text-xs">
                Selectie opslaan
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleAcceptNecessary}
              className="text-stone-600 text-xs">
              Alleen noodzakelijk
            </Button>
            <Button size="sm" onClick={handleAcceptAll}
              className="bg-[#6b0f1a] hover:bg-[#8b1523] text-white text-xs px-4">
              Alles accepteren
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
