import { Button } from '@/components/ui/button';
import { Scissors, Award, MapPin, Calendar } from 'lucide-react';

interface AboutPageProps {
  onNavigate: (page: string) => void;
}

export function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <section className="w-full py-24 bg-[#faf9f7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[#d4af37] text-sm font-semibold tracking-widest uppercase">
            Over Ons
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-[#1a1a1a] mt-4 mb-6 logo-font">
            Barbershop <span className="text-[#6b0f1a]">Mo</span>
            <span className="logo-font-italic text-[#d4af37]">&</span>
            <span className="text-[#6b0f1a]">Ma</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <div className="relative">
            <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1585747861115-1e790f470f14?w=800&auto=format&fit=crop&q=80"
                alt="Barbershop Mo&Ma interieur"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-[#6b0f1a] rounded-2xl p-6 shadow-xl hidden sm:block">
              <div className="text-white text-center">
                <div className="text-3xl font-bold">10+</div>
                <div className="text-sm text-[#d4af37]">Jaar ervaring</div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-6 text-stone-700 leading-relaxed">
              <p className="text-lg">
                Welkom bij Barbershop Mo &amp; Ma, dé plek in Volendam voor de beste herenkapsels 
                en baardverzorging. Wij, Mo en Ma, zijn gepassioneerde barbiers met jarenlange 
                ervaring in het vak. Onze missie is om elke klant een unieke en persoonlijke 
                ervaring te bieden, waarbij kwaliteit en klanttevredenheid voorop staan.
              </p>
              <p className="text-lg">
                Bij Barbershop Mo &amp; Ma geloven we in het creëren van een vriendelijke sfeer 
                waar iedereen zich welkom voelt en waar altijd een bakje koffie voor u klaar staat. 
                Of je nu komt voor een klassieke scheerbeurt, een trendy kapsel of een uitgebreide 
                baardbehandeling, wij zorgen ervoor dat je er altijd op je best uitziet.
              </p>
              <p className="text-lg">
                Kom langs bij Barbershop Mo &amp; Ma en ervaar zelf waarom wij de favoriete 
                barbershop van Edam-Volendam zijn en laat ons je helpen om je look naar een 
                hoger niveau te tillen.
              </p>
            </div>

            {/* USP's */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-5 shadow-lg border border-stone-100">
                <Scissors className="h-8 w-8 text-[#6b0f1a] mb-3" />
                <h3 className="font-bold text-[#1a1a1a]">Vakkundig</h3>
                <p className="text-sm text-stone-500">Gediplomeerde barbiers</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-lg border border-stone-100">
                <Award className="h-8 w-8 text-[#d4af37] mb-3" />
                <h3 className="font-bold text-[#1a1a1a]">Kwaliteit</h3>
                <p className="text-sm text-stone-500">Premium producten</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-lg border border-stone-100">
                <MapPin className="h-8 w-8 text-[#6b0f1a] mb-3" />
                <h3 className="font-bold text-[#1a1a1a]">Centraal</h3>
                <p className="text-sm text-stone-500">In hartje Volendam</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-lg border border-stone-100">
                <Calendar className="h-8 w-8 text-[#d4af37] mb-3" />
                <h3 className="font-bold text-[#1a1a1a]">Flexibel</h3>
                <p className="text-sm text-stone-500">Afspraak of inloop</p>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-wrap gap-4 pt-4">
              <Button
                size="lg"
                onClick={() => onNavigate('booking')}
                className="bg-[#6b0f1a] hover:bg-[#8b1523] text-white px-8 py-6 text-lg btn-shine"
              >
                Maak Afspraak
              </Button>
              <Button
                size="lg"
                onClick={() => onNavigate('services')}
                variant="outline"
                className="border-[#6b0f1a] text-[#6b0f1a] px-8 py-6 text-lg"
              >
                Bekijk Tarieven
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
