const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'src', 'sections', 'AdminDashboard.tsx');
let c = fs.readFileSync(targetFile, 'utf8');

// Fix the empty slot in agenda - replace the div with em-dash to a clickable button
const oldSlot = '<div className="text-xs text-stone-100 italic">ÔÇö</div>';
const newSlot = '<button onClick={() => { setAddBarber(key); setAddTime(time); setAddDialogOpen(true); }} \n                                        className="w-full text-left group hover:bg-stone-100 rounded px-1 -mx-1 transition-colors">\n                                        <span className="text-xs text-stone-200 group-hover:text-stone-400 italic">+ Toevoegen</span>\n                                      </button>';

if (c.includes(oldSlot)) {
  c = c.replace(oldSlot, newSlot);
  console.log('Fixed empty slot');
} else {
  console.log('Old slot not found, searching for alternatives...');
  // Try to find any div with italic
  const idx = c.indexOf('italic">');
  if (idx >= 0) {
    const start = c.lastIndexOf('<div', idx);
    const end = c.indexOf('</div>', idx) + 6;
    const found = c.substring(start, end);
    console.log('Found:', found);
    c = c.replace(found, newSlot);
    console.log('Fixed');
  }
}

fs.writeFileSync(targetFile, c, 'utf8');

// Verify
c = fs.readFileSync(targetFile, 'utf8');
console.log('Has + Toevoegen:', c.includes('+ Toevoegen'));
console.log('Has AddAppointmentDialog:', c.includes('AddAppointmentDialog'));
console.log('Has handleAddAppointment:', c.includes('handleAddAppointment'));
console.log('Has Plus import:', c.includes('Plus'));
console.log('Has moveDate:', c.includes('moveDate'));
