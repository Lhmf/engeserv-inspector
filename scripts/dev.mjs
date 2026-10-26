import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import EmbeddedPostgres from 'embedded-postgres';

const root = process.cwd();
const dataDir = path.join(root, '.tmp', 'pg', 'data');
const requestedPort = Number(process.env.TEST_PG_PORT || 54331);
const pidFile = path.join(dataDir, 'postmaster.pid');
let port = requestedPort;
let postgresAlreadyRunning = false;

if (fs.existsSync(pidFile)) {
  const pidLines = fs.readFileSync(pidFile, 'utf8').split(/\r?\n/);
  const pid = Number(pidLines[0]);
  const existingPort = Number(pidLines[3]);
  try {
    process.kill(pid, 0);
    if (existingPort > 0) {
      port = existingPort;
      postgresAlreadyRunning = true;
      console.log(`PostgreSQL já está em execução em 127.0.0.1:${port}.`);
    }
  } catch {
    fs.unlinkSync(pidFile);
    console.log('Lock órfão do PostgreSQL removido.');
  }
}

const databaseUrl = `postgresql://postgres:postgres@127.0.0.1:${port}/postgres`;
const postgres = new EmbeddedPostgres({
  databaseDir: dataDir,
  port,
  user: 'postgres',
  password: 'postgres',
  persistent: true,
  onLog: (message) => console.log('[pg]', message),
  onError: (error) => console.error('[pg-error]', error),
});

function isPortOpen(checkPort) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port: checkPort });
    const finish = (open) => {
      socket.destroy();
      resolve(open);
    };
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
    socket.setTimeout(1000, () => finish(false));
  });
}

const env = {
  ...process.env,
  POSTGRES_URL: databaseUrl,
  DATABASE_URL: databaseUrl,
  PRISMA_DATABASE_URL: databaseUrl,
};

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    env,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} terminou com código ${result.status ?? 1}`);
  }
}

let nextProcess;
let stopping = false;

async function stop() {
  if (stopping) return;
  stopping = true;
  if (nextProcess && !nextProcess.killed) nextProcess.kill();
  await postgres.stop().catch(() => {});
}

async function main() {
  fs.mkdirSync(path.dirname(dataDir), { recursive: true });
  if (postgresAlreadyRunning && !(await isPortOpen(port))) {
    console.log('O processo do PostgreSQL não aceita conexões; reiniciando o banco local...');
    await postgres.stop().catch(() => {});
    if (fs.existsSync(pidFile)) fs.unlinkSync(pidFile);
    postgresAlreadyRunning = false;
  }
  if (!postgresAlreadyRunning && !fs.existsSync(path.join(dataDir, 'PG_VERSION'))) {
    console.log('Inicializando banco local de desenvolvimento...');
    await postgres.initialise();
  }
  if (!postgresAlreadyRunning) await postgres.start();
  console.log(`Banco local disponível em 127.0.0.1:${port}`);

  run(process.execPath, [path.join(root, 'node_modules', 'prisma', 'build', 'index.js'), 'db', 'push', '--skip-generate', '--schema', path.join(root, 'prisma', 'schema.prisma')]);
  run(process.execPath, [path.join(root, 'node_modules', 'tsx', 'dist', 'cli.mjs'), path.join(root, 'prisma', 'seed.ts')]);

  const nextCli = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');
  nextProcess = spawn(process.execPath, [nextCli, 'dev', ...process.argv.slice(2)], {
    cwd: root,
    env,
    stdio: 'inherit',
    windowsHide: false,
  });
  nextProcess.on('exit', async (code) => {
    await stop();
    process.exit(code ?? 0);
  });
}

process.on('SIGINT', () => void stop().finally(() => process.exit(0)));
process.on('SIGTERM', () => void stop().finally(() => process.exit(0)));

main().catch(async (error) => {
  console.error('Falha ao iniciar desenvolvimento:', error);
  await stop();
  process.exit(1);
});
