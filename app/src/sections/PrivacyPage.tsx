import { Button } from '@/components/ui/button';
import { Shield, Mail, ArrowLeft } from 'lucide-react';

interface PrivacyPageProps {
  onNavigate: (page: string) => void;
}

export function PrivacyPage({ onNavigate }: PrivacyPageProps) {
  return (
    <section className="w-full py-16 bg-[#faf9f7] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-[#6b0f1a] hover:text-[#8b1523] mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug naar home
        </button>

        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-[#d4af37]" />
          <h1 className="text-4xl font-bold text-[#1a1a1a] logo-font">Privacy- &amp; Cookiebeleid</h1>
        </div>

        <div className="prose prose-stone max-w-none space-y-8">
          {/* Inleiding */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-[#6b0f1a] mb-3">1. Inleiding</h2>
            <p className="text-stone-700 leading-relaxed">
              Barbershop Mo &amp; Ma (hierna: "wij", "ons" of "onze") hecht veel waarde aan de privacy van 
              onze klanten en bezoekers van onze website. In dit privacy- en cookiebeleid leggen we uit 
              welke gegevens we verzamelen, waarom we dit doen en wat je rechten zijn.
            </p>
            <p className="text-stone-700 leading-relaxed mt-2">
              <strong>Contactgegevens:</strong><br />
              Barbershop Mo &amp; Ma<br />
              W. J. Tuijnstraat 14A, 1131 ZJ Volendam<br />
              Telefoon: <a href="tel:06-85171198" className="text-[#6b0f1a]">06-85171198</a><br />
              Email: <a href="mailto:info@barbershop-moma.nl" className="text-[#6b0f1a]">info@barbershop-moma.nl</a>
            </p>
          </div>

          {/* Welke gegevens */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-[#6b0f1a] mb-3">2. Welke gegevens verzamelen wij?</h2>
            <p className="text-stone-700 leading-relaxed mb-3">
              Wanneer je een afspraak maakt via onze website, vragen we je om de volgende gegevens:
            </p>
            <ul className="list-disc pl-6 text-stone-700 space-y-2">
              <li><strong>Naam</strong> - om je te kunnen aanspreken en de afspraak te registreren</li>
              <li><strong>Telefoonnummer</strong> - om je te kunnen bereiken bij wijzigingen of annuleringen</li>
              <li><strong>E-mailadres</strong> (optioneel) - om een bevestiging en herinnering te sturen</li>
              <li><strong>Behandeling</strong> - om de juiste tijd en kapper te reserveren</li>
            </ul>
            <p className="text-stone-700 leading-relaxed mt-3">
              Daarnaast verzamelen we anonieme statistieken over het gebruik van onze website 
              (zoals paginaweergaven en bezoekersaantallen) om de website te verbeteren.
            </p>
          </div>

          {/* Doeleinden */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-[#6b0f1a] mb-3">3. Waarom verzamelen wij deze gegevens?</h2>
            <ul className="list-disc pl-6 text-stone-700 space-y-2">
              <li>Om afspraken te beheren en te bevestigen</li>
              <li>Om je een herinnering te sturen voor je afspraak (indien e-mail is verstrekt)</li>
              <li>Om je te kunnen bereiken bij onvoorziene wijzigingen</li>
              <li>Om onze dienstverlening te verbeteren</li>
            </ul>
          </div>

          {/* Bewaartermijn */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-[#6b0f1a] mb-3">4. Bewaartermijn</h2>
            <p className="text-stone-700 leading-relaxed">
              We bewaren je gegevens niet langer dan nodig is voor het doel waarvoor ze zijn verzameld. 
              Afspraakgegevens worden maximaal 2 jaar bewaard na de laatste afspraak voor administratieve 
              doeleinden. Daarna worden ze geanonimiseerd of verwijderd.
            </p>
          </div>

          {/* Beveiliging */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-[#6b0f1a] mb-3">5. Beveiliging</h2>
            <p className="text-stone-700 leading-relaxed">
              Wij nemen passende technische en organisatorische maatregelen om je persoonsgegevens 
              te beveiligen tegen verlies, onrechtmatige verwerking of ongeautoriseerde toegang. 
              Onze website maakt gebruik van een beveiligde verbinding (HTTPS) en gegevens worden 
              versleuteld opgeslagen.
            </p>
          </div>

          {/* Cookies */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-[#6b0f1a] mb-3">6. Cookies</h2>
            <p className="text-stone-700 leading-relaxed mb-3">
              Onze website gebruikt cookies om de gebruikerservaring te verbeteren. Cookies zijn kleine 
              tekstbestandjes die op je apparaat worden opgeslagen. We maken gebruik van:
            </p>
            <ul className="list-disc pl-6 text-stone-700 space-y-2">
              <li><strong>Noodzakelijke cookies:</strong> Voor het functioneren van de website (bijv. inloggen)</li>
              <li><strong>Functionele cookies:</strong> Om je voorkeuren te onthouden</li>
              <li><strong>Analytische cookies:</strong> Anonieme bezoekersstatistieken (alleen met toestemming)</li>
            </ul>
            <p className="text-stone-700 leading-relaxed mt-3">
              Je kunt je cookievoorkeuren op elk moment aanpassen via de cookie banner onderaan de pagina.
            </p>
          </div>

          {/* Jouw rechten */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-[#6b0f1a] mb-3">7. Jouw rechten</h2>
            <p className="text-stone-700 leading-relaxed mb-3">
              Op grond van de Algemene Verordening Gegevensbescherming (AVG) heb je de volgende rechten:
            </p>
            <ul className="list-disc pl-6 text-stone-700 space-y-2">
              <li>Recht op inzage van je gegevens</li>
              <li>Recht op rectificatie van onjuiste gegevens</li>
              <li>Recht op verwijdering van je gegevens (vergetelheid)</li>
              <li>Recht op beperking van de verwerking</li>
              <li>Recht op bezwaar tegen verwerking</li>
              <li>Recht op gegevensoverdraagbaarheid</li>
            </ul>
            <p className="text-stone-700 leading-relaxed mt-3">
              Wil je een van deze rechten uitoefenen? Neem dan contact met ons op via 
              <a href="mailto:info@barbershop-moma.nl" className="text-[#6b0f1a]"> info@barbershop-moma.nl</a> 
              of bel <a href="tel:06-85171198" className="text-[#6b0f1a]">06-85171198</a>.
            </p>
          </div>

          {/* Delen met derden */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-[#6b0f1a] mb-3">8. Delen met derden</h2>
            <p className="text-stone-700 leading-relaxed">
              Wij delen je persoonsgegevens niet met derden, tenzij dit noodzakelijk is voor de 
              uitvoering van onze dienstverlening (bijv. het versturen van e-mails via een e-mailprovider) 
              of wanneer wij wettelijk verplicht zijn om gegevens te delen.
            </p>
          </div>

          {/* Wijzigingen */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-[#6b0f1a] mb-3">9. Wijzigingen</h2>
            <p className="text-stone-700 leading-relaxed">
              Wij behouden ons het recht voor om dit privacy- en cookiebeleid aan te passen. 
              Wijzigingen worden op deze pagina gepubliceerd. We raden je aan om deze pagina 
              regelmatig te raadplegen.
            </p>
            <p className="text-stone-500 text-sm mt-2">
              Laatst bijgewerkt: mei 2026
            </p>
          </div>
        </div>

        <div className="text-center mt-10">
          <Button onClick={() => onNavigate('home')} className="bg-[#6b0f1a]">
            <ArrowLeft className="h-4 w-4 mr-2" />Terug naar home
          </Button>
        </div>
      </div>
    </section>
  );
}
