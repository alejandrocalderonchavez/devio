import fs from 'fs';
import path from 'path';

const dir = path.join(__dirname);
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

console.log('=== BUBBLE DATA FILES INSPECTION ===\n');

for (const file of files.sort()) {
  const filePath = path.join(dir, file);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    const count = Array.isArray(data) ? data.length : 0;
    const sample = count > 0 ? Object.keys(data[0]) : [];
    console.log(`📁 File: ${file}`);
    console.log(`   Count: ${count} records`);
    console.log(`   Fields: ${sample.join(', ')}`);
    console.log('');
  } catch (err: any) {
    console.error(`❌ Error reading ${file}:`, err.message);
  }
}
