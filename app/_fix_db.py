with open("server/database.cjs","r",encoding="utf8") as f:
    c = f.read()

# Add new tables after existing tables

old_insert = """  // Insert default services if table is empty
  db.get('SELECT COUNT(*) as count FROM services', (err, row) => {"""

new_insert = """  // Home content table (editbare teksten)
  db.run(`CREATE TABLE IF NOT EXISTS home_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section TEXT UNIQUE NOT NULL,
    content TEXT DEFAULT '',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Photos table
  db.run(`CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT UNIQUE NOT NULL,
    caption TEXT DEFAULT '',
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Cancellation tokens table
  db.run(`CREATE TABLE IF NOT EXISTS cancellation_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
  )`);

  // Insert default services if table is empty
  db.get('SELECT COUNT(*) as count FROM services', (err, row) => {"""

c = c.replace(old_insert, new_insert)

with open("server/database.cjs","w",encoding="utf8") as f:
    f.write(c)
print("database.cjs updated")
