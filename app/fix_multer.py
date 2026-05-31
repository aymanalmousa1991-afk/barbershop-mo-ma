import re

with open('server/adminRoutes.cjs', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add multer import at the top
content = content.replace(
    "const express = require('express');",
    "const express = require('express');\nconst multer = require('multer');\nconst path = require('path');\nconst fs = require('fs');"
)

# 2. Add multer config after module.exports
content = content.replace(
    "module.exports = function(db, authenticateToken, servicesMap) {",
    "module.exports = function(db, authenticateToken, servicesMap) {\n\n  // Multer config voor foto uploads\n  const uploadDir = path.join(__dirname, '../uploads/photos');\n  if (!fs.existsSync(uploadDir)) {\n    fs.mkdirSync(uploadDir, { recursive: true });\n  }\n\n  const storage = multer.diskStorage({\n    destination: (req, file, cb) => cb(null, uploadDir),\n    filename: (req, file, cb) => {\n      const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);\n      cb(null, uniqueName);\n    }\n  });\n  const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });\n"
)

# 3. Replace the POST /photos route
old_photos_post = """  router.post('/photos', authenticateToken, (req, res) => {
    const { filename, caption } = req.body;
    if (!filename) return res.status(400).json({ success: false, error: 'Bestandsnaam is verplicht' });

    db.run('INSERT INTO photos (filename, caption) VALUES (?, ?)',
      [filename, caption || ''],
      function(err) {
        if (err) return res.status(500).json({ success: false, error: 'Foto toevoegen mislukt' });
        res.status(201).json({ success: true, data: { id: this.lastID } });
      }
    );
  });"""

new_photos_post = """  router.post('/photos', authenticateToken, upload.single('photo'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, error: 'Geen bestand geselecteerd' });

    const filename = req.file.filename;
    const caption = req.body.caption || '';

    db.run('INSERT INTO photos (filename, caption) VALUES (?, ?)',
      [filename, caption],
      function(err) {
        if (err) return res.status(500).json({ success: false, error: 'Foto toevoegen mislukt' });
        res.status(201).json({ success: true, data: { id: this.lastID, filename } });
      }
    );
  });

  // Serveer geuploade fotos via /api/uploads/photos
  router.use('/uploads/photos', express.static(uploadDir));"""

content = content.replace(old_photos_post, new_photos_post)

with open('server/adminRoutes.cjs', 'w', encoding='utf-8') as f:
    f.write(content)
print('Multer geimplementeerd voor foto uploads')
