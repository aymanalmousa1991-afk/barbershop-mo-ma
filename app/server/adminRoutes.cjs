/**
 * Admin routes voor Mo&Ma Barbershop
 * Nieuwe functionaliteiten: wachtwoord reset, services beheer, afwezigheid, verplaatsen
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const router = express.Router();

module.exports = function(db, authenticateToken, servicesMap) {

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
        res.json({ success: true, message: 'Dienst bijgewerkt' });
      }
    );
  });

  router.delete('/services/:key', authenticateToken, (req, res) => {
    db.run('DELETE FROM services WHERE key = ?', [req.params.key], function(err) {
      if (err) return res.status(500).json({ success: false, error: 'Verwijderen mislukt' });
      if (this.changes === 0) return res.status(404).json({ success: false, error: 'Dienst niet gevonden' });
      delete servicesMap[req.params.key];
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

  return router;
};
