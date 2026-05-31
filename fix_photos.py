import re
with open('server/server.cjs', 'r', encoding='utf-8') as f:
    c = f.read()

old = "if (err) return res.status(500).json({ success: false, error: \"Fotos ophalen mislukt\" });"
new = "if (err) { console.error('Photos query error:', err.message); return res.status(500).json({ success: false, error: \"Fotos ophalen mislukt\" }); }"
c = c.replace(old, new)

with open('server/server.cjs', 'w', encoding='utf-8') as f:
    f.write(c)
print('Done! Added error logging')
