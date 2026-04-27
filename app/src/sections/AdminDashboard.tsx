import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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
  User
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { format, parseISO, isToday, isPast, isFuture } from 'date-fns';
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

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { logout, user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({ total: 0, upcoming: 0, past: 0 });
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('today');
  const [error, setError] = useState<string | null>(null);

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
      setTodayAppointments(statsResult.data?.todayAppointments || statsResult.todayAppointments);
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

  const filterAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    
    switch (activeTab) {
      case 'today':
        return appointments.filter(a => a.date === today);
      case 'upcoming':
        return appointments.filter(a => isFuture(parseISO(a.date)) || (a.date === today));
      case 'past':
        return appointments.filter(a => isPast(parseISO(a.date)) && a.date !== today);
      default:
        return appointments;
    }
  };

  const getStatusBadge = (appointment: Appointment) => {
    const appointmentDate = parseISO(appointment.date);
    
    if (isToday(appointmentDate)) {
      return <Badge className="bg-[#6b0f1a] text-white">Vandaag</Badge>;
    }
    
    if (isFuture(appointmentDate)) {
      return <Badge variant="outline" className="border-[#d4af37] text-[#d4af37]">Aankomend</Badge>;
    }
    
    return <Badge variant="secondary">Verlopen</Badge>;
  };

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
          <Button
            variant="outline"
            onClick={handleLogout}
            className="gap-2 border-[#6b0f1a] text-[#6b0f1a] hover:bg-[#6b0f1a] hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Uitloggen
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
                  <p className="text-3xl font-bold text-[#1a1a1a]">{todayAppointments.length}</p>
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

        {/* Appointments Tabs */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-[#6b0f1a] to-[#8b1523]">
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-[#d4af37]" />
              Afspraken Overzicht
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6 bg-stone-100">
                <TabsTrigger value="today" className="data-[state=active]:bg-[#6b0f1a] data-[state=active]:text-white">
                  Vandaag ({todayAppointments.length})
                </TabsTrigger>
                <TabsTrigger value="upcoming" className="data-[state=active]:bg-[#6b0f1a] data-[state=active]:text-white">
                  Aankomend ({stats.upcoming})
                </TabsTrigger>
                <TabsTrigger value="past" className="data-[state=active]:bg-[#6b0f1a] data-[state=active]:text-white">
                  Verlopen ({stats.past})
                </TabsTrigger>
                <TabsTrigger value="all" className="data-[state=active]:bg-[#6b0f1a] data-[state=active]:text-white">
                  Alles ({appointments.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-0">
                {filterAppointments().length === 0 ? (
                  <div className="text-center py-12 text-stone-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Geen afspraken gevonden</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filterAppointments().map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex flex-col lg:flex-row lg:items-center justify-between p-4 bg-white border border-stone-200 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="font-semibold text-[#1a1a1a]">{appointment.name}</h3>
                            {getStatusBadge(appointment)}
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-stone-600">
                            <span className="flex items-center gap-1">
                              <Scissors className="h-4 w-4 text-[#6b0f1a]" />
                              {serviceNames[appointment.service] || appointment.service}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-4 w-4 text-[#6b0f1a]" />
                              {appointment.barber_name || 'N/A'}
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
                              {appointment.email}
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
                        
                        <div className="mt-4 lg:mt-0 lg:ml-4">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => confirmDelete(appointment)}
                            className="gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Verwijderen
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
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
