with open("server/adminRoutes.cjs","r",encoding="utf8") as f:
    c = f.read()

# Add routes for admin to get all appointments (including cancelled) and barbers list
old_last = "  return router;"
new_last = """  // ========== ALLE AFSPRAKEN (inclusief geannuleerd) ==========
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

  // ========== BARBERS OPHALEN (admin) ==========
  router.get('/barbers', authenticateToken, (req, res) => {
    db.all("SELECT id, name, display_name, is_active FROM barbers ORDER BY display_name ASC", (err, rows) => {
      if (err) return res.status(500).json({ success: false, error: "Fout" });
      res.json({ success: true, data: rows || [] });
    });
  });

  return router;"""

c = c.replace(old_last, new_last)

with open("server/adminRoutes.cjs","w",encoding="utf8") as f:
    f.write(c)
print("adminRoutes.cjs updated")
