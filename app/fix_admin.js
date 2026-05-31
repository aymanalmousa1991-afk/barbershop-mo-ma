const fs = require('fs');

// ===== AdminReports.tsx =====
let c = fs.readFileSync('src/sections/AdminReports.tsx', 'utf8');

// Add generateReportHTML function
c = c.replace('export function AdminReports()',
`function generateReportHTML(r) {
  const rows = r.perService.map(s => \`<tr><td>\${escHtml(s.name)}</td><td>\${s.count}</td><td>€\${s.revenue.toFixed(2)}</td></tr>\`).join('');
  const barberRows = r.barberDistribution.map(b => \`<tr><td>\${escHtml(b.name)}</td><td>\${b.count}</td></tr>\`).join('');
  const fmt = (n) => '€' + n.toFixed(2);
  return \`<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><title>Rapport \${r.period.from} t/m \${r.period.to}</title>
<style>
  body{font-family:Arial,sans-serif;padding:40px;color:#333}
  h1{color:#6b0f1a;border-bottom:2px solid #d4af37;padding-bottom:10px}
  .stats{display:flex;gap:20px;margin:20px 0;flex-wrap:wrap}
  .stat-card{background:#f5f5f5;padding:20px;border-radius:8px;text-align:center;min-width:150px}
  .stat-card .number{font-size:28px;font-weight:bold;color:#6b0f1a}
  .stat-card .label{font-size:12px;color:#666;margin-top:5px}
  table{width:100%;border-collapse:collapse;margin:15px 0}
  th{background:#6b0f1a;color:white;padding:10px;text-align:left}
  td{padding:10px;border-bottom:1px solid #ddd}
  tr:last-child td{font-weight:bold;border-top:2px solid #6b0f1a;background:#faf9f7}
  .footer{margin-top:40px;font-size:12px;color:#999;text-align:center}
  @media print{body{padding:20px}}
</style></head>
<body>
  <h1>Barbershop Mo&amp;Ma - Rapport</h1>
  <p>Periode: <strong>\${r.period.from}</strong> t/m <strong>\${r.period.to}</strong></p>
  <div class="stats">
    <div class="stat-card"><div class="number">\${r.totalAppointments}</div><div class="label">Totaal Afspraken</div></div>
    <div class="stat-card"><div class="number">\${fmt(r.totalRevenue)}</div><div class="label">Totale Omzet</div></div>
    <div class="stat-card"><div class="number">\${r.uniqueCustomers}</div><div class="label">Unieke Klanten</div></div>
  </div>
  <h2>Omzet per Behandeling</h2>
  <table>
    <tr><th>Behandeling</th><th>Aantal</th><th>Omzet</th></tr>
    \${rows}
    <tr><td><strong>TOTAAL</strong></td><td><strong>\${r.totalAppointments}</strong></td><td><strong>\${fmt(r.totalRevenue)}</strong></td></tr>
  </table>
  <h2>Verdeling per Kapper</h2>
  <table>
    <tr><th>Kapper</th><th>Aantal</th></tr>
    \${barberRows}
  </table>
  <div class="footer">
    <p>Barbershop Mo&amp;Ma &mdash; W. J. Tuijnstraat 14A, Volendam &mdash; 06-85171198</p>
    <p>Gegenereerd op \${new Date().toLocaleDateString('nl-NL')}</p>
  </div>
</body></html>\`;
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

export function AdminReports()`
);

// Add downloadPDF and downloadExcel functions
c = c.replace('const downloadHTML',
`const downloadPDF = () => {
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
    let csv = 'Behandeling;Aantal;Omzet\\n';
    report.perService.forEach(s => {
      csv += \`"\${s.name}";\${s.count};€\${s.revenue.toFixed(2).replace('.', ',')}\\n\`;
    });
    csv += \`"TOTAAL";\${report.totalAppointments};€\${report.totalRevenue.toFixed(2).replace('.', ',')}\\n\\n\`;
    csv += 'Kapper;Aantal\\n';
    report.barberDistribution.forEach(b => {
      csv += \`"\${b.name}";\${b.count}\\n\`;
    });
    csv += \`\\nPeriode;\${report.period.from} t/m \${report.period.to}\\n\`;
    csv += \`Totaal afspraken;\${report.totalAppointments}\\n\`;
    csv += \`Unieke klanten;\${report.uniqueCustomers}\\n\`;
    const blob = new Blob(['\\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rapport_' + report.period.from + '_' + report.period.to + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadHTML`
);

// Replace download buttons
c = c.replace('<Button onClick={downloadHTML} className="bg-[#6b0f1a]"><Download className="h-4 w-4 mr-2" />Download als HTML</Button>',
`<div className="flex gap-3 mb-6 flex-wrap">
            <Button onClick={downloadPDF} className="bg-[#6b0f1a]"><Download className="h-4 w-4 mr-2" />Download als PDF</Button>
            <Button onClick={downloadExcel} variant="outline" className="border-[#6b0f1a] text-[#6b0f1a]"><Download className="h-4 w-4 mr-2" />Download als Excel (CSV)</Button>
            <Button onClick={downloadHTML} variant="outline" className="border-stone-400 text-stone-600"><Download className="h-4 w-4 mr-2" />HTML</Button>
          </div>`
);

fs.writeFileSync('src/sections/AdminReports.tsx', c);
console.log('AdminReports.tsx updated successfully');
