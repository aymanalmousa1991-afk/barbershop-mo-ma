const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database.cjs');
const path = require('path');
const cron = require('node-cron');
const multer = require('multer');
const { sendConfirmationEmail, sendReminderEmail, verifyEmailConfig } = require('./emailConfig.cjs');
const createAdminRoutes = require('./adminRoutes.cjs');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || require('crypto').randomBytes(32).toString('hex');

// ========== SERVICE & BARBER MAPPING ==========

let servicesMap = {};
const barberDisplayMap = {};

// Helper: laad services uit database (cached)
let cachedServices = [];
let servicesCacheTime = 0;
const CACHE_TTL = 30000;

function loadServicesFromDB(callback) {
  const now = Date.now();
  if (cachedServices.length > 0 && (now - servicesCacheTime) < CACHE_TTL) {
    return callback(null, cachedServices);
  }
  db.all("SELECT * FROM services WHERE is_active = 1", (err, rows) => {
    if (err) return callback(err);
    cachedServices = rows || [];
    servicesCacheTime = Date.now();
    (rows || []).forEach(r => { servicesMap[r.key] = r.name; });
    callback(null, cachedServices);
  });
}

function getDurationByKey(key, defaultDur = 30) {
  const svc = cachedServices.find(s => s.key === key);
  return svc ? svc.duration : defaultDur;
}

// Forceer cache leegmaken (wordt aangeroepen na admin wijzigingen)
function invalidateServicesCache() {
  cachedServices = [];
  servicesCacheTime = 0;
  loadServicesFromDB(() => {});
}

// Laad barber display namen bij opstarten
db.all("SELECT name, display_name FROM barbers WHERE is_active = 1", (err, rows) => {
  if (!err && rows) {
    rows.forEach(r => { barberDisplayMap[r.name] = r.display_name; });
    console.log("Barber display names loaded:", JSON.stringify(barberDisplayMap));
  }
});

// Laad services in cache bij opstarten
loadServicesFromDB(() => {});

// ========== MIDDLEWARE ==========

// ========== SECURITY MIDDLEWARE ==========

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3001,https://barbershop-mo-ma.pages.dev,https://barbershopmoma.nl,https://www.barbershopmoma.nl').split(',').map(s => s.trim());
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV !== 'production' || ALLOWED_ORIGINS.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn('CORS blocked:', origin);
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400
};

app.use(cors(corsOptions));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, error: 'Te veel verzoeken. Probeer het later opnieuw.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Te veel inlogpogingen. Probeer het later opnieuw.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', loginLimiter);

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

// ========== PUBLIC SERVICES & BARBER ROUTES ==========

/**
 * GET /api/services
 * Get list of all active services (publiek)
 */
