import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outPath = path.join(__dirname, 'test_write_output.txt');
fs.writeFileSync(outPath, `Time: ${new Date().toISOString()}\nStatus: OK`);
console.log('Wrote file at:', outPath);