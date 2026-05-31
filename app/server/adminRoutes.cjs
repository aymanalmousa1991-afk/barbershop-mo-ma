/**
 * Admin routes voor Mo&Ma Barbershop
 * Nieuwe functionaliteiten: wachtwoord reset, services beheer, afwezigheid, verplaatsen
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Multer configuratie voor foto uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/photos'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});
const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowed = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Alleen afbeeldingen zijn toegestaan (jpg, jpeg, png, gif, webp, svg)'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

module.exports = function(db, authenticateToken, servicesMap, invalidateServicesCache) {

  // ========== WACHTWOORD RESET ==========

  router.post('/auth/change-password', authenticateToken, (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, error: 'Huidig en nieuw wachtwoord zijn verplicht' });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ success: false, error: 'Nieuw wachtwoord moet minimaal 8 karakters zijn' });
      }

      db.get('SELECT * FROM admin WHERE id = ?', [req.user.id], (err, user) => {
        if (err || !user) return res.status(404).json({ success: false, error: 'Gebruiker niet gevonden' });
        
        if (!bcrypt.compareSync(currentPassword, user.passwordHash)) {
          return res.status(401).json({ success: false, error: 'Huidig wachtwoord is onjuist' });
        }

        const newHash = bcrypt.hashSync(newPassword, 10);
        db.run('UPDATE admin SET passwordHash = ? WHERE id = ?', [newHash, req.user.id], (err2) => {
          if (err2) return res.status(500).json({ success: false, error: 'Wachtwoord updaten mislukt' });
          res.json({ success: true, message: 'Wachtwoord succesvol gewijzigd' });
        });
      });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Interne server fout' });
    }
  });

  router.post('/auth/forgot-password', (req, res) => {
    try {
      const { username } = req.body;
      if (!username) return res.status(400).json({ success: false, error: 'Gebruikersnaam is verplicht' });

      db.get('SELECT id FROM admin WHERE username = ?', [username], (err, user) => {
        if (err || !user) {
          return res.json({ success: true, message: 'Als dit account bestaat, is er een reset link gegenereerd.' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000).toISOString();

        db.run('INSERT INTO password_reset_tokens (admin_id, token, expires_at) VALUES (?, ?, ?)',
          [user.id, token, expiresAt], (err2) => {
            if (err2) return res.status(500).json({ success: false, error: 'Interne fout' });
            console.log(`🔐 Reset token: ${token}`);
            res.json({ success: true, message: 'Reset link gegenereerd.', resetToken: token });
          }
        );
      });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Interne server fout' });
    }
  });

  router.post('/auth/reset-password', (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) return res.status(400).json({ success: false, error: 'Token en wachtwoord zijn verplicht' });
      if (newPassword.length < 8) return res.status(400).json({ success: false, error: 'Wachtwoord moet minimaal 8 karakters zijn' });

      db.get('SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0 AND expires_at > datetime("now")', [token], (err, row) => {
        if (err || !row) return res.status(400).json({ success: false, error: 'Ongeldige of verlopen token' });

        const newHash = bcrypt.hashSync(newPassword, 10);
        db.run('UPDATE admin SET passwordHash = ? WHERE id = ?', [newHash, row.admin_id]);
        db.run('UPDATE password_reset_tokens SET used = 1 WHERE id = ?', [row.id]);
        res.json({ success: true, message: 'Wachtwoord gereset. Je kunt nu inloggen.' });
      });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Interne server fout' });
    }
  });

  // ========== SERVICES BEHEER ==========

  router.get('/services', authenticateToken, (req, res) => {
    db.all('SELECT * FROM services ORDER BY name ASC', (err, rows) => {
      if (err) return res.status(500).json({ success: false, error: 'Diensten ophalen mislukt' });
      res.json({ success: true, data: rows || [] });
    });
  });

  router.post('/services', authenticateToken, (req, res) => {
    const { key, name, duration, price, description } = req.body;
    if (!key || !name) return res.status(400).json({ success: false, error: 'Key en naam zijn verplicht' });

    db.run('INSERT INTO services (key, name, duration, price, description) VALUES (?, ?, ?, ?, ?)',
      [key, name, duration || 30, price || 0, description || ''],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) return res.status(409).json({ success: false, error: 'Deze key bestaat al' });
          return res.status(500).json({ success: false, error: 'Dienst aanmaken mislukt' });
        }
                servicesMap[key] = name;
        if (invalidateServicesCache) invalidateServicesCache();
        res.status(201).json({ success: true, data: { id: this.lastID } });
      }
    );
  });

  router.put('/services/:key', authenticateToken, (req, res) => {
    const { name, duration, price, description, is_active } = req.body;
    db.run('UPDATE services SET name=?, duration=?, price=?, description=?, is_active=? WHERE key=?',
      [name, duration, price, description || '', is_active !== undefined ? (is_active ? 1 : 0) : 1, req.params.key],
      function(err) {
        if (err) return res.status(500).json({ success: false, error: 'Dienst bijwerken mislukt' });
        if (this.changes === 0) return res.status(404).json({ success: false, error: 'Dienst niet gevonden' });
        if (name) servicesMap[req.params.key] = name;
        if (invalidateServicesCache) invalidateServicesCache();
        res.json({ success: true, message: 'Dienst bijgewerkt' });
      }
    );
  });

  router.delete('/services/:key', authenticateToken, (req, res) => {
    db.run('DELETE FROM services WHERE key = ?', [req.params.key], function(err) {
      if (err) return res.status(500).json({ success: false, error: 'Verwijderen mislukt' });
      if (this.changes === 0) return res.status(404).json({ success: false, error: 'Dienst niet gevonden' });
      delete servicesMap[req.params.key];
      if (invalidateServicesCache) invalidateServicesCache();
      res.json({ success: true, message: 'Dienst verwijderd' });
    });
  });

  // ========== AFWEZIGHEID BEHEER ==========

  router.get('/absences', authenticateToken, (req, res) => {
    const { barber_name, date } = req.query;
    let query = 'SELECT * FROM barber_absences WHERE 1=1';
    const params = [];
    if (barber_name) { query += ' AND barber_name = ?'; params.push(barber_name); }
    if (date) { query += ' AND date = ?'; params.push(date); }
    query += ' ORDER BY date ASC, start_time ASC';

    db.all(query, params, (err, rows) => {
      if (err) return res.status(500).json({ success: false, error: 'Afwezigheden ophalen mislukt' });
      res.json({ success: true, data: rows || [] });
    });
  });

  router.post('/absences', authenticateToken, (req, res) => {
    const { barber_name, date, start_time, end_time, reason, is_full_day } = req.body;
    if (!barber_name || !date) return res.status(400).json({ success: false, error: 'Kapper en datum zijn verplicht' });

    db.run('INSERT OR REPLACE INTO barber_absences (barber_name, date, start_time, end_time, reason, is_full_day) VALUES (?, ?, ?, ?, ?, ?)',
      [barber_name, date, start_time || null, end_time || null, reason || '', is_full_day ? 1 : 0],
      function(err) {
        if (err) return res.status(500).json({ success: false, error: 'Toevoegen mislukt' });
        res.status(201).json({ success: true, data: { id: this.lastID } });
      }
    );
  });

  router.delete('/absences/:id', authenticateToken, (req, res) => {
    db.run('DELETE FROM barber_absences WHERE id = ?', [req.params.id], function(err) {
      if (err) return res.status(500).json({ success: false, error: 'Verwijderen mislukt' });
      if (this.changes === 0) return res.status(404).json({ success: false, error: 'Niet gevonden' });
      res.json({ success: true, message: 'Afwezigheid verwijderd' });
    });
  });

  // ========== AFSPRAAK VERPLAATSEN ==========

  router.post('/appointments/:id/move', authenticateToken, (req, res) => {
    const { target_barber_name, date, time } = req.body;
    if (!target_barber_name) return res.status(400).json({ success: false, error: 'Doelkapper is verplicht' });

    db.get('SELECT * FROM appointments WHERE id = ? AND status = "active"', [req.params.id], (err, apt) => {
      if (err || !apt) return res.status(404).json({ success: false, error: 'Afspraak niet gevonden' });

      const targetDate = date || apt.date;
      const targetTime = time || apt.time;

      db.get('SELECT * FROM appointments WHERE date=? AND time=? AND barber_name=? AND status="active" AND id!=?',
        [targetDate, targetTime, target_barber_name, req.params.id], (err2, existing) => {
          if (err2) return res.status(500).json({ success: false, error: 'Database fout' });
          if (existing) return res.status(409).json({ success: false, error: 'Tijdstip is al bezet' });

          db.run('UPDATE appointments SET barber_name=?, date=?, time=? WHERE id=?',
            [target_barber_name, targetDate, targetTime, req.params.id], function(err3) {
              if (err3) return res.status(500).json({ success: false, error: 'Verplaatsen mislukt' });
              res.json({ success: true, message: 'Afspraak verplaatst' });
            });
        });
    });
  });

  // ========== HANDMATIGE AFSPRAAK AANMAKEN (admin) ==========

  router.post('/appointments', authenticateToken, (req, res) => {
    const { name, email, phone, service, barber_name, date, time, notes } = req.body;
    if (!name || !service || !barber_name || !date || !time) {
      return res.status(400).json({ success: false, error: 'Alle verplichte velden zijn nodig' });
    }

    db.get('SELECT * FROM appointments WHERE date=? AND time=? AND barber_name=? AND status="active"',
      [date, time, barber_name], (err, existing) => {
        if (err) return res.status(500).json({ success: false, error: 'Database fout' });
        if (existing) return res.status(409).json({ success: false, error: 'Tijdstip al bezet' });

        db.get('SELECT id FROM barbers WHERE name = ?', [barber_name], (err2, barber) => {
          const bid = (!err2 && barber) ? barber.id : null;
          db.run(
            'INSERT INTO appointments (barberId, barber_name, name, email, phone, treatment, date, time, notes, status, created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
            [bid, barber_name, name, email||'', phone||'', service, date, time, notes||'', 'active', 'admin'],
            function(err3) {
              if (err3) return res.status(500).json({ success: false, error: 'Aanmaken mislukt' });
              res.status(201).json({ success: true, data: { id: this.lastID } });
            });
        });
      });
  });


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

  // ========== ALLE AFSPRAKEN (inclusief geannuleerd) ==========
  router.get('/appointments/all', authenticateToken, (req, res) => {
    const { date } = req.query;
    let query = "SELECT *, treatment as service FROM appointments WHERE status != 'deleted'";
    const params = [];
    if (date) {
      query += " AND date = ?";
      params.push(date);
    }
    query += " ORDER BY date ASC, time ASC";
    db.all(query, params, (err, rows) => {
      if (err) return res.status(500).json({ success: false, error: "Fout bij ophalen" });
      res.json({ success: true, data: rows || [] });
    });
  });

    // ========== FOTO BEHEER (admin) ==========

  // GET ALLE FOTO'S (admin)
  router.get('/photos', authenticateToken, (req, res) => {
    db.all('SELECT id, filename, caption, uploaded_at FROM photos ORDER BY uploaded_at DESC',
      (err, rows) => {
        if (err) return res.status(500).json({ success: false, error: 'Fotos ophalen mislukt' });
        res.json({ success: true, data: rows || [] });
      }
    );
  });

  // POST - FOTO UPLOADEN (admin)
  router.post('/photos', authenticateToken, upload.single('photo'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'Geen bestand geselecteerd' });
      }
      const filename = req.file.filename;
      const caption = req.body.caption || '';
      db.run(
        'INSERT INTO photos (filename, caption) VALUES (?, ?)',
        [filename, caption],
        function(err) {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, error: 'Foto opslaan mislukt' });
          }
          res.status(201).json({
            success: true,
            message: 'Foto succesvol geupload',
            data: { id: this.lastID, filename, caption }
          });
        }
      );
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ success: false, error: 'Interne server fout' });
    }
  });

  // DELETE - FOTO VERWIJDEREN (admin)
  router.delete('/photos/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    db.get('SELECT filename FROM photos WHERE id = ?', [id], (err, row) => {
      if (err) return res.status(500).json({ success: false, error: 'Database fout' });
      if (!row) return res.status(404).json({ success: false, error: 'Foto niet gevonden' });

      db.run('DELETE FROM photos WHERE id = ?', [id], function(err2) {
        if (err2) return res.status(500).json({ success: false, error: 'Verwijderen mislukt' });
        // Verwijder ook het bestand van de schijf (niet-blockend)
        const fs = require('fs');
        const filePath = path.join(__dirname, '../uploads/photos', row.filename);
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) console.error('Kon bestand niet verwijderen:', unlinkErr.message);
        });
        res.json({ success: true, message: 'Foto verwijderd' });
      });
    });
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

      const appointments = rows || [];
      const totalAppointments = appointments.length;

      // Haal diensten uit de database voor dynamische prijzen en namen
      db.all('SELECT * FROM services', (err2, servicesRows) => {
        const servicesList = servicesRows || [];
        const prices = {};
        const serviceNames = {};
        servicesList.forEach(s => {
          prices[s.key] = s.price;
          serviceNames[s.key] = s.name;
        });

        // Bereken omzet per service
        const perServiceMap = {};
        let totalRevenue = 0;
        const uniqueClients = new Set();

        appointments.forEach(r => {
          const svcKey = r.treatment || r.service;
          if (!perServiceMap[svcKey]) {
            perServiceMap[svcKey] = { name: serviceNames[svcKey] || svcKey, count: 0, revenue: 0 };
          }
          perServiceMap[svcKey].count++;
          const price = prices[svcKey] || 0;
          perServiceMap[svcKey].revenue += price;
          totalRevenue += price;
          if (r.name) uniqueClients.add(r.name.toLowerCase().trim());
        });

        const perService = Object.values(perServiceMap);

        // Per kapper
        const perBarberMap = {};
        appointments.forEach(r => {
          const bn = r.barber_name || 'onbekend';
          if (!perBarberMap[bn]) perBarberMap[bn] = { name: bn, count: 0 };
          perBarberMap[bn].count++;
        });
        const barberDistribution = Object.values(perBarberMap);

        // Drukste dag/tijd
        let busiestDay = null;
        if (appointments.length > 0) {
          const dayCount = {};
          appointments.forEach(r => {
            if (!dayCount[r.date]) dayCount[r.date] = { date: r.date, count: 0 };
            dayCount[r.date].count++;
          });
          busiestDay = Object.values(dayCount).sort((a, b) => b.count - a.count)[0] || null;
        }

        res.json({
          success: true,
          data: {
            period: { from: from || 'begin', to: to || 'einde' },
            totalAppointments,
            totalRevenue,
            uniqueCustomers: uniqueClients.size,
            perService,
            barberDistribution,
            busiestDay
          }
        });
      });
    });
  });

  return router;
};