app.get('/api/services', (req, res) => {
  try {
    db.all(
      'SELECT * FROM services WHERE is_active = 1 ORDER BY name ASC',
      (err, rows) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ 
            success: false,
            error: 'Diensten konden niet worden opgehaald' 
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
 * Get available time slots for a specific date and barber (houdt rekening met afwezigheid)
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

  // Opening hours per day (0=Sun, 1=Mon, ..., 6=Sat)
    const openingHours = {
      1: { open: 10, close: 18 },
      2: { open: 9, close: 18 },
      3: { open: 9, close: 18 },
      4: { open: 9, close: 18 },
      5: { open: 9, close: 18 },
      6: { open: 8, close: 17 },
    };
    const dateObj = new Date(date + "T12:00:00");
    const dayOfWeek = dateObj.getDay();
    const todayHours = openingHours[dayOfWeek];
    const allSlots = [];
    if (todayHours) {
      for (let h = todayHours.open; h < todayHours.close; h++) {
        for (let m = 0; m < 60; m += 15) {
          allSlots.push(String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0"));
        }
      }
    }

        const requestedDuration = getDurationByKey(service || "", 30);
    const CLOSING_MIN = todayHours ? todayHours.close * 60 : 18 * 60;

    const toMin = (t) => { const p = t.split(":"); return parseInt(p[0]) * 60 + parseInt(p[1]); };

    // Get booked slots (with treatment) for this date and barber
    db.all(
      'SELECT time, treatment FROM appointments WHERE date = ? AND barber_name = ? AND status = "active"',
      [date, barber_name],
      (err, rows) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ 
            success: false,
            error: 'Beschikbare tijden konden niet worden opgehaald' 
          });
        }

                // Block all 15-min start times that overlap with existing appointments
                const blockedSlotsSet = new Set();
                rows.forEach(row => {
                  const dur = getDurationByKey(row.treatment || "", 30);
                  const existingStart = toMin(row.time);
                  const existingEnd = existingStart + dur;
                  allSlots.forEach(slot => {
                    const slotMin = toMin(slot);
                    // Een slot is geblokkeerd als een nieuwe afspraak (startend op slotMin, duur=requestedDuration)
                    // overlapt met de bestaande afspraak (start=existingStart, eind=existingEnd)
                    if (slotMin < existingEnd && slotMin + requestedDuration > existingStart) {
                      blockedSlotsSet.add(slot);
                    }
                  });
                });

                // Block slots that would end after closing time (18:00)
        allSlots.forEach(slot => {
          const slotMin = toMin(slot);
          if (slotMin + requestedDuration > CLOSING_MIN) {
            blockedSlotsSet.add(slot);
          }
        });

                // Block verleden tijd voor vandaag
                const now = new Date();
                const todayStr = now.toISOString().split('T')[0];
                if (date === todayStr) {
                  // Gebruik lokale uren/minuten (zelfde timezone als de slots)
                  const currentMinutes = now.getHours() * 60 + now.getMinutes();
                  allSlots.forEach(slot => {
                    const slotMin = toMin(slot);
                    // Blokkeer als de starttijd al voorbij is
                    if (slotMin < currentMinutes) {
                      blockedSlotsSet.add(slot);
                    }
                  });
                }

                const bookedTimes = rows.map(row => row.time);

        // Check afwezigheid voor deze kapper op deze datum
        db.all(
          'SELECT * FROM barber_absences WHERE barber_name = ? AND date = ?',
          [barber_name, date],
          (err2, absences) => {
            let blockedTimes = [];
            if (absences && absences.length > 0) {
              for (const absence of absences) {
                if (absence.is_full_day) {
                  // Volledige dag geblokkeerd
                  blockedTimes = [...allSlots];
                  break;
                }
                if (absence.start_time && absence.end_time) {
                  // Blok van start_time tot end_time blokkeren
                  for (const slot of allSlots) {
                    if (slot >= absence.start_time && slot < absence.end_time) {
                      blockedTimes.push(slot);
                    }
                  }
                }
              }
            }

            // Verwijder geboekte en geblokkeerde tijden
            const unavailableSlots = [...new Set([...bookedTimes, ...blockedTimes, ...Array.from(blockedSlotsSet)])];
            const availableSlots = allSlots.filter(slot => !unavailableSlots.includes(slot));

            res.json({
              success: true,
              data: {
                date,
                barber_name,
                availableSlots,
                bookedSlots: bookedTimes,
                blockedSlots: blockedTimes
              }
            });
          }
        );
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
 * Create new appointment (public) - met validatie op toekomst & afwezigheid
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

    // === VALIDATIE: Tijd moet in de toekomst liggen ===
    const now = new Date();
    const appointmentDate = new Date(date + 'T' + time);

    if (appointmentDate <= now) {
      return res.status(400).json({
        success: false,
        error: 'Je kunt alleen afspraken maken in de toekomst. Kies een latere datum of tijd.'
      });
    }

    // === VALIDATIE: Check openingstijden voor deze dag ===
    const openingHours = {
      1: { open: 10, close: 18 },
      2: { open: 9, close: 18 },
      3: { open: 9, close: 18 },
      4: { open: 9, close: 18 },
      5: { open: 9, close: 18 },
      6: { open: 8, close: 17 },
    };
    const dateObj = new Date(date + "T" + time);
    const dayOfWeek = dateObj.getDay();
    const todayHours = openingHours[dayOfWeek];

    if (!todayHours) {
      return res.status(400).json({
        success: false,
        error: "Op zondag zijn wij gesloten. Kies een andere dag."
      });
    }

    const hour = parseInt(time.split(":")[0]);
    if (hour < todayHours.open) {
      return res.status(400).json({
        success: false,
        error: "Onze openingstijd op deze dag is " + String(todayHours.open).padStart(2, "0") + ":00. Kies een later tijdstip."
      });
    }

        // === VALIDATIE: Check overlap met bestaande afspraken (rekening houdend met duur) ===
    const newDuration = getDurationByKey(service || "", 30);
    const newStartMin = parseInt(time.split(":")[0]) * 60 + parseInt(time.split(":")[1]);
    const newEndMin = newStartMin + newDuration;

    // Check overlap with existing active appointments
    db.all(
      'SELECT time, treatment FROM appointments WHERE date = ? AND barber_name = ? AND status = "active"',
      [date, barber_name],
      (err, existingSlots) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ success: false, error: 'Database fout' });
        }

        for (const existing of existingSlots) {
          const existingDur = getDurationByKey(existing.treatment || "", 30);
          const existingStart = parseInt(existing.time.split(":")[0]) * 60 + parseInt(existing.time.split(":")[1]);
          const existingEnd = existingStart + existingDur;
          
          if (newStartMin < existingEnd && newEndMin > existingStart) {
            return res.status(409).json({ 
              success: false,
              error: 'Dit tijdstip overlapt met een bestaande afspraak' 
            });
          }
        }

        if (newEndMin > todayHours.close * 60) {
          return res.status(400).json({
            success: false,
            error: 'Deze afspraak zou na sluitingstijd eindigen. Kies een eerder tijdstip.'
          });
        }

        // === VALIDATIE: Check of kapper afwezig is ===
        db.all(
          'SELECT * FROM barber_absences WHERE barber_name = ? AND date = ?',
          [barber_name, date],
          (err2, absences) => {
            if (err2) {
              console.error('Database error:', err2);
              return res.status(500).json({ success: false, error: 'Database fout' });
            }

            if (absences && absences.length > 0) {
              for (const absence of absences) {
                if (absence.is_full_day) {
                  return res.status(400).json({
                    success: false,
                    error: 'Deze kapper is deze dag niet beschikbaar (volle dag afwezig)'
                  });
                }
                if (absence.start_time && absence.end_time) {
                  if (time >= absence.start_time && time < absence.end_time) {
                    return res.status(400).json({
                      success: false,
                      error: `Deze kapper is niet beschikbaar van ${absence.start_time} tot ${absence.end_time}`
                    });
                  }
                }
              }
            }

            // Get barberId
            db.get('SELECT id FROM barbers WHERE name = ?', [barber_name], (err3, barber) => {
              const bid = (!err3 && barber) ? barber.id : null;
              const treatment = service || req.body.treatment;

              db.run(
                `INSERT INTO appointments (barberId, barber_name, name, email, phone, treatment, date, time, notes, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
                [bid, barber_name, name, email || '', phone || '', treatment, date, time, notes || ''],
                function(err4) {
                  if (err4) {
                    console.error('Database error:', err4);
                    return res.status(500).json({ 
                      success: false,
                      error: 'Afspraak kon niet worden aangemaakt' 
                    });
                  }

                                    // Genereer annuleringstoken en verstuur bevestigingsmail
                  const APP_URL = process.env.APP_URL || 'https://barbershop-mo-ma.pages.dev';
                  createCancellationToken(this.lastID, (cancelToken) => {
                    const cancelLink = cancelToken ? `${APP_URL}/annuleren?token=${cancelToken}` : '';
                    const serviceName = servicesMap[treatment] || treatment;
                    const barberDisplay = barberDisplayMap[barber_name] || barber_name;
                    sendConfirmationEmail({
                      email: email || '',
                      name,
                      service: serviceName,
                      barber: barberDisplay,
                      date,
                      time,
                      price: '',
                      notes: notes || '',
                      cancelLink
                    });
                  });

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
 * Publieke route - annuleer een afspraak via token
 */
  app.get('/api/appointments/cancel', (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ success: false, error: 'Token is verplicht' });
    }

    db.get(
      `SELECT ct.id as token_id, ct.appointment_id, a.name, a.date, a.time, a.treatment, a.barber_name
       FROM cancellation_tokens ct
       JOIN appointments a ON a.id = ct.appointment_id
       WHERE ct.token = ? AND ct.used = 0 AND a.status = 'active'`,
      [token],
      (err, row) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ success: false, error: 'Database fout' });
        }
        if (!row) {
          return res.status(404).json({ success: false, error: 'Ongeldige of verlopen annuleringslink' });
        }

        // Toon bevestigingspagina
        res.json({
          success: true,
          data: {
            appointment_id: row.appointment_id,
            name: row.name,
            date: row.date,
            time: row.time,
            treatment: row.treatment,
            barber: row.barber_name
          }
        });
      }
    );
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ success: false, error: 'Interne server fout' });
  }
  });

  /**
 * POST /api/appointments/cancel
 * Publieke route - bevestig annulering
 */
  app.post('/api/appointments/cancel', (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: 'Token is verplicht' });
    }

    db.get(
      'SELECT ct.id as token_id, ct.appointment_id FROM cancellation_tokens ct WHERE ct.token = ? AND ct.used = 0',
      [token],
      (err, row) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ success: false, error: 'Database fout' });
        }
        if (!row) {
          return res.status(404).json({ success: false, error: 'Ongeldige of verlopen annuleringslink' });
        }

        // Annuleer de afspraak en markeer token als gebruikt
        db.run('UPDATE appointments SET status = "cancelled", reminder_sent = 1 WHERE id = ?', [row.appointment_id], function(err2) {
          if (err2) {
            console.error('Database error:', err2);
            return res.status(500).json({ success: false, error: 'Annuleren mislukt' });
          }
          db.run('UPDATE cancellation_tokens SET used = 1 WHERE id = ?', [row.token_id]);
            
          res.json({
            success: true,
            message: 'Afspraak succesvol geannuleerd'
          });
        });
      }
    );
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ success: false, error: 'Interne server fout' });
  }
  });

  // Maak annuleringstoken aan na het aanmaken van een afspraak
  function createCancellationToken(appointmentId, callback) {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  db.run('INSERT INTO cancellation_tokens (appointment_id, token) VALUES (?, ?)',
    [appointmentId, token],
    function(err) {
      if (err) {
        console.error('Error creating cancellation token:', err);
        return callback(null);
      }
      callback(token);
    }
  );
  }

  /**
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
        return res.status(500).json({ success: false, error: 'Database fout' });
      }

      // Get today's appointments
      db.all(
        'SELECT *, treatment as service FROM appointments WHERE date = ? AND status = "active" ORDER BY time ASC',
        [today],
        (err, todayAppointments) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, error: 'Database fout' });
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
    res.status(500).json({ success: false, error: 'Interne server fout' });
  }
});

// ========== HOME CONTENT ROUTES ==========

/**
 * GET /api/home-content
 * Publieke route - haalt alle home page teksten op
 */
app.get('/api/home-content', (req, res) => {
  try {
    db.all('SELECT section, content FROM home_content', (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ success: false, error: 'Home content ophalen mislukt' });
      }
      const content = {};
      if (rows) {
        rows.forEach(row => {
          content[row.section] = row.content;
        });
      }
      res.json({ success: true, data: content });
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ success: false, error: 'Interne server fout' });
  }
});

/**
 * PUT /api/admin/home-content
 * Admin route - update home content for a section
 */
app.put('/api/admin/home-content', authenticateToken, (req, res) => {
  try {
    const { section, content } = req.body;
    if (!section) {
      return res.status(400).json({ success: false, error: 'Section is verplicht' });
    }

    db.run(
      'INSERT OR REPLACE INTO home_content (section, content, updated_at) VALUES (?, ?, datetime("now"))',
      [section, content || ''],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ success: false, error: 'Home content opslaan mislukt' });
        }
        res.json({ success: true, message: 'Content opgeslagen' });
      }
    );
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ success: false, error: 'Interne server fout' });
  }
});

// ========== FOTO ROUTES (publiek) ==========

/**
 * GET /api/photos
 * Publieke route - haalt alle foto's op
 */
app.get('/api/photos', (req, res) => {
  try {
    db.all('SELECT id, filename, caption, uploaded_at FROM photos ORDER BY uploaded_at DESC', (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ success: false, error: 'Fotos ophalen mislukt' });
      }
      res.json({ success: true, data: rows || [] });
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ success: false, error: 'Interne server fout' });
  }
});

// Uploads directory - persistent op Fly.io
const UPLOADS_DIR = process.env.FLY_VM ? '/app/data/uploads' : path.join(__dirname, '../uploads');

// Serve uploads met correcte headers
app.use('/uploads', (req, res, next) => {
  res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  res.set('Access-Control-Allow-Origin', '*');
  res.set('X-Content-Type-Options', 'nosniff');
  next();
});

// Serve uploads directory (na helmet middleware voor correcte CORS)
app.use('/uploads', express.static(UPLOADS_DIR));

// Voeg een endpoint toe dat foto URLs retourneert met volledige HTTPS URLs
app.get('/api/photos/full', (req, res) => {
  try {
    db.all('SELECT id, filename, caption, uploaded_at FROM photos ORDER BY uploaded_at DESC', (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ success: false, error: 'Fotos ophalen mislukt' });
      }
      const baseUrl = process.env.FLY_APP_URL || `http://localhost:${PORT}`;
      const photos = (rows || []).map(row => ({
        ...row,
        url: `${baseUrl}/uploads/photos/${row.filename}`
      }));
      res.json({ success: true, data: photos });
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ success: false, error: 'Interne server fout' });
  }
});

// ========== WAITLIST ROUTES ==========

/**
 * POST /api/upload-hero
 * Admin route - upload hero/banner foto
 */
const heroUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const heroDir = path.join(UPLOADS_DIR, 'hero');
      if (!require('fs').existsSync(heroDir)) {
        require('fs').mkdirSync(heroDir, { recursive: true });
      }
      cb(null, heroDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `hero${ext}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Alleen JPG, PNG en WebP zijn toegestaan'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

app.post('/api/admin/upload-hero', authenticateToken, heroUpload.single('hero'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Geen bestand geüpload' });
    }
        const baseUrl = process.env.FLY_APP_URL || `http://localhost:${PORT}`;
        const heroUrl = `/uploads/hero/${req.file.filename}`;

    // Sla op in home_content
    db.run(
      "INSERT OR REPLACE INTO home_content (section, content, updated_at) VALUES ('hero_image', ?, datetime('now'))",
      [heroUrl],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ success: false, error: 'Opslaan mislukt' });
        }
        res.json({ success: true, message: 'Hero foto bijgewerkt!', data: { url: heroUrl, updated_at: new Date().toISOString() } });
      }
    );
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ success: false, error: 'Upload mislukt' });
  }
});

