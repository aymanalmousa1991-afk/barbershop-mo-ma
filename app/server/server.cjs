const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database.cjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'barbershop-mo-ma-secret-key-2024';

// ========== MIDDLEWARE ==========

// CORS setup - allow all common origins
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging middleware (optional, for debugging)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Middleware to verify JWT token for admin routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: 'Toegang geweigerd. Geen token aanwezig.' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false,
        error: 'Ongeldige of verlopen token. Log opnieuw in.' 
      });
    }
    req.user = user;
    next();
  });
};

// ========== AUTH ROUTES ==========

/**
 * POST /api/auth/login
 * Admin login endpoint
 */
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Gebruikersnaam en wachtwoord zijn verplicht' 
      });
    }

    // Query database - check admin table
    db.get('SELECT * FROM admin WHERE username = ?', [username], (err, user) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          success: false,
          error: 'Database fout' 
        });
      }

      // Check user exists and password is correct
      if (!user) {
        return res.status(401).json({ 
          success: false,
          error: 'Ongeldige gebruikersnaam of wachtwoord' 
        });
      }

      // Compare with passwordHash (from admin table)
      const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ 
          success: false,
          error: 'Ongeldige gebruikersnaam of wachtwoord' 
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        token,
        user: { 
          id: user.id, 
          username: user.username, 
          role: user.role 
        }
      });
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Interne server fout' 
    });
  }
});

// ========== BARBER ROUTES ==========

/**
 * GET /api/barbers
 * Get list of all active barbers
 */
app.get('/api/barbers', (req, res) => {
  try {
    db.all(
      'SELECT id, name, display_name FROM barbers WHERE is_active = 1 ORDER BY display_name ASC',
      (err, rows) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ 
            success: false,
            error: 'Kappers konden niet worden opgehaald' 
          });
        }
        res.json({
          success: true,
          data: rows
        });
      }
    );
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Interne server fout' 
    });
  }
});

// ========== APPOINTMENT ROUTES - PUBLIC ==========

/**
 * GET /api/appointments/public?date=YYYY-MM-DD&barber=barber_name
 * Get public appointments for a specific date (and optionally barber)
 * No authentication required
 */
app.get('/api/appointments/public', (req, res) => {
  try {
    const { date, barber_name } = req.query;

    if (!date) {
      return res.status(400).json({ 
        success: false,
        error: 'Datum parameter is verplicht' 
      });
    }

    let query = 'SELECT id, name, treatment as service, date, time, barber_name FROM appointments WHERE date = ? AND status = "active"';
    const params = [date];

    if (barber_name) {
      query += ' AND barber_name = ?';
      params.push(barber_name);
    }

    query += ' ORDER BY time ASC';

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          success: false,
          error: 'Afspraken konden niet worden opgehaald' 
        });
      }
      res.json({
        success: true,
        data: rows || []
      });
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Interne server fout' 
    });
  }
});

/**
 * GET /api/appointments/available-slots?date=YYYY-MM-DD&barber_name=name&service=service_id
 * Get available time slots for a specific date and barber
 */
app.get('/api/appointments/available-slots', (req, res) => {
  try {
    const { date, barber_name, service } = req.query;

    if (!date || !barber_name) {
      return res.status(400).json({ 
        success: false,
        error: 'Datum en kapper zijn verplicht' 
      });
    }

    // Business hours: 08:00 - 18:00 with 30-minute intervals
    const businessHours = [
      '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
      '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
    ];

    // Get booked slots for this date and barber
    db.all(
      'SELECT time FROM appointments WHERE date = ? AND barber_name = ? AND status = "active"',
      [date, barber_name],
      (err, rows) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ 
            success: false,
            error: 'Beschikbare tijden konden niet worden opgehaald' 
          });
        }

        const bookedTimes = rows.map(row => row.time);
        const availableSlots = businessHours.filter(slot => !bookedTimes.includes(slot));

        res.json({
          success: true,
          data: {
            date,
            barber_name,
            availableSlots,
            bookedSlots: bookedTimes
          }
        });
      }
    );
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Interne server fout' 
    });
  }
});

/**
 * POST /api/appointments
 * Create new appointment (public)
 */
