import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, FileText, Download, TrendingUp, Users, Scissors, Clock, Award } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface ReportData {
  period: { from: string; to: string };
  totalAppointments: number;
  totalRevenue: number;
  uniqueCustomers: number;
  perService: { name: string; count: number; revenue: number }[];
  barberDistribution: { name: string; count: number }[];
  busiestDay: { date: string; time: string; count: number } | null;
}

export function AdminReports() {
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');

  const generateReport = async () => {
    if (!fromDate || !toDate) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/admin/report?from=${fromDate}&to=${toDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) setReport(data.data);
    } catch (err) {
      console.error('Rapport fout:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!report) return;
    let csv = 'Periode,' + report.period.from + ' tot ' + report.period.to + '\n';
    csv += 'Totaal afspraken,' + report.totalAppointments + '\n';
    csv += 'Totaal omzet (€),' + report.totalRevenue.toFixed(2) + '\n';
    csv += 'Unieke klanten,' + report.uniqueCustomers + '\n\n';
    
    if (report.busiestDay) {
      csv += 'Drukste dag,' + report.busiestDay.date + ' om ' + report.busiestDay.time + ' (' + report.busiestDay.count + ' afspraken)\n\n';
    }
    
    csv += 'Behandeling,Aantal,Omzet (€)\n';
    report.perService.forEach(s => {
      csv += s.name + ',' + s.count + ',' + s.revenue.toFixed(2) + '\n';
    });
    
    csv += '\nKapper,Aantal\n';
    report.barberDistribution.forEach(b => {
      csv += b.name + ',' + b.count + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_${report.period.from}_${report.period.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadHTML = () => {
    if (!report) return;
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Rapport ${report.period.from} - ${report.period.to}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
  h1 { color: #6b0f1a; border-bottom: 3px solid #d4af37; padding-bottom: 10px; }
  .period { color: #666; font-size: 14px; }
  .summary { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin: 24px 0; }
  .stat { background: #faf9f7; padding: 16px; border-radius: 8px; text-align: center; }
  .stat .value { font-size: 28px; font-weight: bold; color: #6b0f1a; }
  .stat .label { font-size: 12px; color: #888; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th { background: #6b0f1a; color: white; padding: 10px; text-align: left; }
  td { padding: 8px 10px; border-bottom: 1px solid #eee; }
  .barber-table th { background: #d4af37; color: #1a1a1a; }
  h2 { color: #6b0f1a; margin-top: 32px; }
  .busiest { background: #fff3cd; padding: 12px; border-radius: 8px; margin: 16px 0; }
</style></head><body>
<h1>Barbershop Mo&amp;Ma - Rapport</h1>
<p class="period">Periode: ${report.period.from} t/m ${report.period.to}</p>
<div class="summary">
  <div class="stat"><div class="value">${report.totalAppointments}</div><div class="label">Afspraken</div></div>
  <div class="stat"><div class="value">&euro;${report.totalRevenue.toFixed(2)}</div><div class="label">Omzet</div></div>
  <div class="stat"><div class="value">${report.uniqueCustomers}</div><div class="label">Unieke klanten</div></div>
  <div class="stat"><div class="value">${report.barberDistribution.length}</div><div class="label">Kappers actief</div></div>
</div>
${report.busiestDay ? `<div class="busiest"><strong>Drukste dag:</strong> ${report.busiestDay.date} om ${report.busiestDay.time} (${report.busiestDay.count} afspraken)</div>` : ''}
<h2>Per Behandeling</h2>
<table><tr><th>Behandeling</th><th>Aantal</th><th>Omzet</th></tr>
${report.perService.map(s => `<tr><td>${s.name}</td><td>${s.count}</td><td>&euro;${s.revenue.toFixed(2)}</td></tr>`).join('')}
</table>
<h2>Verdeling per Kapper</h2>
<table class="barber-table"><tr><th>Kapper</th><th>Aantal</th></tr>
${report.barberDistribution.map(b => `<tr><td>${b.name}</td><td>${b.count}</td></tr>`).join('')}
</table>
<p style="margin-top:40px;font-size:12px;color:#999;">Gegenereerd op ${new Date().toLocaleDateString('nl-NL')}</p>
</body></html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_${report.period.from}_${report.period.to}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#1a1a1a] logo-font mb-8">Rapportage</h1>

      <Card className="border-0 shadow-lg mb-6">
        <CardHeader className="bg-gradient-to-r from-[#6b0f1a] to-[#8b1523]">
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#d4af37]" />Rapport Genereren
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>Vanaf datum</Label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div>
              <Label>Tot datum</Label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button onClick={generateReport} disabled={loading || !fromDate || !toDate} className="w-full bg-[#6b0f1a]">
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Genereren...</> : 'Rapport Genereren'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {report && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-6 w-6 text-[#6b0f1a] mx-auto mb-2" />
                <p className="text-3xl font-bold text-[#1a1a1a]">{report.totalAppointments}</p>
                <p className="text-sm text-stone-500">Afspraken</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <Award className="h-6 w-6 text-[#d4af37] mx-auto mb-2" />
                <p className="text-3xl font-bold text-[#1a1a1a]">&euro;{report.totalRevenue.toFixed(2)}</p>
                <p className="text-sm text-stone-500">Omzet</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <Users className="h-6 w-6 text-[#6b0f1a] mx-auto mb-2" />
                <p className="text-3xl font-bold text-[#1a1a1a]">{report.uniqueCustomers}</p>
                <p className="text-sm text-stone-500">Unieke klanten</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <Clock className="h-6 w-6 text-[#d4af37] mx-auto mb-2" />
                <p className="text-3xl font-bold text-[#1a1a1a]">{report.barberDistribution.length}</p>
                <p className="text-sm text-stone-500">Kappers</p>
              </CardContent>
            </Card>
          </div>

          {/* Download knoppen */}
          <div className="flex gap-4 mb-6">
            <Button onClick={downloadHTML} className="bg-[#6b0f1a]">
              <Download className="h-4 w-4 mr-2" />Download als HTML
            </Button>
            <Button onClick={downloadCSV} variant="outline" className="border-[#6b0f1a] text-[#6b0f1a]">
              <Download className="h-4 w-4 mr-2" />Download als CSV
            </Button>
          </div>

          {/* Per service */}
          <Card className="border-0 shadow-lg mb-6">
            <CardHeader className="bg-gradient-to-r from-[#6b0f1a] to-[#8b1523]">
              <CardTitle className="text-white flex items-center gap-2">
                <Scissors className="h-5 w-5 text-[#d4af37]" />Per Behandeling
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-stone-500">
                      <th className="pb-3 pr-4">Behandeling</th>
                      <th className="pb-3 pr-4 text-right">Aantal</th>
                      <th className="pb-3 pr-4 text-right">Omzet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.perService.map((s, i) => (
                      <tr key={i} className="border-b border-stone-100">
                        <td className="py-3 font-medium">{s.name}</td>
                        <td className="py-3 text-right">{s.count}</td>
                        <td className="py-3 text-right font-bold">&euro;{s.revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-[#6b0f1a]">
                      <td className="py-3 font-bold">Totaal</td>
                      <td className="py-3 text-right font-bold">{report.totalAppointments}</td>
                      <td className="py-3 text-right font-bold text-[#6b0f1a]">&euro;{report.totalRevenue.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Per kapper */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#6b0f1a] to-[#8b1523]">
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-[#d4af37]" />Verdeling per Kapper
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-stone-500">
                      <th className="pb-3 pr-4">Kapper</th>
                      <th className="pb-3 pr-4 text-right">Aantal</th>
                      <th className="pb-3 pr-4 text-right">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.barberDistribution.map((b, i) => (
                      <tr key={i} className="border-b border-stone-100">
                        <td className="py-3 font-medium">{b.name}</td>
                        <td className="py-3 text-right">{b.count}</td>
                        <td className="py-3 text-right">
                          {report.totalAppointments > 0
                            ? ((b.count / report.totalAppointments) * 100).toFixed(1) + '%'
                            : '0%'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {report.busiestDay && (
            <Card className="border-0 shadow-lg mt-6 bg-amber-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Clock className="h-6 w-6 text-amber-600" />
                  <div>
                    <p className="font-bold text-amber-800">Drukste dag/tijdstip</p>
                    <p className="text-amber-700">
                      {report.busiestDay.date} om {report.busiestDay.time} — {report.busiestDay.count} afspraken
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!report && !loading && (
        <div className="text-center py-20 text-stone-500">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Selecteer een periode en genereer een rapport</p>
        </div>
      )}
    </div>
  );
}