/**
 * GET /api/hero-image
 * Publiek - haal hero afbeelding URL op
 */
app.get('/api/hero-image', (req, res) => {
  try {
    db.get("SELECT content, updated_at FROM home_content WHERE section = 'hero_image'", (err, row) => {
      if (err) {
        return res.status(500).json({ success: false, error: 'Fout bij ophalen' });
      }
      res.json({
        success: true,
        data: { url: row?.content || null, updated_at: row?.updated_at || null }
      });
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ success: false, error: 'Interne server fout' });
  }
});

/**
 * POST /api/waitlist
 * Publieke route - inschrijven op wachtlijst
 */
app.post('/api/waitlist', (req, res) => {
  try {
    const { name, email, phone, preferred_barber, preferred_service, preferred_date, notes } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ 
        success: false, 
        error: 'Naam en telefoonnummer zijn verplicht' 
      });
    }

    db.run(
      `INSERT INTO waitlist (name, email, phone, preferred_barber, preferred_service, preferred_date, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'waiting')`,
      [name, email || '', phone, preferred_barber || '', preferred_service || '', preferred_date || '', notes || ''],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ success: false, error: 'Inschrijven op wachtlijst mislukt' });
        }
        res.status(201).json({
          success: true,
          message: 'Je bent ingeschreven op de wachtlijst! We bellen je terug zodra er een plek vrij is.',
          data: { id: this.lastID }
        });
      }
    );
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ success: false, error: 'Interne server fout' });
  }
});

