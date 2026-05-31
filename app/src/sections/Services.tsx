import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useHomeContent } from '@/hooks/useHomeContent';
import { Button } from '@/components/ui/button';
import { Scissors, Sparkles, User, Gift, Check, Loader2 } from 'lucide-react';

interface ServicesProps {
  onNavigate: (page: string) => void;
}

interface ServiceType {
  key: string;
  name: string;
  price: number;
  duration: number;
  description?: string;
  is_active: number;
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

const inclusiefItems = [
  'Neushaar verwijderen',
  'Oorhaar branden',
  'Wenkbrauwen bijwerken',
];

function formatPrice(price: number): string {
  return '\u20AC ' + price.toFixed(2).replace('.', ',');
}

const categoryConfig: Record<string, { title: string; color: string; icon: typeof Scissors; keys: string[] }> = {
  heren: {
    title: 'Heren',
    color: 'bg-[#6b0f1a]',
    icon: Scissors,
    keys: ['knippen-stylen', 'knippen-baard', 'senioren', 'tondeuse'],
  },
  baard: {
    title: 'Baardverzorging',
    color: 'bg-[#1a1a1a]',
    icon: Sparkles,
    keys: ['baard', 'baard-nek'],
  },
  jong: {
    title: 'Jonge Heren',
    color: 'bg-[#1a1a1a]',
    icon: User,
    keys: ['jong-tm11', 'jong-12-13'],
  },
  extras: {
    title: 'Extra Services',
    color: 'bg-gradient-to-r from-[#d4af37] to-[#b8941f]',
    icon: Gift,
    keys: ['wassen', 'wenkbrauwen'],
  },
};

export function Services({ onNavigate }: ServicesProps) {
  const { content } = useHomeContent();
  const [services, setServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch(`${API_URL}/services`);
        const data = await res.json();
        if (data.success) {
          setServices(data.data.filter((s: ServiceType) => s.is_active));
        }
      } catch (err) {
        console.error('Error fetching services:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const getServicesByKeys = (keys: string[]) => {
    return keys
      .map(key => services.find(s => s.key === key))
      .filter((s): s is ServiceType => s !== undefined);
  };

  const herenList = getServicesByKeys(categoryConfig.heren.keys);
  const baardList = getServicesByKeys(categoryConfig.baard.keys);
  const jongList = getServicesByKeys(categoryConfig.jong.keys);
  const extrasList = getServicesByKeys(categoryConfig.extras.keys);

  // Vang alle diensten die niet in een categorie vallen
  const allConfiguredKeys = Object.values(categoryConfig).flatMap(c => c.keys);
  const unknownServices = services.filter(s => !allConfiguredKeys.includes(s.key));

  if (loading) {
    return (
      <section className="w-full py-24 bg-[#faf9f7]">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#6b0f1a]" />
        </div>
      </section>
    );
  }

  return (
    <section id="services" className="w-full py-24 bg-[#faf9f7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[#d4af37] text-sm font-semibold tracking-widest uppercase">Onze Diensten</span>
          <h2 className="text-4xl sm:text-5xl font-bold text-[#1a1a1a] mt-4 mb-6 logo-font">Tarieven</h2>
          <p className="text-lg text-stone-600">{content.quality_text || "Bij Mo&Ma staan kwaliteit en service voorop."}</p>
        </div>
        <div className="grid lg:grid-cols-4 gap-8">
          {/* HEREN */}
          {herenList.length > 0 && (
            <Card className="card-hover border-0 shadow-lg overflow-hidden">
              <div className="bg-[#6b0f1a] p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#d4af37] rounded-full flex items-center justify-center"><Scissors className="h-6 w-6 text-[#6b0f1a]" /></div>
                  <h3 className="text-2xl font-bold text-white logo-font">Heren</h3>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {herenList.map((service) => (
                    <div key={service.key} className="flex justify-between items-center py-3 border-b border-stone-100 last:border-0">
                      <div>
                        <p className="font-medium text-[#1a1a1a]">{service.name}</p>
                      </div>
                      <span className="text-lg font-bold text-[#6b0f1a] whitespace-nowrap">{formatPrice(service.price)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* BAARDVERZORGING */}
          {baardList.length > 0 && (
            <Card className="card-hover border-0 shadow-lg overflow-hidden">
              <div className="bg-[#1a1a1a] p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#d4af37] rounded-full flex items-center justify-center"><Sparkles className="h-6 w-6 text-[#1a1a1a]" /></div>
                  <h3 className="text-2xl font-bold text-white logo-font">Baardverzorging</h3>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {baardList.map((service) => (
                    <div key={service.key} className="flex justify-between items-center py-3 border-b border-stone-100 last:border-0">
                      <div>
                        <p className="font-medium text-[#1a1a1a]">{service.name}</p>
                      </div>
                      <span className="text-lg font-bold text-[#6b0f1a] whitespace-nowrap">{formatPrice(service.price)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* JONGE HEREN */}
          {jongList.length > 0 && (
            <Card className="card-hover border-0 shadow-lg overflow-hidden">
              <div className="bg-[#1a1a1a] p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#d4af37] rounded-full flex items-center justify-center"><User className="h-6 w-6 text-[#1a1a1a]" /></div>
                  <h3 className="text-2xl font-bold text-white logo-font">Jonge Heren</h3>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {jongList.map((service) => (
                    <div key={service.key} className="flex justify-between items-center py-3 border-b border-stone-100 last:border-0">
                      <div>
                        <p className="font-medium text-[#1a1a1a]">{service.name}</p>
                      </div>
                      <span className="text-lg font-bold text-[#6b0f1a] whitespace-nowrap">{formatPrice(service.price)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* EXTRA SERVICES */}
          {extrasList.length > 0 && (
            <Card className="card-hover border-0 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-[#d4af37] to-[#b8941f] p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center"><Gift className="h-6 w-6 text-[#d4af37]" /></div>
                  <h3 className="text-2xl font-bold text-white logo-font">Extra Services</h3>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {extrasList.map((service) => (
                    <div key={service.key} className="flex justify-between items-center py-3 border-b border-stone-100 last:border-0">
                      <p className="font-medium text-[#1a1a1a]">{service.name}</p>
                      <span className="text-lg font-bold text-[#6b0f1a] whitespace-nowrap">{formatPrice(service.price)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-[#faf9f7] rounded-lg">
                  <h4 className="font-semibold text-[#1a1a1a] mb-3 text-sm">Inclusief bij alle behandelingen:</h4>
                  <ul className="space-y-2">
                    {inclusiefItems.map((item, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-stone-600">
                        <Check className="h-4 w-4 text-[#d4af37]" />{item}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ONBEKENDE / OVERIGE DIENSTEN */}
          {unknownServices.length > 0 && (
            <Card className="card-hover border-0 shadow-lg overflow-hidden">
              <div className="bg-stone-700 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#d4af37] rounded-full flex items-center justify-center"><Gift className="h-6 w-6 text-stone-700" /></div>
                  <h3 className="text-2xl font-bold text-white logo-font">Overige</h3>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {unknownServices.map((service) => (
                    <div key={service.key} className="flex justify-between items-center py-3 border-b border-stone-100 last:border-0">
                      <div>
                        <p className="font-medium text-[#1a1a1a]">{service.name}</p>
                      </div>
                      <span className="text-lg font-bold text-[#6b0f1a] whitespace-nowrap">{formatPrice(service.price)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* EXTRA'S & ACTIES KAART */}
          <Card className="card-hover border-0 shadow-lg overflow-hidden">
            <div className="bg-[#6b0f1a] p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#d4af37] rounded-full flex items-center justify-center"><Gift className="h-6 w-6 text-[#6b0f1a]" /></div>
                <h3 className="text-2xl font-bold text-white logo-font">Extra's & Acties</h3>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="p-4 bg-[#faf9f7] rounded-lg">
                <h4 className="font-bold mb-2 flex items-center gap-2 text-[#6b0f1a]">
                  <Gift className="h-4 w-4" />
                  Stempelkaart &mdash; Vaste Actie
                </h4>
                <p className="text-sm text-stone-600">Na 10 stempels krijgt u een haar/baard product naar keuze cadeau!</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-4 bg-white rounded-full px-8 py-4 shadow-lg">
            <Gift className="h-6 w-6 text-[#d4af37]" />
            <span className="text-[#1a1a1a] font-medium">Cadeaubonnen verkrijgbaar bij de kassa</span>
            <span className="text-[#d4af37] font-bold">(bedrag naar keuze)</span>
          </div>
        </div>
        <div className="text-center mt-12">
          <Button size="lg" onClick={() => onNavigate('booking')} className="bg-[#6b0f1a] hover:bg-[#8b1523] text-white px-10 py-6 text-lg btn-shine">
            Maak Direct een Afspraak
          </Button>
        </div>
      </div>
    </section>
  );
}
