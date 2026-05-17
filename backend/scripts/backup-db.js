const fs = require('fs');
const path = require('path');

const dbFile = path.resolve(__dirname, '../prisma/dev.db');
const backupsDir = path.resolve(__dirname, '../backups');

if (!fs.existsSync(dbFile)) {
  console.error(`Banco nao encontrado em: ${dbFile}`);
  process.exit(1);
}

fs.mkdirSync(backupsDir, { recursive: true });

const now = new Date();
const pad = (value) => String(value).padStart(2, '0');
const fileName = `dev-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.db`;
const destination = path.join(backupsDir, fileName);

fs.copyFileSync(dbFile, destination);
console.log(`Backup criado: ${destination}`);
