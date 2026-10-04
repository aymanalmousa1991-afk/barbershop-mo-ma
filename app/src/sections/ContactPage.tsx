import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Phone, Mail, Clock, Instagram, Facebook, MessageCircle, ArrowLeft, Navigation } from 'lucide-react';
import { useHomeContent } from '@/hooks/useHomeContent';

interface ContactPageProps {
  onNavigate: (page: string) => void;
}

export function ContactPage({ onNavigate }: ContactPageProps) {
  const { content } = useHomeContent();
  const address = 'W. J. Tuijnstraat 14A, 1131 ZJ Volendam';
  const mapsQuery = encodeURIComponent(address);
  const mapsEmbed = `https://www.google.com/maps?q=${mapsQuery}&output=embed`;
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  return (
    <section className="w-full py-16 bg-[#faf9f7] min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-[#6b0f1a] hover:text-[#8b1523] mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug naar home
        </button>

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-[#d4af37] text-sm font-semibold tracking-widest uppercase">Contact</span>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#1a1a1a] mt-4 mb-4 logo-font">
            Kom langs of neem contact op
          </h1>
          <p className="text-lg text-stone-600">
            Vragen over een afspraak of onze behandelingen? Bel ons, stuur een bericht of kom
            gezellig langs in de barbershop in Volendam.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Contactgegevens */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 space-y-5">
                {/* Adres */}
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-full bg-[#6b0f1a]/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-[#6b0f1a]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1a1a1a]">Adres</p>
                    <p className="text-stone-600 text-sm">Barbershop Mo&amp;Ma</p>
                    <p className="text-stone-600 text-sm">W. J. Tuijnstraat 14A</p>
                    <p className="text-stone-600 text-sm">1131 ZJ Volendam</p>
                  </div>
                </div>

                {/* Telefoon */}
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-full bg-[#6b0f1a]/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-[#6b0f1a]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1a1a1a]">Telefoon</p>
                    <a href="tel:0685171198" className="text-stone-600 text-sm hover:text-[#6b0f1a]">
                      06-85171198
                    </a>
                  </div>
                </div>

                {/* E-mail */}
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-full bg-[#6b0f1a]/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-[#6b0f1a]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1a1a1a]">E-mail</p>
                    <a href="mailto:info@barbershopmo-ma.nl" className="text-stone-600 text-sm hover:text-[#6b0f1a]">
                      info@barbershopmo-ma.nl
                    </a>
                  </div>
                </div>

                {/* Socials */}
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-full bg-[#6b0f1a]/10 flex items-center justify-center flex-shrink-0">
                    <Instagram className="h-5 w-5 text-[#6b0f1a]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1a1a1a]">Social media</p>
                    <div className="flex gap-3 mt-2">
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
              </CardContent>
            </Card>

            {/* Openingstijden */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-bold text-[#1a1a1a] flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5 text-[#d4af37]" />
                  Openingstijden
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-1.5 text-sm">
                    <span className="text-stone-600">Maandag</span>
                    <span className="font-medium">10:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between py-1.5 text-sm">
                    <span className="text-stone-600">Dinsdag t/m vrijdag</span>
                    <span className="font-medium">09:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between py-1.5 text-sm">
                    <span className="text-stone-600">Zaterdag</span>
                    <span className="font-medium">08:00 - 17:00</span>
                  </div>
                  <div className="flex justify-between py-1.5 text-sm">
                    <span className="text-stone-600">Zondag</span>
                    <span className="text-stone-400">Gesloten</span>
                  </div>
                </div>
                <p className="text-xs text-stone-500 mt-4 pt-4 border-t border-stone-100">
                  {content.opening_afspraak || 'Ma, Di, Vr, Za: uitsluitend op afspraak'} &middot; {content.opening_inloop || 'Wo, Do: Inloop'}
                </p>
              </CardContent>
            </Card>

            {/* CTA knoppen */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => onNavigate('booking')}
                className="flex-1 bg-[#6b0f1a] hover:bg-[#8b1523]"
              >
                Maak een afspraak
              </Button>
              <Button
                asChild
                variant="outline"
                className="flex-1 border-[#6b0f1a] text-[#6b0f1a] hover:bg-[#6b0f1a]/5"
              >
                <a href="tel:0685171198">
                  <Phone className="h-4 w-4 mr-2" />
                  Bel ons
                </a>
              </Button>
            </div>
          </div>

          {/* Kaart */}
          <div className="space-y-4">
            <Card className="border-0 shadow-lg overflow-hidden h-full min-h-[320px]">
              <iframe
                title="Locatie Barbershop Mo&Ma"
                src={mapsEmbed}
                className="w-full h-full min-h-[320px] border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </Card>
            <Button
              asChild
              variant="outline"
              className="w-full border-[#6b0f1a] text-[#6b0f1a] hover:bg-[#6b0f1a]/5"
            >
              <a href={mapsLink} target="_blank" rel="noopener noreferrer">
                <Navigation className="h-4 w-4 mr-2" />
                Route plannen
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