/**
 * GET /api/admin/waitlist
 * Admin route - haal wachtlijst op
 */
app.get('/api/admin/waitlist', authenticateToken, (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM waitlist';
    const params = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ success: false, error: 'Wachtlijst ophalen mislukt' });
      }
      res.json({ success: true, data: rows || [] });
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ success: false, error: 'Interne server fout' });
  }
});

/**
 * PUT /api/admin/waitlist/:id/contacted
 * Admin route - markeer als gecontacteerd
 */
app.put('/api/admin/waitlist/:id/contacted', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    db.run(
      `UPDATE waitlist SET contacted = 1, contacted_at = datetime('now'), status = 'contacted' WHERE id = ?`,
      [id],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ success: false, error: 'Status bijwerken mislukt' });
        }
        res.json({ success: true, message: 'Gemarkeerd als gecontacteerd' });
      }
    );
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ success: false, error: 'Interne server fout' });
  }
});

/**
 * DELETE /api/admin/waitlist/:id
 * Admin route - verwijder wachtlijst item
 */
app.delete('/api/admin/waitlist/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    db.run('DELETE FROM waitlist WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ success: false, error: 'Verwijderen mislukt' });
      }
      res.json({ success: true, message: 'Verwijderd van wachtlijst' });
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ success: false, error: 'Interne server fout' });
  }
});

