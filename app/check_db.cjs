const db = require("./server/database.cjs");
console.log('test');

const db = require('./server/database.cjs');
db.all('SELECT name FROM sqlite_master WHERE type='\''table'\''', (e, r) => { console.log('Tabellen:', r ? r.map(t => t.name).join(', ') : e.message); });
