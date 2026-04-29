const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'barbershop.db');
const db = new sqlite3.Database(dbPath);

// Enable WAL mode for better performance
db.run('PRAGMA journal_mode=WAL');
db.run('PRAGMA foreign_keys=ON');

// Initialize database tables
db.serialize(() => {
  console.log('🔧 Initializing database...');

  // Barbers table
  db.run(`CREATE TABLE IF NOT EXISTS barbers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Appointments table
  db.run(`CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barberId INTEGER,
    barber_name TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    treatment TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    notes TEXT DEFAULT '',
    status TEXT DEFAULT 'active',
    created_by TEXT DEFAULT 'public',
    reminder_sent INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (barberId) REFERENCES barbers(id)
  )`);

  // Admin table
  db.run(`CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Services table (beheerbare diensten)
  db.run(`CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    duration INTEGER DEFAULT 30,
    price DECIMAL(6,2) DEFAULT 0,
    description TEXT DEFAULT '',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Barber absences table (afwezigheid)
  db.run(`CREATE TABLE IF NOT EXISTS barber_absences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barber_name TEXT NOT NULL,
    date TEXT NOT NULL,
    start_time TEXT,
    end_time TEXT,
    reason TEXT DEFAULT '',
    is_full_day INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(barber_name, date, start_time)
  )`);

  // Password reset tokens table
  db.run(`CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admin(id)
  )`);

  // Insert default services if table is empty
  db.get('SELECT COUNT(*) as count FROM services', (err, row) => {
    if (err) return;
    if (row.count === 0) {
      const insert = db.prepare('INSERT OR IGNORE INTO services (key, name, duration, price, description) VALUES (?, ?, ?, ?, ?)');
      insert.run('knippen-stylen', 'Knippen + stylen (wax)', 30, 26.00, 'Knippen en stylen met wax');
      insert.run('knippen-baard', 'Knippen + baard stylen/scheren', 45, 35.00, 'Knippen en baard verzorging');
      insert.run('senioren', 'Senioren 65+ knippen + stylen', 30, 22.00, 'Knippen en stylen voor senioren');
      insert.run('tondeuse', 'Alles één lengte/kaalscheren', 20, 18.00, 'Tondeuse of kaalscheren');
      insert.run('baard', 'Baard stylen of scheren', 20, 17.50, 'Baard verzorging');
      insert.run('baard-nek', 'Baard + neklijnen bijwerken', 25, 20.00, 'Baard en nek trimmen');
      insert.run('jong-tm11', 'Jongens t/m 11 jaar', 20, 18.00, 'Kinderen t/m 11 jaar');
      insert.run('jong-12-13', 'Jongens 12-13 jaar', 25, 20.00, 'Jongeren 12-13 jaar');
      insert.finalize();
      console.log('✅ Default services created');
    }
  });

  // Insert default barbers if not exist
  db.get('SELECT COUNT(*) as count FROM barbers', (err, row) => {
    if (err) {
      console.error('❌ Error checking barbers:', err);
      return;
    }
    if (row.count === 0) {
      const insert = db.prepare('INSERT OR IGNORE INTO barbers (name, display_name) VALUES (?, ?)');
      insert.run('mo', 'Mo');
      insert.run('ma', 'Ma');
      insert.run('third', 'Derde kapper');
      insert.finalize();
      console.log('✅ Default barbers created: Mo, Ma, Derde kapper');
    } else {
      console.log(`ℹ️  ${row.count} barbers already exist`);
    }
  });

  // Create or update admin user
  const adminPasswordHash = bcrypt.hashSync('Barber123!', 10);
  db.get('SELECT COUNT(*) as count FROM admin WHERE username = ?', ['admin'], (err, row) => {
    if (err) {
      console.error('❌ Error checking admin:', err);
      return;
    }
    if (row.count === 0) {
      db.run('INSERT INTO admin (username, passwordHash, role) VALUES (?, ?, ?)',
        ['admin', adminPasswordHash, 'admin'],
        (err) => {
          if (err) {
            console.error('❌ Error creating admin user:', err);
          } else {
            console.log('✅ Admin user created (username: admin, password: Barber123!)');
          }
        }
      );
    } else {
      db.run('UPDATE admin SET passwordHash = ? WHERE username = ?',
        [adminPasswordHash, 'admin'],
        (err) => {
          if (err) {
            console.error('❌ Error updating admin password:', err);
          } else {
            console.log('ℹ️  Admin user exists, password synced');
          }
        }
      );
    }
  });

  console.log('✅ Database initialization complete');
});

module.exports = db;
