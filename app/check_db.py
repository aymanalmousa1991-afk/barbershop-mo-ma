import sqlite3, os
db_path = os.path.join('server', 'database.sqlite')
print('DB:', db_path, 'exists:', os.path.exists(db_path))
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in cur.fetchall()]
print('Tables:', tables)
if 'photos' in tables:
    print('Has photos table!')
    cur.execute("SELECT * FROM photos LIMIT 3")
    print('Photos:', cur.fetchall())
else:
    print('NO photos table!')
    # Check schema for appointments
    cur.execute("SELECT sql FROM sqlite_master WHERE name='appointments'")
    schema = cur.fetchone()
    if schema:
        print('Schema excerpt:', schema[0][:300])
