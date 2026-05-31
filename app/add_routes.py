# coding: utf-8
import re
with open("server/adminRoutes.cjs", "r", encoding="utf-8") as f:
    content = f.read()

new_routes = '''

  // ========== FOTO BEHEER ==========

  router.get('/photos', authenticateToken, (req, res) => {
    db.all('SELECT id, filename, caption, uploaded_at, sort_order FROM photos ORDER BY sort_order ASC, uploaded_at DESC', 
      (err, rows) => {
        if (err) return res.status(500).json({ success: false, error: "Fotos ophalen mislukt" });
        res.json({ success: true, data: rows || [] });
      }
    );
  });

  // ========== RAPPORTAGE ==========

  router.get('/report', authenticateToken, (req, res) => {
    const { from, to } = req.query;
    let query = 'SELECT *, treatment as service FROM appointments WHERE status = "active"';
    const params = [];

    if (from) { query += ' AND date >= ?'; params.push(from); }
    if (to) { query += ' AND date <= ?'; params.push(to); }
    query += ' ORDER BY date ASC, time ASC';

    db.all(query, params, (err, rows) => {
      if (err) return res.status(500).json({ success: false, error: 'Rapport ophalen mislukt' });

      const totalAppointments = rows ? rows.length : 0;
      const prices = { "knippen-stylen": 26, "knippen-baard": 37.5, "senioren": 22, "tondeuse": 19, "baard": 20, "baard-nek": 21, "jong-tm11": 21, "jong-12-13": 25 };
      const totalRevenue = rows ? rows.reduce((sum, r) => sum + (prices[r.treatment] || 0), 0) : 0;

      const perBarber = {};
      if (rows) {
        rows.forEach(r => {
          if (!perBarber[r.barber_name]) perBarber[r.barber_name] = { count: 0, revenue: 0 };
          perBarber[r.barber_name].count++;
          perBarber[r.barber_name].revenue += prices[r.treatment] || 0;
        });
      }

      res.json({
        success: true,
        data: {
          appointments: rows || [],
          stats: { total: totalAppointments, revenue: totalRevenue, perBarber }
        }
      });
    });
  });
'''

content = content.replace('  return router;\n};', new_routes + '\n  return router;\n};')
with open("server/adminRoutes.cjs", "w", encoding="utf-8") as f:
    f.write(content)
print("Done! Added photos and report routes to adminRoutes.cjs")
