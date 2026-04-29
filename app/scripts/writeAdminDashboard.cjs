const fs = require('fs');
const path = require('path');

const PART1 = `import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  LogOut, Calendar, Clock, Mail, Phone, FileText,
  Trash2, Loader2, AlertTriangle, CheckCircle, TrendingUp,
  Scissors, Users, User, ChevronLeft, ChevronRight,
  Settings, ArrowRight, KeyRound, Plus
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { format, parseISO, isToday, isFuture } from 'date-fns';
import { nl } from 'date-fns/locale';
import type { Appointment } from '@/types';
import { AdminSettings } from './AdminSettings';
import { PasswordChangeDialog } from './PasswordChangeDialog';

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

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

const serviceOptions = Object.keys(serviceNames).map(k => ({ key: k, name: serviceNames[k] }));

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

const timeSlots = [
  '08:00','08:30','09:00','09:30','10:00','10:30',
  '11:00','11:30','12:00','12:30','13:00','13:30',
  '14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30'
];

const barbersAgenda = [
  { key: 'mo', name: 'Mo', color: barberColors.mo },
  { key: 'ma', name: 'Ma', color: barberColors.ma },
  { key: 'third', name: 'Derde kapper', color: barberColors.third },
];`;

const PART2 = `
export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { logout, user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({ total: 0, upcoming: 0, past: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeView, setActiveView] = useState<'agenda' | 'list'>('agenda');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Move state
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [appointmentToMove, setAppointmentToMove] = useState<Appointment | null>(null);
  const [moveTargetBarber, setMoveTargetBarber] = useState('');
  const [moveTargetDate, setMoveTargetDate] = useState('');
  const [moveTargetTime, setMoveTargetTime] = useState('');
  const [isMoving, setIsMoving] = useState(false);
  const [moveError, setMoveError] = useState('');
  
  // New appointment state
  const [newApptDialogOpen, setNewApptDialogOpen] = useState(false);
  const [newAppt, setNewAppt] = useState({ name: '', email: '', phone: '', service: '', barber_name: '', date: '', time: '', notes: '' });
  const [isSavingNew, setIsSavingNew] = useState(false);
  
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const [appointmentsRes, statsRes] = await Promise.all([
        fetch(\`\${API_URL}/appointments\`, { headers: { 'Authorization': \`Bearer \${token}\` } }),
        fetch(\`\${API_URL}/stats\`, { headers: { 'Authorization': \`Bearer \${token}\` } }),
      ]);
      if (!appointmentsRes.ok || !statsRes.ok) throw new Error('Failed to fetch data');
      const appointmentsResult = await appointmentsRes.json();
      const statsResult = await statsRes.json();
      setAppointments(appointmentsResult.data || appointmentsResult);
      setStats(statsResult.data?.stats || statsResult.stats);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Kon gegevens niet laden.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async () => {
    if (!appointmentToDelete) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(\`\${API_URL}/appointments/\${appointmentToDelete.id}\`, {
        method: 'DELETE',
        headers: { 'Authorization': \`Bearer \${token}\` }
      });
      if (!response.ok) throw new Error('Failed to delete');
      await fetchData();
      setDeleteDialogOpen(false);
      setAppointmentToDelete(null);
    } catch (err) {
      console.error('Error deleting:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMove = async () => {
    if (!appointmentToMove || !moveTargetBarber) return;
    setMoveError('');
    setIsMoving(true);
    try {
      const token = localStorage.getItem('token');
      const payload: any = { target_barber_name: moveTargetBarber };
      if (moveTargetDate) payload.date = moveTargetDate;
      if (moveTargetTime) payload.time = moveTargetTime;
      
      const response = await fetch(\`\${API_URL}/admin/appointments/\${appointmentToMove.id}/move\`, {
        method: 'POST',
        headers: { 'Authorization': \`Bearer \${token}\`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Move failed');
      }
      await fetchData();
      setMoveDialogOpen(false);
      setAppointmentToMove(null);
      setMoveTargetBarber('');
      setMoveTargetDate('');
      setMoveTargetTime('');
      setMoveError('');
    } catch (err: any) {
      setMoveError(err.message || 'Verplaatsen mislukt');
    } finally {
      setIsMoving(false);
    }
  };

  const handleNewAppointment = async () => {
    if (!newAppt.name || !newAppt.service || !newAppt.barber_name || !newAppt.date || !newAppt.time) return;
    setIsSavingNew(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(\`\${API_URL}/admin/appointments\`, {
        method: 'POST',
        headers: { 'Authorization': \`Bearer \${token}\`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newAppt, treatment: newAppt.service })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed');
      await fetchData();
      setNewApptDialogOpen(false);
      setNewAppt({ name: '', email: '', phone: '', service: '', barber_name: '', date: '', time: '', notes: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingNew(false);
    }
  };

  const handleLogout = () => { logout(); onNavigate('home'); };

  const appointmentsForDate = appointments.filter(a => a.date === selectedDate);
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
  const handleToday = () => setSelectedDate(new Date().toISOString().split('T')[0]);
  const isTodaySelected = selectedDate === new Date().toISOString().split('T')[0];

  if (isLoading) {
    return (
      <div className="w-full min-h-[calc(100vh-120px)] flex items-center justify-center">
        <div className="flex items-center gap-2 text-stone-500">
          <Loader2 className="h-6 w-6 animate-spin" />Laden...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-[calc(100vh-120px)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={handleLogout} className="bg-[#6b0f1a]">Uitloggen</Button>
        </div>
      </div>
    );
  }

  return (
    <section className="w-full py-8 bg-[#faf9f7] min-h-[calc(100vh-120px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-stone-100">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-[#6b0f1a] data-[state=active]:text-white">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-[#6b0f1a] data-[state=active]:text-white">
              <Settings className="h-4 w-4 mr-1" />Instellingen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-[#1a1a1a] logo-font">Dashboard</h1>
                <p className="text-stone-600">
                  Welkom terug, <span className="font-medium text-[#6b0f1a]">{user?.username}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setNewApptDialogOpen(true)} className="gap-2 border-[#6b0f1a] text-[#6b0f1a] hover:bg-[#6b0f1a] hover:text-white">
                  <Plus className="h-4 w-4" />Nieuwe Afspraak
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPasswordDialogOpen(true)} className="gap-2 border-[#6b0f1a] text-[#6b0f1a]">
                  <KeyRound className="h-4 w-4" />Wachtwoord
                </Button>
                <Button variant={activeView === 'agenda' ? 'default' : 'outline'} size="sm" onClick={() => setActiveView('agenda')}
                  className={activeView === 'agenda' ? 'bg-[#6b0f1a]' : 'border-[#6b0f1a] text-[#6b0f1a]'}>
                  <Calendar className="h-4 w-4 mr-1" />Agenda
                </Button>
                <Button variant={activeView === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setActiveView('list')}
                  className={activeView === 'list' ? 'bg-[#6b0f1a]' : 'border-[#6b0f1a] text-[#6b0f1a]'}>
                  <Users className="h-4 w-4 mr-1" />Lijst
                </Button>
                <Button variant="outline" onClick={handleLogout} className="gap-2 border-[#6b0f1a] text-[#6b0f1a] hover:bg-[#6b0f1a] hover:text-white">
                  <LogOut className="h-4 w-4" />Uitloggen
                </Button>
              </div>
            </div>

            <div className="grid sm:grid-cols-4 gap-4 mb-8">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-stone-500">Totaal</p><p className="text-3xl font-bold text-[#1a1a1a]">{stats.total}</p></div>
                    <div className="w-12 h-12 bg-[#6b0f1a]/10 rounded-full flex items-center justify-center"><Calendar className="h-6 w-6 text-[#6b0f1a]" /></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-stone-500">Aankomend</p><p className="text-3xl font-bold text-[#1a1a1a]">{stats.upcoming}</p></div>
                    <div className="w-12 h-12 bg-[#d4af37]/20 rounded-full flex items-center justify-center"><TrendingUp className="h-6 w-6 text-[#d4af37]" /></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-stone-500">Vandaag</p><p className="text-3xl font-bold text-[#1a1a1a]">{appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).length}</p></div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center"><CheckCircle className="h-6 w-6 text-green-600" /></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-stone-500">Verlopen</p><p className="text-3xl font-bold text-[#1a1a1a]">{stats.past}</p></div>
                    <div className="w-12 h-12 bg-stone-200 rounded-full flex items-center justify-center"><Clock className="h-6 w-6 text-stone-600" /></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {activeView === 'agenda' ? (
              <>
                <div className="flex items-center justify-between mb-4 bg-white rounded-lg shadow-lg p-4">
                  <Button variant="ghost" onClick={handlePrevDay} className="text-[#6b0f1a] hover:bg-[#6b0f1a]/10">
                    <ChevronLeft className="h-5 w-5 mr-1" />Vorige dag
                  </Button>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg text-[#1a1a1a]">
                      {format(parseISO(selectedDate), 'EEEE d MMMM yyyy', { locale: nl })}
                    </span>
                    {!isTodaySelected && (
                      <Button size="sm" onClick={handleToday} className="bg-[#d4af37] text-[#1a1a1a] hover:bg-[#b8941f]">
                        Vandaag
                      </Button>
                    )}
                  </div>
                  <Button variant="ghost" onClick={handleNextDay} className="text-[#6b0f1a] hover:bg-[#6b0f1a]/10">
                    Volgende dag<ChevronRight className="h-5 w-5 ml-1" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {barbersAgenda.map(({ key, name, color }) => {
                    const barberAppointments = appointmentsByBarber(key);
                    return (
                      <Card key={key} className="border-0 shadow-lg overflow-hidden">
                        <div className={\`\${color.bg} px-4 py-3 flex items-center justify-between\`}>
                          <div>
                            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                              <User className="h-5 w-5" />{name}
                            </h3>
                            <p className="text-white/80 text-xs">{barberAppointments.length} afspraak/pen</p>
                          </div>
                        </div>
                        <CardContent className="p-2">
                          <div className="space-y-0.5">
                            {timeSlots.map((time) => {
                              const apt = barberAppointments.find(a => a.time === time);
                              return (
                                <div key={time} className={\`flex items-stretch min-h-[44px] rounded-lg transition-colors \${apt ? \`\${color.light} border \${color.border}\` : ''}\`}>
                                  <div className={\`w-14 flex-shrink-0 flex items-start pt-2 px-2 text-xs font-medium \${apt ? 'text-stone-500' : 'text-stone-200'}\`}>{time}</div>
                                  <div className="flex-1 min-w-0 py-1.5 pr-2">
                                    {apt ? (
                                      <div className="group relative">
                                        <p className={\`text-sm font-semibold \${color.text} truncate\`}>{apt.name}</p>
                                        <p className="text-xs text-stone-500 truncate">{serviceNames[apt.service] || apt.service}</p>
                                        {apt.notes && <p className="text-xs text-stone-400 truncate">{apt.notes}</p>}
                                        <div className="absolute -top-1 -right-1 flex gap-0.5">
                                          <button onClick={() => { setAppointmentToMove(apt); setMoveDialogOpen(true); }} 
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 hover:text-blue-700 bg-white rounded-full p-1 shadow-sm" title="Verplaatsen">
                                            <ArrowRight className="h-3.5 w-3.5" />
                                          </button>
                                          <button onClick={() => { setAppointmentToDelete(apt); setDeleteDialogOpen(true); }} 
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 bg-white rounded-full p-1 shadow-sm" title="Verwijderen">
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-xs text-stone-100 italic">---</div>
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
                    <Users className="h-5 w-5 text-[#d4af37]" />Alle Afspraken
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <Tabs defaultValue="all">
                    <TabsList className="mb-6 bg-stone-100">
                      <TabsTrigger value="today" className="data-[state=active]:bg-[#6b0f1a] data-[state=active]:text-white">Vandaag</TabsTrigger>
                      <TabsTrigger value="upcoming" className="data-[state=active]:bg-[#6b0f1a] data-[state=active]:text-white">Aankomend</TabsTrigger>
                      <TabsTrigger value="past" className="data-[state=active]:bg-[#6b0f1a] data-[state=active]:text-white">Verlopen</TabsTrigger>
                      <TabsTrigger value="all" className="data-[state=active]:bg-[#6b0f1a] data-[state=active]:text-white">Alles</TabsTrigger>
                    </TabsList>
                    <TabsContent value="all">
                      <div className="space-y-4">
                        {appointments.map(a => <AppointmentListItem key={a.id} appointment={a} onDelete={() => { setAppointmentToDelete(a); setDeleteDialogOpen(true); }} onMove={() => { setAppointmentToMove(a); setMoveDialogOpen(true); }} />)}
                        {appointments.length === 0 && <EmptyState />}
                      </div>
                    </TabsContent>
                    <TabsContent value="today">
                      <div className="space-y-4">
                        {appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).map(a => <AppointmentListItem key={a.id} appointment={a} onDelete={() => { setAppointmentToDelete(a); setDeleteDialogOpen(true); }} onMove={() => { setAppointmentToMove(a); setMoveDialogOpen(true); }} />)}
                        {appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).length === 0 && <EmptyState text="Geen afspraken voor vandaag" />}
                      </div>
                    </TabsContent>
                    <TabsContent value="upcoming">
                      <div className="space-y-4">
                        {appointments.filter(a => a.date >= new Date().toISOString().split('T')[0]).map(a => <AppointmentListItem key={a.id} appointment={a} onDelete={() => { setAppointmentToDelete(a); setDeleteDialogOpen(true); }} onMove={() => { setAppointmentToMove(a); setMoveDialogOpen(true); }} />)}
                        {appointments.filter(a => a.date >= new Date().toISOString().split('T')[0]).length === 0 && <EmptyState text="Geen aankomende afspraken" />}
                      </div>
                    </TabsContent>
                    <TabsContent value="past">
                      <div className="space-y-4">
                        {appointments.filter(a => a.date < new Date().toISOString().split('T')[0]).map(a => <AppointmentListItem key={a.id} appointment={a} onDelete={() => { setAppointmentToDelete(a); setDeleteDialogOpen(true); }} onMove={() => { setAppointmentToMove(a); setMoveDialogOpen(true); }} />)}
                        {appointments.filter(a => a.date < new Date().toISOString().split('T')[0]).length === 0 && <EmptyState text="Geen verlopen afspraken" />}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-center">Afspraak Verwijderen</DialogTitle>
            <DialogDescription className="text-center">
              Weet je zeker dat je de afspraak van <strong>{appointmentToDelete?.name}</strong> op{' '}
              {appointmentToDelete && format(parseISO(appointmentToDelete.date), 'd MMMM', { locale: nl })} om {appointmentToDelete?.time} wilt verwijderen?
              <br /><br /><span className="text-red-600">Deze actie kan niet ongedaan worden gemaakt.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>Annuleren</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Verwijderen...</> : 'Verwijderen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Dialog - met datum en tijd keuze */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Afspraak Verplaatsen</DialogTitle>
            <DialogDescription>
              Verplaats de afspraak van <strong>{appointmentToMove?.name}</strong>. Je kunt de kapper, datum en/of tijd aanpassen.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label>Huidige afspraak</Label>
              <div className="mt-1 p-3 bg-stone-50 rounded-lg text-sm">
                <p><strong>Kapper:</strong> {getBarberDisplayName(appointmentToMove?.barber_name || '')}</p>
                <p><strong>Datum:</strong> {format(parseISO(appointmentToMove?.date || ''), 'EEEE d MMMM yyyy', { locale: nl })}</p>
                <p><strong>Tijd:</strong> {appointmentToMove?.time}</p>
              </div>
            </div>
            <div>
              <Label>Verplaats naar kapper</Label>
              <select className="w-full mt-1 p-2 border rounded" value={moveTargetBarber} onChange={(e) => setMoveTargetBarber(e.target.value)}>
                <option value="">Zelfde kapper (alleen tijd wijzigen)</option>
                <option value="mo">Mo</option>
                <option value="ma">Ma</option>
                <option value="third">Derde kapper</option>
              </select>
            </div>
            <div>
              <Label>Nieuwe datum <span className="text-stone-400 text-xs">(optioneel)</span></Label>
              <Input type="date" value={moveTargetDate} onChange={(e) => setMoveTargetDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Nieuwe tijd <span className="text-stone-400 text-xs">(optioneel)</span></Label>
              <select className="w-full mt-1 p-2 border rounded" value={moveTargetTime} onChange={(e) => setMoveTargetTime(e.target.value)}>
                <option value="">Zelfde tijd</option>
                {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {moveError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />{moveError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setMoveDialogOpen(false); setMoveTargetBarber(''); setMoveTargetDate(''); setMoveTargetTime(''); setMoveError(''); }}>Annuleren</Button>
            <Button onClick={handleMove} disabled={isMoving} className="bg-[#6b0f1a]">
              {isMoving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Bezig...</> : 'Verplaatsen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Appointment Dialog */}
      <Dialog open={newApptDialogOpen} onOpenChange={setNewApptDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nieuwe Afspraak</DialogTitle>
            <DialogDescription>Voeg handmatig een afspraak toe aan een kapper.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label>Naam *</Label>
              <Input value={newAppt.name} onChange={(e) => setNewAppt({...newAppt, name: e.target.value})} placeholder="Klant naam" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>E-mail</Label>
                <Input type="email" value={newAppt.email} onChange={(e) => setNewAppt({...newAppt, email: e.target.value})} placeholder="email@nl" />
              </div>
              <div>
                <Label>Telefoon</Label>
                <Input value={newAppt.phone} onChange={(e) => setNewAppt({...newAppt, phone: e.target.value})} placeholder="06-" />
              </div>
            </div>
            <div>
              <Label>Behandeling *</Label>
              <select className="w-full mt-1 p-2 border rounded" value={newAppt.service} onChange={(e) => setNewAppt({...newAppt, service: e.target.value})}>
                <option value="">Selecteer...</option>
                {serviceOptions.map(s => <option key={s.key} value={s.key}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <Label>Kapper *</Label>
              <select className="w-full mt-1 p-2 border rounded" value={newAppt.barber_name} onChange={(e) => setNewAppt({...newAppt, barber_name: e.target.value})}>
                <option value="">Selecteer...</option>
                <option value="mo">Mo</option>
                <option value="ma">Ma</option>
                <option value="third">Derde kapper</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Datum *</Label>
                <Input type="date" value={newAppt.date} onChange={(e) => setNewAppt({...newAppt, date: e.target.value})} />
              </div>
              <div>
                <Label>Tijd *</Label>
                <select className="w-full mt-1 p-2 border rounded" value={newAppt.time} onChange={(e) => setNewAppt({...newAppt, time: e.target.value})}>
                  <option value="">Selecteer...</option>
                  {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label>Opmerkingen</Label>
              <Textarea value={newAppt.notes} onChange={(e) => setNewAppt({...newAppt, notes: e.target.value})} placeholder="Optioneel" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewApptDialogOpen(false)}>Annuleren</Button>
            <Button onClick={handleNewAppointment} disabled={!newAppt.name || !newAppt.service || !newAppt.barber_name || !newAppt.date || !newAppt.time || isSavingNew} className="bg-[#6b0f1a]">
              {isSavingNew ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Bezig...</> : 'Toevoegen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {passwordDialogOpen && <PasswordChangeDialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} />}
    </section>
  );
}

function EmptyState({ text = 'Geen afspraken gevonden
