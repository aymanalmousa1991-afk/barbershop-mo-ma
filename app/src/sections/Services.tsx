import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Scissors, Sparkles, User, Gift, Check } from 'lucide-react';

interface ServicesProps {
  onNavigate: (page: string) => void;
}

const herenServices = [
  { name: 'Knippen + stylen (wax)', price: '€26', duration: '30 min' },
  { name: 'Knippen + baard stylen of scheren', price: '€37,50', duration: '45 min' },
  { name: 'Senioren 65+ knippen + stylen', price: '€22', duration: '30 min' },
  { name: 'Alles één lengte of kaalscheren', price: '€19', duration: '20 min' },
];

const baardServices = [
  { name: 'Baard stylen of scheren', price: '€20', duration: '15 min' },
  { name: 'Baard stylen + neklijnen bijwerken', price: '€21', duration: '20 min' },
];

const jongeHeren = [
  { name: 'Knippen + stylen t/m 11 jaar', price: '€21', duration: '25 min' },
  { name: 'Knippen + stylen 12-13 jaar', price: '€25', duration: '30 min' },
];

const extras = [
  { name: 'Wassen', price: '€1,50' },
  { name: 'Wenkbrauwen epileren', price: '€12' },
];

const inclusiefItems = [
  'Neushaar verwijderen',
  'Oorhaar branden',
  'Wenkbrauwen bijwerken',
];

export function Services({ onNavigate }: ServicesProps) {
  return (
    <section id="services" className="w-full py-24 bg-[#faf9f7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[#d4af37] text-sm font-semibold tracking-widest uppercase">
            Onze Diensten
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-[#1a1a1a] mt-4 mb-6 logo-font">
            Tarieven
          </h2>
          <p className="text-lg text-stone-600">
            Bij Mo&Ma staan kwaliteit en service voorop. Alle behandelingen 
            worden uitgevoerd met professionele producten.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Heren */}
          <Card className="card-hover border-0 shadow-lg overflow-hidden">
            <div className="bg-[#6b0f1a] p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#d4af37] rounded-full flex items-center justify-center">
                  <Scissors className="h-6 w-6 text-[#6b0f1a]" />
                </div>
                <h3 className="text-2xl font-bold text-white logo-font">Heren</h3>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="space-y-4">
                {herenServices.map((service, index) => (
                  <div 
                    key={index} 
                    className="flex justify-between items-center py-3 border-b border-stone-100 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-[#1a1a1a]">{service.name}</p>
                      <p className="text-sm text-stone-500">{service.duration}</p>
                    </div>
                    <span className="text-xl font-bold text-[#6b0f1a]">{service.price}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Baardverzorging */}
          <Card className="card-hover border-0 shadow-lg overflow-hidden">
            <div className="bg-[#1a1a1a] p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#d4af37] rounded-full flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-[#1a1a1a]" />
                </div>
                <h3 className="text-2xl font-bold text-white logo-font">Baardverzorging</h3>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="space-y-4">
                {baardServices.map((service, index) => (
                  <div 
                    key={index} 
                    className="flex justify-between items-center py-3 border-b border-stone-100 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-[#1a1a1a]">{service.name}</p>
                      <p className="text-sm text-stone-500">{service.duration}</p>
                    </div>
                    <span className="text-xl font-bold text-[#6b0f1a]">{service.price}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-stone-100">
                <h4 className="font-semibold text-[#1a1a1a] mb-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-[#d4af37]" />
                  Jonge Heren
                </h4>
                <div className="space-y-3">
                  {jongeHeren.map((service, index) => (
                    <div 
                      key={index} 
                      className="flex justify-between items-center py-2"
                    >
                      <div>
                        <p className="text-sm text-[#1a1a1a]">{service.name}</p>
                        <p className="text-xs text-stone-500">{service.duration}</p>
                      </div>
                      <span className="font-bold text-[#6b0f1a]">{service.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Extra's & Acties */}
          <Card className="card-hover border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-[#d4af37] to-[#b8941f] p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <Gift className="h-6 w-6 text-[#d4af37]" />
                </div>
                <h3 className="text-2xl font-bold text-white logo-font">Extra's & Acties</h3>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="space-y-4">
                {extras.map((service, index) => (
                  <div 
                    key={index} 
                    className="flex justify-between items-center py-3 border-b border-stone-100 last:border-0"
                  >
                    <p className="font-medium text-[#1a1a1a]">{service.name}</p>
                    <span className="font-bold text-[#6b0f1a]">{service.price}</span>
                  </div>
                ))}
              </div>
              
              {/* Inclusief */}
              <div className="mt-6 p-4 bg-[#faf9f7] rounded-lg">
                <h4 className="font-semibold text-[#1a1a1a] mb-3 text-sm">
                  Inclusief bij alle behandelingen:
                </h4>
                <ul className="space-y-2">
                  {inclusiefItems.map((item, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-stone-600">
                      <Check className="h-4 w-4 text-[#d4af37]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Stempelkaart */}
              <div className="mt-6 p-4 bg-[#6b0f1a] rounded-lg text-white">
                <h4 className="font-bold mb-2 flex items-center gap-2">
                  <Gift className="h-4 w-4 text-[#d4af37]" />
                  Stempelkaart Actie
                </h4>
                <p className="text-sm text-stone-300">
                  Na 10 stempels een haar/baard product naar keuze cadeau!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cadeaubon */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-4 bg-white rounded-full px-8 py-4 shadow-lg">
            <Gift className="h-6 w-6 text-[#d4af37]" />
            <span className="text-[#1a1a1a] font-medium">
              Cadeaubonnen verkrijgbaar bij de kassa
            </span>
            <span className="text-[#d4af37] font-bold">(bedrag naar keuze)</span>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button
            size="lg"
            onClick={() => onNavigate('booking')}
            className="bg-[#6b0f1a] hover:bg-[#8b1523] text-white px-10 py-6 text-lg btn-shine"
          >
            Maak Direct een Afspraak
          </Button>
        </div>
      </div>
    </section>
  );
}
