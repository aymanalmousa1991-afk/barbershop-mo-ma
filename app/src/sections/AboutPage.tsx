import { Button } from '@/components/ui/button';
import { useHomeContent } from '@/hooks/useHomeContent';

interface AboutPageProps {
  onNavigate: (page: string) => void;
}

export function AboutPage({ onNavigate }: AboutPageProps) {
  const { content } = useHomeContent();
  return (
    <section className="w-full py-24 bg-[#faf9f7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[#d4af37] text-sm font-semibold tracking-widest uppercase">Over Ons</span>
          <h2 className="text-4xl sm:text-5xl font-bold text-[#1a1a1a] mt-4 mb-6 logo-font">
            Barbershop <span className="text-[#6b0f1a]">Mo</span>
            <span className="logo-font-italic text-[#d4af37]">&amp;</span>
            <span className="text-[#6b0f1a]">Ma</span>
          </h2>
        </div>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="relative">
            <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&auto=format&fit=crop&q=80"
                alt="Barbershop Mo & Ma - Kapperszaak in Volendam"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.className = 'aspect-square rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-[#6b0f1a] to-[#1a1a1a] flex items-center justify-center p-8';
                    parent.innerHTML = '<div class="text-center"><p class="text-[#d4af37] text-4xl font-bold logo-font">Mo &amp; Ma</p><p class="text-stone-400 text-sm mt-4">Barbershop in Volendam</p></div>';
                  }
                }}
              />
            </div>
          </div>
          <div className="space-y-8">
            <div className="space-y-6 text-stone-700 leading-relaxed">
              {content.about_text ? (
                content.about_text.split('\n').map((paragraph, i) => (
                  <p key={i} className="text-lg">{paragraph}</p>
                ))
              ) : (
                <>
                  <p className="text-lg">Welkom bij Barbershop Mo &amp; Ma, d&eacute; plek in Volendam voor de beste herenkapsels en baardverzorging. Wij, Mo en Ma, zijn gepassioneerde barbiers met jarenlange ervaring in het vak. Onze missie is om elke klant een unieke en persoonlijke ervaring te bieden, waarbij kwaliteit en klanttevredenheid voorop staan.</p>
                  <p className="text-lg">Bij Barbershop Mo &amp; Ma geloven we in het cre&euml;ren van een vriendelijke sfeer waar iedereen zich welkom voelt en waar altijd een bakje koffie voor u klaar staat. Of je nu komt voor een klassieke scheerbeurt, een trendy kapsel of een uitgebreide baardbehandeling, wij zorgen ervoor dat je er altijd op je best uitziet.</p>
                  <p className="text-lg">Kom langs bij Barbershop Mo &amp; Ma en ervaar zelf waarom wij de favoriete barbershop van Edam-Volendam zijn en laat ons je helpen om je look naar een hoger niveau te tillen.</p>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-4 pt-4">
              <Button size="lg" onClick={() => onNavigate("booking")} className="bg-[#6b0f1a] hover:bg-[#8b1523] text-white px-8 py-6 text-lg btn-shine">Maak Afspraak</Button>
              <Button size="lg" onClick={() => onNavigate("services")} variant="outline" className="border-[#6b0f1a] text-[#6b0f1a] px-8 py-6 text-lg">Bekijk Tarieven</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
