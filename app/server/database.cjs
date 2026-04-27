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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (barberId) REFERENCES barbers(id)
  )`);

  // Admin table (renamed from 'users' for clarity)
  db.run(`CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

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
      // Update existing admin password if needed
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

