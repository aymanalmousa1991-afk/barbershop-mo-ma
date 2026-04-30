const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'src', 'sections', 'AdminDashboard.tsx');
let c = fs.readFileSync(file, 'utf8');

// Remove duplicate Input/Textarea imports - keep only one
// The bug: import { Input } from '@/components/ui/input'; appears twice
const lines = c.split('\n');
let uniqueLines = [];
let prevLine = '';
for (const line of lines) {
  // Skip duplicate Input/Textarea imports
  if ((line.includes("import { Input } from") || line.includes("import { Textarea } from")) && 
      (prevLine.includes("import { Input } from") || prevLine.includes("import { Textarea } from"))) {
    // Duplicate - skip
    continue;
  }
  uniqueLines.push(line);
  prevLine = line;
}

c = uniqueLines.join('\n');

fs.writeFileSync(file, c, 'utf8');
console.log('Fixed duplicate imports');
