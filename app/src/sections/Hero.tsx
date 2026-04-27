import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, Scissors, Award, Users } from 'lucide-react';

interface HeroProps {
  onNavigate: (page: string) => void;
}

export function Hero({ onNavigate }: HeroProps) {
  return (
    <section className="relative w-full min-h-[700px] flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=1920&auto=format&fit=crop&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a]/90 via-[#1a1a1a]/70 to-transparent" />
        <div className="absolute inset-0 hero-pattern" />
      </div>
      
      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8 text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#d4af37]/20 border border-[#d4af37]/40 rounded-full">
              <Award className="h-4 w-4 text-[#d4af37]" />
              <span className="text-[#d4af37] text-sm font-medium tracking-wide">
                Dé mannenkapper van Edam-Volendam
              </span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="logo-font-italic text-[#d4af37]">Welkom bij</span>
              <br />
              <span className="logo-font">Barbershop</span>
              <br />
              <span className="logo-font">
                <span className="text-white">Mo</span>
                <span className="logo-font-italic text-[#d4af37]">&</span>
                <span className="text-white">Ma</span>
              </span>
            </h1>
            
            <p className="text-lg text-stone-300 max-w-lg leading-relaxed">
              In onze barbershop in het mooie centrum van Volendam kunnen mannen 
              van jong tot oud terecht voor het knippen en stylen van hun haar. 
              Ook voor uw baard en snor bent u bij ons aan het juiste adres.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                onClick={() => onNavigate('booking')}
                className="bg-[#d4af37] hover:bg-[#b8941f] text-[#1a1a1a] font-semibold px-8 py-6 text-lg btn-shine"
              >
                <Calendar className="h-5 w-5 mr-2" />
                Maak Afspraak
              </Button>
              <Button
                size="lg"
                onClick={() => onNavigate('services')}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 px-8 py-6 text-lg backdrop-blur-sm"
              >
                Bekijk Tarieven
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
            
            {/* Info Cards */}
            <div className="grid grid-cols-3 gap-4 pt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <Scissors className="h-6 w-6 text-[#d4af37] mb-2" />
                <div className="text-2xl font-bold">10+</div>
                <div className="text-sm text-stone-400">Jaar ervaring</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <Users className="h-6 w-6 text-[#d4af37] mb-2" />
                <div className="text-2xl font-bold">5000+</div>
                <div className="text-sm text-stone-400">Tevreden klanten</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <Award className="h-6 w-6 text-[#d4af37] mb-2" />
                <div className="text-2xl font-bold">4.9</div>
                <div className="text-sm text-stone-400">Beoordeling</div>
              </div>
            </div>
          </div>
          
          {/* Right side - Opening hours card */}
          <div className="hidden lg:block">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 max-w-md ml-auto">
              <h3 className="text-2xl font-bold text-white mb-6 logo-font">
                Openingstijden
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-stone-300">Maandag</span>
                  <span className="text-white font-medium">10:00 - 18:00</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-stone-300">Dinsdag - Vrijdag</span>
                  <span className="text-white font-medium">09:00 - 18:00</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-stone-300">Zaterdag</span>
                  <span className="text-white font-medium">08:00 - 17:00</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-stone-300">Zondag</span>
                  <span className="text-stone-500">Gesloten</span>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-sm text-stone-400">
                  <span className="text-[#d4af37]">Ma, Di, Vr, Za:</span> Op afspraak
                </p>
                <p className="text-sm text-stone-400 mt-1">
                  <span className="text-[#d4af37]">Wo, Do:</span> Inloop
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