// ========== STATIC FILES & FALLBACK ==========

// Mount admin routes
const adminRouter = createAdminRoutes(db, authenticateToken, servicesMap, invalidateServicesCache);
app.use('/api/admin', adminRouter);

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

// ========== REMINDER SYSTEM (CRON JOB) ==========

/**
 * Checkt elk uur of er afspraken zijn die over ~24 uur plaatsvinden
 * en stuurt een reminder email als die nog niet is verstuurd.
 * 
 * Gebruikt een 'reminder_sent' kolom om dubbele reminders te voorkomen.
 */

// Voeg reminder_sent kolom toe als die nog niet bestaat
db.run(`ALTER TABLE appointments ADD COLUMN reminder_sent INTEGER DEFAULT 0`, (err) => {
  if (err && !err.message.includes('duplicate column')) {
    console.error('⚠️ Kon reminder_sent kolom niet toevoegen:', err.message);
  }
});

async function checkAndSendReminders() {
  try {
    const today = new Date();
    // Tomorrow's date
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    console.log(`🔍 [Reminder 24u] Checking appointments for ${tomorrowStr}...`);

    // Find all active appointments for tomorrow that haven't received a reminder yet
    db.all(
      `SELECT a.id, a.name, a.email, a.treatment, a.barber_name, a.date, a.time, ct.token as cancel_token
       FROM appointments a
       LEFT JOIN cancellation_tokens ct ON ct.appointment_id = a.id AND ct.used = 0
       WHERE a.date = ? AND a.status = 'active' AND a.email != '' AND a.email IS NOT NULL AND (a.reminder_sent IS NULL OR a.reminder_sent = 0)`,
      [tomorrowStr],
      async (err, rows) => {
        if (err) {
          console.error('❌ [Reminder 24u] Database error:', err.message);
          return;
        }

        if (!rows || rows.length === 0) {
          console.log(`📭 [Reminder 24u] Geen herinneringen te versturen voor ${tomorrowStr}`);
          return;
        }

        console.log(`📧 [Reminder 24u] ${rows.length} herinnering(en) te versturen voor ${tomorrowStr}`);

        for (const appointment of rows) {
          if (!appointment.email) continue;

          const serviceName = servicesMap[appointment.treatment] || appointment.treatment;
          const barberDisplay = barberDisplayMap[appointment.barber_name] || appointment.barber_name;
          const APP_URL = process.env.APP_URL || 'https://barbershop-mo-ma.pages.dev';
          const cancelLink = appointment.cancel_token ? `${APP_URL}/annuleren?token=${appointment.cancel_token}` : '';

          const result = await sendReminderEmail({
            email: appointment.email,
            name: appointment.name,
            service: serviceName,
            barber: barberDisplay,
            date: appointment.date,
            time: appointment.time,
            cancelLink
          });

          if (result.success) {
            // Markeer als herinnering verstuurd
            db.run('UPDATE appointments SET reminder_sent = 1 WHERE id = ?', [appointment.id], (updateErr) => {
              if (updateErr) {
                console.error(`❌ [Reminder 24u] Kon reminder status niet updaten voor ID ${appointment.id}:`, updateErr.message);
              } else {
                console.log(`✅ [Reminder 24u] Reminder gemarkeerd voor ID ${appointment.id}`);
              }
            });
          }
        }
      }
    );
  } catch (err) {
    console.error('❌ [Reminder 24u] Fout:', err.message);
  }
}

