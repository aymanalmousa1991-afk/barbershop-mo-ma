const db = require("./server/database.cjs");
setTimeout(function() {
  console.log("checking...");
  db.all("SELECT name FROM sqlite_master WHERE type='table'", function(e, r) {
    if (e) return console.log("Err:", e.message);
    console.log("Tables:", r.map(function(t) { return t.name; }).join(", "));
    db.all("SELECT * FROM photos", function(e2, r2) {
      if (e2) console.log("Photos err:", e2.message);
      else console.log("Photos:", JSON.stringify(r2));
    });
  });
}, 3000);
