import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  CheckCircle, 
  Loader2, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Mail, 
  Phone,
  MapPin,
  MessageCircle,
  Scissors,
  ChevronRight,
  ChevronLeft,
  AlertCircle
} from 'lucide-react';
import { format, addDays, isWeekend, parseISO, startOfDay } from 'date-fns';
import { nl } from 'date-fns/locale';

const services = [
  { id: 'knippen-stylen', name: 'Knippen + stylen (wax)', price: '€26', duration: 30 },
  { id: 'knippen-baard', name: 'Knippen + baard stylen/scheren', price: '€37,50', duration: 45 },
  { id: 'senioren', name: 'Senioren 65+ knippen + stylen', price: '€22', duration: 30 },
  { id: 'tondeuse', name: 'Alles één lengte/kaalscheren', price: '€19', duration: 20 },
  { id: 'baard', name: 'Baard stylen of scheren', price: '€20', duration: 15 },
  { id: 'baard-nek', name: 'Baard + neklijnen bijwerken', price: '€21', duration: 20 },
  { id: 'jong-tm11', name: 'Jongens t/m 11 jaar', price: '€21', duration: 25 },
  { id: 'jong-12-13', name: 'Jongens 12-13 jaar', price: '€25', duration: 30 },
];

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface BarberType {
  id: number;
  name: string;
  display_name: string;
}