// ========== 30 MINUTEN REMINDER ==========
// Stuurt een herinnering 30 minuten voor de afspraak

// Voeg 30min_reminder_sent kolom toe als die nog niet bestaat
db.run(`ALTER TABLE appointments ADD COLUMN reminder_30min_sent INTEGER DEFAULT 0`, (err) => {
  if (err && !err.message.includes('duplicate column')) {
    console.error('⚠️ Kon reminder_30min_sent kolom niet toevoegen:', err.message);
  }
});

async function checkAndSend30MinReminders() {
  try {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Bereken huidige tijd + 30 minuten
    const targetTime = new Date(now.getTime() + 30 * 60 * 1000);
    const targetHour = targetTime.getHours().toString().padStart(2, '0');
    const targetMin = targetTime.getMinutes().toString().padStart(2, '0');
    // Check tussen target-2 min en target+2 min (speelruimte voor de cron)
    const checkTime = targetHour + ':' + targetMin;

    console.log(`🔍 [Reminder 30min] Checking appointments around ${checkTime} for ${todayStr}...`);

    // Find active appointments today within 2 minutes of the target time
    db.all(
      `SELECT a.id, a.name, a.email, a.treatment, a.barber_name, a.date, a.time, ct.token as cancel_token
       FROM appointments a
       LEFT JOIN cancellation_tokens ct ON ct.appointment_id = a.id AND ct.used = 0
       WHERE a.date = ? AND a.status = 'active' AND a.email != '' AND a.email IS NOT NULL 
       AND (a.reminder_30min_sent IS NULL OR a.reminder_30min_sent = 0)`,
      [todayStr],
      async (err, rows) => {
        if (err) {
          console.error('❌ [Reminder 30min] Database error:', err.message);
          return;
        }

        if (!rows || rows.length === 0) {
          return; // Geen afspraken vandaag
        }

        // Filter op tijd: alleen afspraken die binnen ~30 minuten zijn
        const targetTotalMin = targetTime.getHours() * 60 + targetTime.getMinutes();
        
        for (const appointment of rows) {
          if (!appointment.email) continue;
          
          const [h, m] = appointment.time.split(':').map(Number);
          const apptTotalMin = h * 60 + m;
          const diff = apptTotalMin - targetTotalMin;
          
          // Stuur alleen als de afspraak over ~30 minuten is (binnen 5 minuten marge)
          if (diff < -2 || diff > 2) continue;

          const serviceName = servicesMap[appointment.treatment] || appointment.treatment;
          const barberDisplay = barberDisplayMap[appointment.barber_name] || appointment.barber_name;
          const APP_URL = process.env.APP_URL || 'https://barbershop-mo-ma.pages.dev';
          const cancelLink = appointment.cancel_token ? `${APP_URL}/annuleren?token=${appointment.cancel_token}` : '';

          console.log(`📧 [Reminder 30min] Sturen naar ${appointment.email} voor afspraak om ${appointment.time}`);

          // Gebruik sendReminderEmail met een andere subject voor de 30-min herinnering
          const result = await sendReminderEmail({
            email: appointment.email,
            name: appointment.name,
            service: serviceName,
            barber: barberDisplay,
            date: appointment.date,
            time: appointment.time,
            cancelLink
          });

          if (result.success) {
            db.run('UPDATE appointments SET reminder_30min_sent = 1 WHERE id = ?', [appointment.id], (updateErr) => {
              if (updateErr) {
                console.error(`❌ [Reminder 30min] Kon status niet updaten voor ID ${appointment.id}:`, updateErr.message);
              } else {
                console.log(`✅ [Reminder 30min] Verstuurd voor ID ${appointment.id}`);
              }
            });
          }
        }
      }
    );
  } catch (err) {
    console.error('❌ [Reminder 30min] Fout:', err.message);
  }
}

