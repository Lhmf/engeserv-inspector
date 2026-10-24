import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import EmbeddedPostgres from 'embedded-postgres';

const root = process.cwd();
const dataDir = path.join(root, '.tmp', 'pg', 'data');
const outDir = path.join(root, '.tmp', 'pg');
const port = Number(process.env.TEST_PG_PORT || 54331);
const user = 'postgres';
const password = 'postgres';
const dbName = 'postgres';
const envFile = path.join(outDir, 'test-env.json');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  port,
  user,
  password,
  persistent: true,
  onLog: (m) => console.log('[pg]', m),
  onError: (e) => console.error('[pg-error]', e),
});

async function main() {
  if (!fs.existsSync(path.join(dataDir, 'PG_VERSION'))) {
    console.log('Inicializando cluster PostgreSQL...');
    await pg.initialise();
  }
  console.log('Iniciando cluster PostgreSQL...');
  await pg.start();
  const url = `postgresql://${user}:${password}@127.0.0.1:${port}/${dbName}`;
  fs.writeFileSync(envFile, JSON.stringify({ POSTGRES_URL: url, port }, null, 2));
  console.log('PostgreSQL pronto.');
  console.log(`DATABASE_LABEL=localhost:${port}/postgres`);
  // keep process alive
  process.on('SIGINT', async () => { await pg.stop(); process.exit(0); });
  process.on('SIGTERM', async () => { await pg.stop(); process.exit(0); });
  setInterval(() => {}, 60000);
}

main().catch((e) => {
  console.error('Falha ao iniciar PostgreSQL:', e);
  process.exit(1);
});
