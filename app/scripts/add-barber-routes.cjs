const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'server', 'adminRoutes.cjs');
let c = fs.readFileSync(file, 'utf8');

// Voeg kapper routes toe vóór de return router
const barberRoutes = `
  // ========== KAPPER BEHEER ==========

  // GET /api/admin/barbers - alle kappers
  router.get('/barbers', authenticateToken, (req, res) => {
    db.all('SELECT id, name, display_name, is_active, created_at FROM barbers ORDER BY display_name ASC', (err, rows) => {
      if (err) return res.status(500).json({ success: false, error: 'Kappers ophalen mislukt' });
      res.json({ success: true, data: rows || [] });
    });
  });

  // POST /api/admin/barbers - nieuwe kapper
  router.post('/barbers', authenticateToken, (req, res) => {
    const { name, display_name } = req.body;
    if (!name || !display_name) {
      return res.status(400).json({ success: false, error: 'Naam (key) en weergavenaam zijn verplicht' });
    }
    db.get('SELECT id FROM barbers WHERE name = ?', [name], (err, existing) => {
      if (err) return res.status(500).json({ success: false, error: 'Database fout' });
      if (existing) return res.status(409).json({ success: false, error: 'Kapper met deze key bestaat al' });
      db.run('INSERT INTO barbers (name, display_name, is_active) VALUES (?, ?, 1)',
        [name, display_name],
        function(err2) {
          if (err2) return res.status(500).json({ success: false, error: 'Aanmaken mislukt' });
          res.status(201).json({ success: true, data: { id: this.lastID, name, display_name, is_active: 1 } });
        }
      );
    });
  });

  // PUT /api/admin/barbers/:name - kapper bijwerken
  router.put('/barbers/:name', authenticateToken, (req, res) => {
    const { display_name, is_active } = req.body;
    db.run('UPDATE barbers SET display_name=?, is_active=? WHERE name=?',
      [display_name, is_active !== undefined ? (is_active ? 1 : 0) : 1, req.params.name],
      function(err) {
        if (err) return res.status(500).json({ success: false, error: 'Bijwerken mislukt' });
        if (this.changes === 0) return res.status(404).json({ success: false, error: 'Kapper niet gevonden' });
        res.json({ success: true, message: 'Kapper bijgewerkt' });
      }
    );
  });

  // DELETE /api/admin/barbers/:name - kapper verwijderen
  router.delete('/barbers/:name', authenticateToken, (req, res) => {
    const { name } = req.params;
    db.get('SELECT COUNT(*) as cnt FROM appointments WHERE barber_name=? AND status="active"', [name], (err, row) => {
      if (err) return res.status(500).json({ success: false, error: 'Database fout' });
      if (row && row.cnt > 0) {
        return res.status(400).json({ success: false, error: 'Deze kapper heeft nog ' + row.cnt + ' actieve afspraken. Zet eerst de status op inactief.' });
      }
      db.run('DELETE FROM barbers WHERE name=?', [name], function(err2) {
        if (err2) return res.status(500).json({ success: false, error: 'Verwijderen mislukt' });
        if (this.changes === 0) return res.status(404).json({ success: false, error: 'Kapper niet gevonden' });
        res.json({ success: true, message: 'Kapper verwijderd' });
      });
    });
  });
`;

// Voeg de barber routes toe vóór "return router;"
c = c.replace('  return router;', barberRoutes + '\n  return router;');

fs.writeFileSync(file, c, 'utf8');
console.log('Kapper routes toegevoegd aan adminRoutes.cjs');