export function Booking() {
  // Step: 1=Service, 2=Barber, 3=DateTime, 4=ContactInfo, 5=Review
  const [currentStep, setCurrentStep] = useState(1);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    barber_name: '',
    date: '',
    time: '',
    notes: '',
  });
  
  const [barbers, setBarbers] = useState<BarberType[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  
  const [isLoadingBarbers, setIsLoadingBarbers] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch barbers on mount
  useEffect(() => {
    fetchBarbers();
  }, []);

  const fetchBarbers = async () => {
    setIsLoadingBarbers(true);
    try {
      const response = await fetch(`${API_URL}/barbers`);
      const result = await response.json();
      
      if (result.success) {
        setBarbers(result.data);
      }
    } catch (err) {
      console.error('Error fetching barbers:', err);
    } finally {
      setIsLoadingBarbers(false);
    }
  };

  // Fetch available slots when date or barber changes
  useEffect(() => {
    if (selectedDate && formData.barber_name) {
      fetchAvailableSlots();
    }
  }, [selectedDate, formData.barber_name, formData.service]);

  const fetchAvailableSlots = async () => {
    if (!selectedDate || !formData.barber_name) return;
    
    setIsLoadingSlots(true);
    setError(null);
    
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetch(
        `${API_URL}/appointments/available-slots?date=${dateStr}&barber_name=${formData.barber_name}&treatment=${formData.service}`
      );
      const result = await response.json();
      
      if (result.success) {
        setAvailableSlots(result.data.availableSlots || []);
        setFormData(prev => ({ ...prev, time: '' }));
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
      setError('Kon beschikbare tijden niet laden');
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setFormData(prev => ({ 
        ...prev, 
        date: format(date, 'yyyy-MM-dd'),
        time: '' 
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          treatment: formData.service, // Backend slaat op als 'treatment'
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Er is iets misgegaan');
      }

      setShowSuccess(true);
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        service: '',
        barber_name: '',
        date: '',
        time: '',
        notes: '',
      });
      setSelectedDate(undefined);
      setCurrentStep(1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Er is iets misgegaan. Probeer het opnieuw.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!formData.service;
      case 2:
        return !!formData.barber_name;
      case 3:
        return !!formData.date && !!formData.time;
      case 4:
        return !!formData.name;
      default:
        return false;
    }
  };

  const canSubmit = 
    formData.name && 
    formData.service && 
    formData.barber_name && 
    formData.date && 
    formData.time;

  const selectedService = services.find(s => s.id === formData.service);
  const selectedBarber = barbers.find(b => b.name === formData.barber_name);

  const isDateDisabled = (date: Date) => {
    const today = startOfDay(new Date());
    return date < today || isWeekend(date);
  };

  return (
    <section className="w-full py-12 sm:py-24 bg-gradient-to-b from-white to-[#faf9f7]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
          <span className="text-[#d4af37] text-xs sm:text-sm font-semibold tracking-widest uppercase">
            Afspraak Maken
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1a1a1a] mt-3 sm:mt-4 mb-4 sm:mb-6 logo-font">
            Reserveer Je Plek
          </h2>
          <p className="text-base sm:text-lg text-stone-600 px-2">
            Maak eenvoudig een afspraak online. Wij zijn van maandag t/m zaterdag geopend, 
            op afspraak of gewoon binnenlopen!
          </p>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Step Form - komt eerst op mobiel */}
          <div className="order-1 lg:col-span-2">
            <Card className="shadow-2xl border-0 overflow-hidden">
              {/* Step Indicator */}
              <div className="bg-gradient-to-r from-[#6b0f1a] to-[#8b1523] px-4 sm:px-6 py-4 sm:py-6">
                <div className="flex items-center justify-between mb-2">
                  {[1, 2, 3, 4, 5].map((step) => (
                    <div key={step} className="flex items-center flex-1">
                      <div
                        className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-sm transition-all ${
                          currentStep >= step
                            ? 'bg-[#d4af37] text-[#1a1a1a]'
                            : 'bg-white/20 text-white'
                        }`}
                      >
                        {step}
                      </div>
                      {step < 5 && (
                        <div
                          className={`flex-1 h-0.5 sm:h-1 mx-1 sm:mx-2 transition-all ${
                            currentStep > step ? 'bg-[#d4af37]' : 'bg-white/20'
                          }`}
                        ></div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-white/60 text-[10px] sm:text-xs">
                  Stap {currentStep} van 5
                </div>
              </div>

              <CardContent className="p-4 sm:p-8">
                <form onSubmit={handleSubmit}>
                  {/* STEP 1: SERVICE SELECTION */}
                  {currentStep === 1 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <div className="space-y-3">
                        <h3 className="text-xl font-bold text-[#1a1a1a] flex items-center gap-2">
                          <Scissors className="h-6 w-6 text-[#d4af37]" />
                          Welke behandeling wil je?
                        </h3>
                        <p className="text-stone-600">Kies de behandeling die het best bij jou past.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {services.map((service) => (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, service: service.id }))}
                            className={`p-4 rounded-xl border-2 transition-all text-left ${
                              formData.service === service.id
                                ? 'border-[#6b0f1a] bg-[#6b0f1a]/5'
                                : 'border-stone-200 bg-white hover:border-[#6b0f1a]'
                            }`}
                          >
                            <div className="font-semibold text-[#1a1a1a]">{service.name}</div>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-xs text-stone-500">{service.duration} min</span>
                              <span className="font-bold text-[#6b0f1a]">{service.price}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* STEP 2: BARBER SELECTION */}
                  {currentStep === 2 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <div className="space-y-3">
                        <h3 className="text-xl font-bold text-[#1a1a1a] flex items-center gap-2">
                          <User className="h-6 w-6 text-[#d4af37]" />
                          Bij welke kapper wil je?
                        </h3>
                        <p className="text-stone-600">Iedere kapper heeft een eigen agenda.</p>
                      </div>

                      {isLoadingBarbers ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-[#6b0f1a]" />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                          {barbers.map((barber) => (
                            <button
                              key={barber.id}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, barber_name: barber.name }));
                                setSelectedDate(undefined);
                                setFormData(prev => ({ ...prev, date: '', time: '' }));
                              }}
                              className={`p-6 rounded-xl border-2 transition-all ${
                                formData.barber_name === barber.name
                                  ? 'border-[#6b0f1a] bg-[#6b0f1a]/5'
                                  : 'border-stone-200 bg-white hover:border-[#6b0f1a]'
                              }`}
                            >
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#6b0f1a] to-[#8b1523] flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3">
                                {barber.display_name.charAt(0)}
                              </div>
                              <div className="font-bold text-[#1a1a1a] text-center">{barber.display_name}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP 3: DATE & TIME SELECTION */}
                  {currentStep === 3 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <div className="space-y-3">
                        <h3 className="text-xl font-bold text-[#1a1a1a] flex items-center gap-2">
                          <CalendarIcon className="h-6 w-6 text-[#d4af37]" />
                          Wanneer kom je?
                        </h3>
                        <p className="text-stone-600">Kies een datum en tijd.</p>
                      </div>

                      {/* Calendar - Verbeterde stijl */}
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
                        <div className="flex justify-center">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDateSelect}
                            disabled={isDateDisabled}
                            fromDate={new Date()}
                            toDate={addDays(new Date(), 60)}
                            locale={nl}
                            className="mx-auto"
                            classNames={{
                              day_selected: "bg-[#6b0f1a] text-white hover:bg-[#8b1523]",
                              day_today: "text-[#6b0f1a] font-bold",
                              day: "h-10 w-10 rounded-full hover:bg-[#6b0f1a]/10 transition-colors",
                              day_disabled: "text-stone-300 cursor-not-allowed",
                              nav_button: "text-[#6b0f1a] hover:bg-[#6b0f1a]/10 rounded-full p-2",
                              caption_label: "font-semibold text-[#1a1a1a] text-base",
                              head_cell: "text-stone-500 text-sm font-medium",
                              table: "w-full border-collapse",
                            }}
                          />
                        </div>
                      </div>

                      {selectedDate && (
                        <div className="space-y-4">
                          <p className="text-sm font-semibold text-[#6b0f1a]">
                            📅 {format(selectedDate, 'EEEE d MMMM yyyy', { locale: nl })}
                          </p>

                          {/* Time Slots - Verbeterde weergave */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-stone-700">
                              <Clock className="h-4 w-4 inline mr-1 text-[#6b0f1a]" />
                              Kies een tijdstip:
                            </h4>
                            
                            {isLoadingSlots ? (
                              <div className="flex items-center justify-center py-8 bg-stone-50 rounded-xl">
                                <Loader2 className="h-5 w-5 animate-spin text-[#6b0f1a]" />
                                <span className="ml-2 text-stone-600">Tijden laden...</span>
                              </div>
                            ) : availableSlots.length > 0 ? (
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5 sm:gap-2 max-h-48 sm:max-h-64 overflow-y-auto p-1">
                                {timeSlots.map((slot) => {
                                  const isAvailable = availableSlots.includes(slot);
                                  const isSelected = formData.time === slot;
                                  return (
                                    <button
                                      key={slot}
                                      type="button"
                                      disabled={!isAvailable}
                                      onClick={() => setFormData(prev => ({ ...prev, time: slot }))}
                                      className={`py-1.5 sm:py-2.5 px-1 sm:px-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                                        isSelected
                                          ? 'bg-[#6b0f1a] text-white shadow-lg shadow-[#6b0f1a]/30 scale-105'
                                          : isAvailable
                                            ? 'bg-white border border-stone-200 sm:border-2 text-stone-700 hover:border-[#d4af37] hover:text-[#6b0f1a] hover:shadow-md'
                                            : 'bg-stone-50 text-stone-300 cursor-not-allowed line-through'
                                      }`}
                                    >
                                      {slot}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="font-medium">Geen beschikbare tijden</p>
                                  <p className="text-xs mt-1">Deze datum is helaas volgeboekt. Kies een andere datum of kapper.</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP 4: CONTACT INFO */}
                  {currentStep === 4 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <div className="space-y-3">
                        <h3 className="text-xl font-bold text-[#1a1a1a] flex items-center gap-2">
                          <Mail className="h-6 w-6 text-[#d4af37]" />
                          Jouw gegevens
                        </h3>
                        <p className="text-stone-600">We gebruiken deze gegevens voor je afspraakbevestiging.</p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-stone-700 font-medium">Naam *</Label>
                          <Input
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Jouw naam"
                            required
                            className="border-stone-300 focus:border-[#6b0f1a] focus:ring-[#6b0f1a]"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-stone-700 font-medium">E-mail <span className="text-stone-400 text-xs">(optioneel)</span></Label>
                          <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="jouw@email.nl"
                            className="border-stone-300 focus:border-[#6b0f1a] focus:ring-[#6b0f1a]"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-stone-700 font-medium">Telefoon</Label>
                          <Input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="06-12345678"
                            className="border-stone-300 focus:border-[#6b0f1a] focus:ring-[#6b0f1a]"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-stone-700 font-medium">Opmerkingen</Label>
                          <Textarea
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Bijzonderheden of wensen..."
                            rows={3}
                            className="border-stone-300 focus:border-[#6b0f1a] focus:ring-[#6b0f1a]"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 5: REVIEW & CONFIRM */}
                  {currentStep === 5 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <div className="space-y-3">
                        <h3 className="text-xl font-bold text-[#1a1a1a] flex items-center gap-2">
                          <CheckCircle className="h-6 w-6 text-[#d4af37]" />
                          Controleer je afspraak
                        </h3>
                        <p className="text-stone-600">Ziet alles er goed uit?</p>
                      </div>

                      <div className="space-y-3 bg-[#faf9f7] p-6 rounded-xl border border-stone-200">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="text-stone-600">Behandeling:</span>
                            <span className="font-bold text-[#1a1a1a]">{selectedService?.name}</span>
                          </div>
                          <div className="flex justify-between items-start">
                            <span className="text-stone-600">Kapper:</span>
                            <span className="font-bold text-[#1a1a1a]">{selectedBarber?.display_name}</span>
                          </div>
                          <div className="flex justify-between items-start">
                            <span className="text-stone-600">Datum:</span>
                            <span className="font-bold text-[#1a1a1a]">
                              {formData.date && format(parseISO(formData.date), 'EEEE d MMMM', { locale: nl })}
                            </span>
                          </div>
                          <div className="flex justify-between items-start">
                            <span className="text-stone-600">Tijd:</span>
                            <span className="font-bold text-[#1a1a1a]">{formData.time}</span>
                          </div>
                          <div className="pt-2 border-t border-stone-300 flex justify-between items-start">
                            <span className="text-stone-600">Prijs:</span>
                            <span className="font-bold text-[#6b0f1a] text-lg">{selectedService?.price}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-stone-600">
                        <p>
                          <strong>Naam:</strong> {formData.name}
                        </p>
                        <p>
                          <strong>E-mail:</strong> {formData.email}
                        </p>
                        {formData.phone && (
                          <p>
                            <strong>Telefoon:</strong> {formData.phone}
                          </p>
                        )}
                        {formData.notes && (
                          <p>
                            <strong>Opmerkingen:</strong> {formData.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex gap-3 mt-8">
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(prev => Math.max(prev - 1, 1))}
                      variant="outline"
                      className="flex-1"
                      disabled={currentStep === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Terug
                    </Button>

                    {currentStep < 5 ? (
                      <Button
                        type="button"
                        onClick={() => {
                          if (isStepValid(currentStep)) {
                            setCurrentStep(prev => prev + 1);
                            setError(null);
                          }
                        }}
                        className="flex-1 bg-[#6b0f1a] hover:bg-[#8b1523]"
                        disabled={!isStepValid(currentStep)}
                      >
                        Volgende
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        disabled={!canSubmit || isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Bezig...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Afspraak Bevestigen
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Info Sidebar - onder het formulier op mobiel */}
          <div className="order-2 lg:col-span-1 space-y-4 sm:space-y-6">
            {/* Contact Info */}
            <Card className="shadow-lg border-0 overflow-hidden">
              <div className="bg-[#d4af37] px-4 sm:px-6 py-3 sm:py-4">
                <h3 className="text-base sm:text-lg font-bold text-[#1a1a1a] flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  Contact
                </h3>
              </div>
              <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[#6b0f1a] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-[#1a1a1a]">Barbershop Mo&Ma</p>
                    <p className="text-stone-600 text-sm">W. J. Tuijnstraat 14A</p>
                    <p className="text-stone-600 text-sm">1131 ZJ Volendam</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-[#6b0f1a] flex-shrink-0" />
                  <a href="tel:0685171198" className="text-[#1a1a1a] hover:text-[#6b0f1a] font-medium">
                    06-85171198
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Opening Hours */}
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-[#6b0f1a] to-[#8b1523] px-4 sm:px-6 py-3 sm:py-4">
                <CardTitle className="text-white flex items-center gap-2 text-sm sm:text-base">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-[#d4af37]" />
                  Openingstijden
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-2 sm:space-y-3">
                <div className="flex justify-between py-1.5 text-sm">
                  <span className="text-stone-600">Maandag</span>
                  <span className="font-medium">10:00 - 18:00</span>
                </div>
                <div className="flex justify-between py-1.5 text-sm">
                  <span className="text-stone-600">Dinsdag</span>
                  <span className="font-medium">09:00 - 18:00</span>
                </div>
                <div className="flex justify-between py-1.5 text-sm">
                  <span className="text-stone-600">Woensdag</span>
                  <span className="font-medium">09:00 - 18:00</span>
                </div>
                <div className="flex justify-between py-1.5 text-sm">
                  <span className="text-stone-600">Donderdag</span>
                  <span className="font-medium">09:00 - 18:00</span>
                </div>
                <div className="flex justify-between py-1.5 text-sm">
                  <span className="text-stone-600">Vrijdag</span>
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
              </CardContent>
            </Card>

            {/* Info Box */}
            <div className="bg-gradient-to-br from-[#6b0f1a] to-[#8b1523] text-white p-4 sm:p-6 rounded-xl shadow-lg">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-[#d4af37]" />
                Hoe werkt het?
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#d4af37]">1.</span>
                  <span>Kies je behandeling</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#d4af37]">2.</span>
                  <span>Selecteer je kapper</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#d4af37]">3.</span>
                  <span>Kies datum en tijd</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#d4af37]">4.</span>
                  <span>Vul je gegevens in</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#d4af37]">5.</span>
                  <span>Bevestig je afspraak!</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-center text-2xl">Afspraak Bevestigd!</DialogTitle>
            <DialogDescription className="text-center mt-4">
              <p className="mb-4">Bedankt voor je afspraak bij Mo&Ma! 🎉</p>
              <div className="bg-[#faf9f7] rounded-lg p-4 text-left space-y-2 text-sm mb-4">
                <p><strong>Behandeling:</strong> {selectedService?.name}</p>
                <p><strong>Kapper:</strong> {selectedBarber?.display_name}</p>
                <p>
                  <strong>Datum:</strong>{' '}
                  {formData.date && format(parseISO(formData.date), 'EEEE d MMMM yyyy', { locale: nl })}
                </p>
                <p><strong>Tijd:</strong> {formData.time}</p>
              </div>
              {formData.email ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-blue-700 text-sm flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Een bevestiging is verstuurd naar <strong>{formData.email}</strong>
                  </p>
                  <p className="text-blue-600 text-xs mt-1">
                    Je ontvangt ook een herinnering 24 uur van tevoren.
                  </p>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <p className="text-amber-700 text-sm">
                    Geen bevestigingsmail (geen e-mail ingevuld). Noteer je afspraak goed!
                  </p>
                </div>
              )}
              <p className="text-stone-600 text-sm">
                We zien je graag in onze barbershop!
              </p>
            </DialogDescription>
          </DialogHeader>
          <Button 
            onClick={() => setShowSuccess(false)} 
            className="w-full bg-[#6b0f1a] hover:bg-[#8b1523]"
          >
            Sluiten
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}

