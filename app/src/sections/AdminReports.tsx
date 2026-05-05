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
function generateReportHTML(r: any) {
  const esc = (s: any) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  let h = '<!DOCTYPE html><html lang="nl"><head><meta charset="UTF-8"><title>Rapport ' + r.period.from + ' t/m ' + r.period.to + '</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#333}h1{color:#6b0f1a;border-bottom:2px solid #d4af37;padding-bottom:10px}.stats{display:flex;gap:20px;margin:20px 0}.stat-card{background:#f5f5f5;padding:20px;border-radius:8px;text-align:center;min-width:150px}.stat-card .number{font-size:28px;font-weight:bold;color:#6b0f1a}.stat-card .label{font-size:12px;color:#666}table{width:100%;border-collapse:collapse;margin:15px 0}th{background:#6b0f1a;color:white;padding:10px;text-align:left}td{padding:10px;border-bottom:1px solid #ddd}.footer{margin-top:40px;font-size:12px;color:#999;text-align:center}@media print{body{padding:20px}}</style></head><body>';
  h += '<h1>Barbershop Mo&amp;Ma - Rapport</h1><p>Periode: <strong>' + r.period.from + '</strong> t/m <strong>' + r.period.to + '</strong></p>';
  h += '<div class="stats"><div class="stat-card"><div class="number">' + r.totalAppointments + '</div><div class="label">Afspraken</div></div>';
  h += '<div class="stat-card"><div class="number">€' + r.totalRevenue.toFixed(2) + '</div><div class="label">Omzet</div></div>';
  h += '<div class="stat-card"><div class="number">' + r.uniqueCustomers + '</div><div class="label">Klanten</div></div></div>';
  h += '<h2>Omzet per Behandeling</h2><table><tr><th>Behandeling</th><th>Aantal</th><th>Omzet</th></tr>';
  r.perService.forEach((s: any) => { h += '<tr><td>' + esc(s.name) + '</td><td>' + s.count + '</td><td>€' + s.revenue.toFixed(2) + '</td></tr>'; });
  h += '<tr><td><strong>TOTAAL</strong></td><td>' + r.totalAppointments + '</td><td>€' + r.totalRevenue.toFixed(2) + '</td></tr></table>';
  h += '<h2>Per Kapper</h2><table><tr><th>Kapper</th><th>Aantal</th></tr>';
  r.barberDistribution.forEach((b: any) => { h += '<tr><td>' + esc(b.name) + '</td><td>' + b.count + '</td></tr>'; });
  h += '</table><div class="footer"><p>Barbershop Mo&amp;Ma - W.J. Tuijnstraat 14A, Volendam</p><p>Gegenereerd ' + new Date().toLocaleDateString('nl-NL') + '</p></div></body></html>';
  return h;
}
export function AdminReports() {
  const [fromDate, setFromDate] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 3); return d.toISOString().split('T')[0]; });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');
  const generateReport = async () => {
    if (!fromDate || !toDate) return;
    setLoading(true);
    try {
      const res = await fetch(API_URL + '/admin/report?from=' + fromDate + '&to=' + toDate, { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      if (data.success) setReport(data.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };
  const downloadPDF = () => {
    if (!report) return;
    const html = generateReportHTML(report);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };
  const downloadExcel = () => {
    if (!report) return;
    let csv = 'Behandeling;Aantal;Omzet\n';
    report.perService.forEach((s: any) => { csv += s.name + ';' + s.count + ';€' + s.revenue.toFixed(2).replace('.', ',') + '\n'; });
    csv += 'TOTAAL;' + report.totalAppointments + ';€' + report.totalRevenue.toFixed(2).replace('.', ',') + '\n\n';
    csv += 'Kapper;Aantal\n';
    report.barberDistribution.forEach((b: any) => { csv += b.name + ';' + b.count + '\n'; });
    csv += '\nPeriode;' + report.period.from + ' t/m ' + report.period.to + '\n';
    csv += 'Totaal;' + report.totalAppointments + '\nKlanten;' + report.uniqueCustomers + '\n';
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rapport_' + report.period.from + '_' + report.period.to + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  const downloadHTML = () => {
    if (!report) return;
    const html = generateReportHTML(report);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rapport_' + report.period.from + '_' + report.period.to + '.html';
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div>
      <h1 className="text-3xl font-bold text-[#1a1a1a] logo-font mb-8">Rapportage</h1>
      <Card className="border-0 shadow-lg mb-6">
        <CardHeader className="bg-gradient-to-r from-[#6b0f1a] to-[#8b1523]"><CardTitle className="text-white flex items-center gap-2"><FileText className="h-5 w-5 text-[#d4af37]" />Rapport Genereren</CardTitle></CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><Label>Vanaf datum</Label><Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></div>
            <div><Label>Tot datum</Label><Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} /></div>
            <div className="flex items-end"><Button onClick={generateReport} disabled={loading || !fromDate || !toDate} className="w-full bg-[#6b0f1a]">{loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Genereren...</> : 'Rapport Genereren'}</Button></div>
          </div>
        </CardContent>
      </Card>
      {report && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <Card className="border-0 shadow-lg"><CardContent className="p-6 text-center"><TrendingUp className="h-6 w-6 text-[#6b0f1a] mx-auto mb-2" /><p className="text-3xl font-bold text-[#1a1a1a]">{report.totalAppointments}</p><p className="text-sm text-stone-500">Afspraken</p></CardContent></Card>
            <Card className="border-0 shadow-lg"><CardContent className="p-6 text-center"><Award className="h-6 w-6 text-[#d4af37] mx-auto mb-2" /><p className="text-3xl font-bold text-[#1a1a1a]">€{report.totalRevenue.toFixed(2)}</p><p className="text-sm text-stone-500">Omzet</p></CardContent></Card>
            <Card className="border-0 shadow-lg"><CardContent className="p-6 text-center"><Users className="h-6 w-6 text-[#6b0f1a] mx-auto mb-2" /><p className="text-3xl font-bold text-[#1a1a1a]">{report.uniqueCustomers}</p><p className="text-sm text-stone-500">Klanten</p></CardContent></Card>
            <Card className="border-0 shadow-lg"><CardContent className="p-6 text-center"><Clock className="h-6 w-6 text-[#d4af37] mx-auto mb-2" /><p className="text-3xl font-bold text-[#1a1a1a]">{report.barberDistribution.length}</p><p className="text-sm text-stone-500">Kappers</p></CardContent></Card>
          </div>
          <div className="flex gap-3 mb-6 flex-wrap">
            <Button onClick={downloadPDF} className="bg-[#6b0f1a]"><Download className="h-4 w-4 mr-2" />Download als PDF</Button>
            <Button onClick={downloadExcel} variant="outline" className="border-[#6b0f1a] text-[#6b0f1a]"><Download className="h-4 w-4 mr-2" />Download als Excel (CSV)</Button>
            <Button onClick={downloadHTML} variant="outline" className="border-stone-400 text-stone-600"><Download className="h-4 w-4 mr-2" />HTML</Button>
          </div>
          <Card className="border-0 shadow-lg mb-6">
            <CardHeader className="bg-gradient-to-r from-[#6b0f1a] to-[#8b1523]"><CardTitle className="text-white flex items-center gap-2"><Scissors className="h-5 w-5 text-[#d4af37]" />Per Behandeling</CardTitle></CardHeader>
            <CardContent className="p-6">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-stone-500"><th className="pb-3 pr-4">Behandeling</th><th className="pb-3 pr-4 text-right">Aantal</th><th className="pb-3 pr-4 text-right">Omzet</th></tr></thead>
                <tbody>
                  {report.perService.map((s: any, i: number) => <tr key={i} className="border-b border-stone-100"><td className="py-3 font-medium">{s.name}</td><td className="py-3 text-right">{s.count}</td><td className="py-3 text-right font-bold">€{s.revenue.toFixed(2)}</td></tr>)}
                  <tr className="border-t-2 border-[#6b0f1a]"><td className="py-3 font-bold">Totaal</td><td className="py-3 text-right font-bold">{report.totalAppointments}</td><td className="py-3 text-right font-bold text-[#6b0f1a]">€{report.totalRevenue.toFixed(2)}</td></tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}



