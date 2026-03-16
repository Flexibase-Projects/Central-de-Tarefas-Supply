import sharp from 'sharp';
import { writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
// Cursor usado pela app (main.tsx importa de src/assets)
const assetsCursor = path.join(root, 'src', 'assets', 'PurpleCursor.png');

const buffer = await sharp(assetsCursor).resize(16, 16).png().toBuffer();
writeFileSync(assetsCursor, buffer);
console.log('Cursor redimensionado para 16x16 em src/assets/PurpleCursor.png');