app.post('/api/appointments', (req, res) => {
  try {
    const { name, email, phone, service, barber_name, date, time, notes } = req.body;

    // Validation - email is optioneel
    if (!name || !service || !barber_name || !date || !time) {
      return res.status(400).json({ 
        success: false,
        error: 'Naam, behandeling, kapper, datum en tijd zijn verplicht' 
      });
    }

    // Email validation (alleen als ingevuld)
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          success: false,
          error: 'Ongeldig e-mailadres' 
        });
      }
    }

    // Check if slot is already booked for this barber
    db.get(
      'SELECT * FROM appointments WHERE date = ? AND time = ? AND barber_name = ? AND status = "active"',
      [date, time, barber_name],
      (err, existing) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ 
            success: false,
            error: 'Database fout' 
          });
        }

        if (existing) {
          return res.status(409).json({ 
            success: false,
            error: 'Dit tijdstip is al bezet voor deze kapper' 
          });
        }

        // Get barberId from the barbers table if we can
        const getBarberId = (callback) => {
          db.get('SELECT id FROM barbers WHERE name = ?', [barber_name], (err, barber) => {
            if (err || !barber) return callback(null);
            callback(barber.id);
          });
        };

        getBarberId((bid) => {
          const treatment = service || req.body.treatment;
          db.run(
            `INSERT INTO appointments (barberId, barber_name, name, email, phone, treatment, date, time, notes, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
            [bid, barber_name, name, email || '', phone || '', treatment, date, time, notes || ''],
            function(err) {
              if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ 
                  success: false,
                  error: 'Afspraak kon niet worden aangemaakt' 
                });
              }

              res.status(201).json({
                success: true,
                message: 'Afspraak succesvol aangemaakt!',
                data: { 
                  id: this.lastID,
                  name, 
                  email, 
                  service, 
                  barber_name, 
                  date, 
                  time 
                }
              });
            }
        );
        });
      }
    );
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Interne server fout' 
    });
  }
});

// ========== APPOINTMENT ROUTES - ADMIN ==========

/**
 * GET /api/appointments
 * Get all appointments (admin only)
 */
app.get('/api/appointments', authenticateToken, (req, res) => {
  try {
    const { date, future } = req.query;
    let query = 'SELECT *, treatment as service FROM appointments WHERE status = "active"';
    const params = [];

    if (date) {
      query += ' AND date = ?';
      params.push(date);
    }

    if (future === 'true') {
      const today = new Date().toISOString().split('T')[0];
      query += ' AND date >= ?';
      params.push(today);
    }

    query += ' ORDER BY date ASC, time ASC';

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          success: false,
          error: 'Afspraken konden niet worden opgehaald' 
        });
      }
      res.json({
        success: true,
        data: rows || []
      });
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Interne server fout' 
    });
  }
});

/**
 * GET /api/appointments/:id
 * Get single appointment by ID (admin only)
 */
app.get('/api/appointments/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    db.get('SELECT *, treatment as service FROM appointments WHERE id = ? AND status = "active"', [id], (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          success: false,
          error: 'Database fout' 
        });
      }

      if (!row) {
        return res.status(404).json({ 
          success: false,
          error: 'Afspraak niet gevonden' 
        });
      }

      res.json({
        success: true,
        data: row
      });
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Interne server fout' 
    });
  }
});

/**
 * PUT /api/appointments/:id
 * Update appointment (admin only)
 */
app.put('/api/appointments/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, service, barber_name, date, time, notes } = req.body;

    // Validation - email is optioneel
    if (!name || !service || !barber_name || !date || !time) {
      return res.status(400).json({ 
        success: false,
        error: 'Alle verplichte velden zijn nodig' 
      });
    }

    // Map 'service' to 'treatment' for database
    const treatment = req.body.service || req.body.treatment;

    db.run(
      `UPDATE appointments 
       SET name = ?, email = ?, phone = ?, treatment = ?, barber_name = ?, date = ?, time = ?, notes = ?
       WHERE id = ? AND status = "active"`,
      [name, email, phone || '', treatment, barber_name, date, time, notes || '', id],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ 
            success: false,
            error: 'Afspraak kon niet worden bijgewerkt' 
          });
        }

        if (this.changes === 0) {
          return res.status(404).json({ 
            success: false,
            error: 'Afspraak niet gevonden' 
          });
        }

        res.json({
          success: true,
          message: 'Afspraak succesvol bijgewerkt',
        });
      }
    );
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Interne server fout' 
    });
  }
});

/**
 * DELETE /api/appointments/:id
 * Delete appointment (admin only)
 */
app.delete('/api/appointments/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    db.run(
      'UPDATE appointments SET status = "deleted" WHERE id = ?',
      [id],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ 
            success: false,
            error: 'Afspraak kon niet worden verwijderd' 
          });
        }

        if (this.changes === 0) {
          return res.status(404).json({ 
            success: false,
            error: 'Afspraak niet gevonden' 
          });
        }

        res.json({
          success: true,
          message: 'Afspraak succesvol verwijderd',
        });
      }
    );
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Interne server fout' 
    });
  }
});

// ========== STATS ROUTES - ADMIN ==========

/**
 * GET /api/stats
 * Get appointment statistics (admin only)
 */
app.get('/api/stats', authenticateToken, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    db.all(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN date >= ? THEN 1 ELSE 0 END) as upcoming,
        SUM(CASE WHEN date < ? THEN 1 ELSE 0 END) as past
      FROM appointments 
      WHERE status = "active"
    `, [today, today], (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          success: false,
          error: 'Database fout' 
        });
      }

      // Get today's appointments
      db.all(
        'SELECT *, treatment as service FROM appointments WHERE date = ? AND status = "active" ORDER BY time ASC',
        [today],
        (err, todayAppointments) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
              success: false,
              error: 'Database fout' 
            });
          }

          res.json({
            success: true,
            data: {
              stats: rows[0] || { total: 0, upcoming: 0, past: 0 },
              todayAppointments: todayAppointments || []
            }
          });
        }
      );
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Interne server fout' 
    });
  }
});

// ========== STATIC FILES & FALLBACK ==========

// Serve static files from the dist folder in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  // In Express 5, gebruik een gewone middleware voor SPA fallback
  app.use((req, res, next) => {
    // Alleen HTML aanvragen doorsturen naar index.html
    if (!req.path.startsWith('/api')) {
      return res.sendFile(path.join(__dirname, '../dist/index.html'));
    }
    next();
  });
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// ========== START SERVER ==========

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 Barbershop Mo&Ma Server');
  console.log('━'.repeat(50));
  console.log(`✅ Server draait op http://localhost:${PORT}`);
  console.log(`📍 API: http://localhost:${PORT}/api`);
  console.log(`📅 Afspraken: POST/GET /api/appointments`);
  console.log(`🔐 Admin login: POST /api/auth/login`);
  console.log(`📊 Stats: GET /api/stats`);
  console.log('━'.repeat(50));
  console.log('');
});

module.exports = app;
