import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  LogOut, 
  Calendar, 
  Clock, 
  Mail, 
  Phone, 
  FileText,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Scissors,
  Users,
  User,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { format, parseISO, isToday, isFuture } from 'date-fns';
import { nl } from 'date-fns/locale';
import type { Appointment } from '@/types';

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const serviceNames: Record<string, string> = {
  'knippen-stylen': 'Knippen + stylen',
  'knippen-baard': 'Knippen + baard',
  'senioren': 'Senioren 65+',
  'tondeuse': 'Tondeuse/kaal',
  'baard': 'Baard verzorging',
  'baard-nek': 'Baard + nek',
  'jong-tm11': 'Jongens t/m 11',
  'jong-12-13': 'Jongens 12-13',
};

// Kleuren per kapper (voor de agenda weergave)
const barberColors: Record<string, { bg: string; text: string; border: string; light: string }> = {
  'mo': { bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-600', light: 'bg-blue-50 border-blue-200' },
  'ma': { bg: 'bg-green-600', text: 'text-green-600', border: 'border-green-600', light: 'bg-green-50 border-green-200' },
  'third': { bg: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-600', light: 'bg-purple-50 border-purple-200' },
};

const defaultBarberColor = { bg: 'bg-stone-600', text: 'text-stone-600', border: 'border-stone-600', light: 'bg-stone-50 border-stone-200' };

function getBarberColor(barberName: string) {
  return barberColors[barberName?.toLowerCase()] || defaultBarberColor;
}

function getBarberDisplayName(barberName: string) {
  const names: Record<string, string> = { 'mo': 'Mo', 'ma': 'Ma', 'third': 'Derde kapper' };
  return names[barberName?.toLowerCase()] || barberName;
}

// Tijdslots voor de dag weergave (08:00 - 18:00, elke 30 min)
const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
];

const barbersAgenda = [
  { key: 'mo', name: 'Mo', color: barberColors.mo },
  { key: 'ma', name: 'Ma', color: barberColors.ma },
  { key: 'third', name: 'Derde kapper', color: barberColors.third },
];

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { logout, user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({ total: 0, upcoming: 0, past: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeView, setActiveView] = useState<'agenda' | 'list'>('agenda');

  // Haal alle afspraken op (ook verlopen)
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      const [appointmentsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/appointments`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
      ]);

      if (!appointmentsRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const appointmentsResult = await appointmentsRes.json();
      const statsResult = await statsRes.json();

      setAppointments(appointmentsResult.data || appointmentsResult);
      setStats(statsResult.data?.stats || statsResult.stats);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Kon gegevens niet laden. Probeer opnieuw in te loggen.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async () => {
    if (!appointmentToDelete) return;
    
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/appointments/${appointmentToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      await fetchData();
      setDeleteDialogOpen(false);
      setAppointmentToDelete(null);
    } catch (err) {
      console.error('Error deleting:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = (appointment: Appointment) => {
    setAppointmentToDelete(appointment);
    setDeleteDialogOpen(true);
  };

  const handleLogout = () => {
    logout();
    onNavigate('home');
  };

  // Afspraken voor de geselecteerde datum
  const appointmentsForDate = appointments.filter(a => a.date === selectedDate);

  // Groepeer afspraken per kapper (voor agenda view)
  const appointmentsByBarber = (barberName: string) => 
    appointmentsForDate.filter(a => a.barber_name?.toLowerCase() === barberName);

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const isTodaySelected = selectedDate === new Date().toISOString().split('T')[0];

  if (isLoading) {
    return (
      <div className="w-full min-h-[calc(100vh-120px)] flex items-center justify-center">
        <div className="flex items-center gap-2 text-stone-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          Laden...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-[calc(100vh-120px)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={handleLogout} className="bg-[#6b0f1a]">
            Uitloggen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <section className="w-full py-8 bg-[#faf9f7] min-h-[calc(100vh-120px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1a1a1a] logo-font">Dashboard</h1>
            <p className="text-stone-600">
              Welkom terug, <span className="font-medium text-[#6b0f1a]">{user?.username}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant={activeView === 'agenda' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveView('agenda')}
              className={activeView === 'agenda' ? 'bg-[#6b0f1a]' : 'border-[#6b0f1a] text-[#6b0f1a]'}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Agenda
            </Button>
            <Button
              variant={activeView === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveView('list')}
              className={activeView === 'list' ? 'bg-[#6b0f1a]' : 'border-[#6b0f1a] text-[#6b0f1a]'}
            >
              <Filter className="h-4 w-4 mr-1" />
              Lijst
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="gap-2 border-[#6b0f1a] text-[#6b0f1a] hover:bg-[#6b0f1a] hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Uitloggen
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone-500">Totaal</p>
                  <p className="text-3xl font-bold text-[#1a1a1a]">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-[#6b0f1a]/10 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-[#6b0f1a]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone-500">Aankomend</p>
                  <p className="text-3xl font-bold text-[#1a1a1a]">{stats.upcoming}</p>
                </div>
                <div className="w-12 h-12 bg-[#d4af37]/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-[#d4af37]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone-500">Vandaag</p>
                  <p className="text-3xl font-bold text-[#1a1a1a]">{appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone-500">Verlopen</p>
                  <p className="text-3xl font-bold text-[#1a1a1a]">{stats.past}</p>
                </div>
                <div className="w-12 h-12 bg-stone-200 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-stone-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {activeView === 'agenda' ? (
          <>
            {/* Dag navigatie */}
            <div className="flex items-center justify-between mb-4 bg-white rounded-lg shadow-lg p-4">
              <Button
                variant="ghost"
                onClick={handlePrevDay}
                className="text-[#6b0f1a] hover:bg-[#6b0f1a]/10"
              >
                <ChevronLeft className="h-5 w-5 mr-1" />
                Vorige dag
              </Button>
              <div className="flex items-center gap-3">
                <span className="font-bold text-lg text-[#1a1a1a]">
                  {format(parseISO(selectedDate), 'EEEE d MMMM yyyy', { locale: nl })}
                </span>
                {!isTodaySelected && (
                  <Button
                    size="sm"
                    onClick={handleToday}
                    className="bg-[#d4af37] text-[#1a1a1a] hover:bg-[#b8941f]"
                  >
                    Vandaag
                  </Button>
                )}
              </div>
              <Button
                variant="ghost"
                onClick={handleNextDay}
                className="text-[#6b0f1a] hover:bg-[#6b0f1a]/10"
              >
                Volgende dag
                <ChevronRight className="h-5 w-5 ml-1" />
              </Button>
            </div>

            {/* 3-koloms agenda */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {barbersAgenda.map(({ key, name, color }) => {
                const barberAppointments = appointmentsByBarber(key);
                return (
                  <Card key={key} className="border-0 shadow-lg overflow-hidden">
                    <div className={`${color.bg} px-4 py-3`}>
                      <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {name}
                      </h3>
                      <p className="text-white/80 text-xs">
                        {barberAppointments.length} afspraak/pen
                      </p>
                    </div>
                    <CardContent className="p-2">
                      {barberAppointments.length === 0 && (
                        <div className="text-center py-8 text-stone-400 text-sm">
                          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          Geen afspraken
                        </div>
                      )}
                      <div className="space-y-0.5">
                        {timeSlots.map((time) => {
                          const apt = barberAppointments.find(a => a.time === time);
                          return (
                            <div
                              key={time}
                              className={`flex items-stretch min-h-[44px] rounded-lg transition-colors ${
                                apt ? `${color.light} border ${color.border}` : ''
                              }`}
                            >
                              {/* Tijd */}
                              <div className={`w-14 flex-shrink-0 flex items-start pt-2 px-2 text-xs font-medium ${
                                apt ? 'text-stone-500' : 'text-stone-200'
                              }`}>
                                {time}
                              </div>
                              {/* Inhoud */}
                              <div className="flex-1 min-w-0 py-1.5 pr-2">
                                {apt ? (
                                  <div className="group relative">
                                    <p className={`text-sm font-semibold ${color.text} truncate`}>
                                      {apt.name}
                                    </p>
                                    <p className="text-xs text-stone-500 truncate">
                                      {serviceNames[apt.service] || apt.service}
                                    </p>
                                    {apt.notes && (
                                      <p className="text-xs text-stone-400 truncate">{apt.notes}</p>
                                    )}
                                    {/* Delete knop */}
                                    <button
                                      onClick={() => confirmDelete(apt)}
                                      className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 bg-white rounded-full p-1 shadow-sm"
                                      title="Verwijderen"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="text-xs text-stone-100 italic">—</div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        ) : (
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#6b0f1a] to-[#8b1523]">
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-[#d4af37]" />
                Alle Afspraken
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs defaultValue="all">
                <TabsList className="mb-6 bg-stone-100">
                  <TabsTrigger value="today" className="data-[state=active]:bg-[#6b0f1a] data-[state=active]:text-white">
                    Vandaag
                  </TabsTrigger>
                  <TabsTrigger value="upcoming" className="data-[state=active]:bg-[#6b0f1a] data-[state=active]:text-white">
                    Aankomend
                  </TabsTrigger>
                  <TabsTrigger value="past" className="data-[state=active]:bg-[#6b0f1a] data-[state=active]:text-white">
                    Verlopen
                  </TabsTrigger>
                  <TabsTrigger value="all" className="data-[state=active]:bg-[#6b0f1a] data-[state=active]:text-white">
                    Alles
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <AppointmentListItem 
                        key={appointment.id} 
                        appointment={appointment}
                        onDelete={confirmDelete}
                      />
                    ))}
                    {appointments.length === 0 && (
                      <div className="text-center py-12 text-stone-500">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Geen afspraken gevonden</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="today">
                  <div className="space-y-4">
                    {appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).map((appointment) => (
                      <AppointmentListItem 
                        key={appointment.id} 
                        appointment={appointment}
                        onDelete={confirmDelete}
                      />
                    ))}
                    {appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).length === 0 && (
                      <div className="text-center py-12 text-stone-500">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Geen afspraken voor vandaag</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="upcoming">
                  <div className="space-y-4">
                    {appointments.filter(a => a.date >= new Date().toISOString().split('T')[0]).map((appointment) => (
                      <AppointmentListItem 
                        key={appointment.id} 
                        appointment={appointment}
                        onDelete={confirmDelete}
                      />
                    ))}
                    {appointments.filter(a => a.date >= new Date().toISOString().split('T')[0]).length === 0 && (
                      <div className="text-center py-12 text-stone-500">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Geen aankomende afspraken</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="past">
                  <div className="space-y-4">
                    {appointments.filter(a => a.date < new Date().toISOString().split('T')[0]).map((appointment) => (
                      <AppointmentListItem 
                        key={appointment.id} 
                        appointment={appointment}
                        onDelete={confirmDelete}
                      />
                    ))}
                    {appointments.filter(a => a.date < new Date().toISOString().split('T')[0]).length === 0 && (
                      <div className="text-center py-12 text-stone-500">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Geen verlopen afspraken</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-center">Afspraak Verwijderen</DialogTitle>
            <DialogDescription className="text-center">
              Weet je zeker dat je de afspraak van{' '}
              <strong>{appointmentToDelete?.name}</strong> op{' '}
              {appointmentToDelete && format(parseISO(appointmentToDelete.date), 'd MMMM', { locale: nl })}{' '}
              om {appointmentToDelete?.time} wilt verwijderen?
              <br /><br />
              <span className="text-red-600">Deze actie kan niet ongedaan worden gemaakt.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verwijderen...
                </>
              ) : (
                'Verwijderen'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

// ========== APPOINTMENT LIST ITEM COMPONENT ==========

function AppointmentListItem({ 
  appointment, 
  onDelete 
}: { 
  appointment: Appointment; 
  onDelete: (apt: Appointment) => void 
}) {
  const color = getBarberColor(appointment.barber_name || '');
  const statusLabel = isToday(parseISO(appointment.date)) ? 'Vandaag' 
    : isFuture(parseISO(appointment.date)) ? 'Aankomend' 
    : 'Verlopen';

  return (
    <div
      className={`flex flex-col lg:flex-row lg:items-center justify-between p-4 rounded-lg transition-shadow ${
        color.light
      }`}
    >
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="font-semibold text-[#1a1a1a]">{appointment.name}</h3>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color.bg} text-white`}>
            {getBarberDisplayName(appointment.barber_name || '')}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            statusLabel === 'Vandaag' ? 'bg-[#6b0f1a] text-white' 
            : statusLabel === 'Aankomend' ? 'bg-[#d4af37] text-[#1a1a1a]'
            : 'bg-stone-200 text-stone-600'
          }`}>
            {statusLabel}
          </span>
        </div>
        
        <div className="flex flex-wrap gap-4 text-sm text-stone-600">
          <span className="flex items-center gap-1">
            <Scissors className="h-4 w-4 text-[#6b0f1a]" />
            {serviceNames[appointment.service] || appointment.service}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-[#6b0f1a]" />
            {format(parseISO(appointment.date), 'EEEE d MMMM', { locale: nl })}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-[#6b0f1a]" />
            {appointment.time}
          </span>
        </div>
        
        <div className="flex flex-wrap gap-4 text-sm text-stone-500">
          <span className="flex items-center gap-1">
            <Mail className="h-4 w-4" />
            {appointment.email || '—'}
          </span>
          {appointment.phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-4 w-4" />
              {appointment.phone}
            </span>
          )}
        </div>
        
        {appointment.notes && (
          <p className="text-sm text-stone-500 flex items-start gap-1">
            <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
            {appointment.notes}
          </p>
        )}
      </div>
      
      <div className="mt-4 lg:mt-0 lg:ml-4 flex-shrink-0">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(appointment)}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Verwijderen
        </Button>
      </div>
    </div>
  );
}