// Plan de cron job: elke 5 minuten checken (voor 24u en 30min reminders)
// In productie: elke 30 minuten of elk uur
// Cron expressie: '*/5 * * * *' = elke 5 minuten
//                 '0 * * * *'   = elk uur
//                 '0 */6 * * *' = elke 6 uur
const REMINDER_CRON_SCHEDULE = process.env.REMINDER_CRON_SCHEDULE || '*/30 * * * *';

// Start reminder cron jobs
let reminderJob = null;
try {
  reminderJob = cron.schedule(REMINDER_CRON_SCHEDULE, () => {
    checkAndSendReminders();
    checkAndSend30MinReminders();
  });
  console.log(`⏰ Reminder cron job gestart: "${REMINDER_CRON_SCHEDULE}"`);
  console.log(`   - 24u herinnering (morgen)`);
  console.log(`   - 30min herinnering (vandaag)`);
} catch (err) {
  console.error('❌ Kon cron job niet starten:', err.message);
}

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
  console.log(`📧 Email bevestigingen: ✅ actief`);
  console.log(`⏰ Reminders: ✅ actief (elke 30 min)`);
  console.log('━'.repeat(50));
  console.log('');

  // Verifieer email configuratie bij opstart
  setTimeout(() => verifyEmailConfig(), 1000);
});

module.exports = app;


