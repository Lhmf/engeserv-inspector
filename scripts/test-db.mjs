import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const workdir = 'C:/Users/luizh/AppData/Local/Temp/opencode/prismadir';
const prismaCli = 'C:/Users/luizh/Documents/Codex/2026-07-19/new-chat/engeserv-inspector/node_modules/prisma/build/index.js';
const schemaPath = 'C:/Users/luizh/Documents/Codex/2026-07-19/new-chat/engeserv-inspector/prisma/schema.prisma';
const tsxCli = 'C:/Users/luizh/Documents/Codex/2026-07-19/new-chat/engeserv-inspector/node_modules/tsx/dist/cli.mjs';

function parseEnvFile(filePath) {
  const values = {};
  if (!fs.existsSync(filePath)) return values;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

function safeHost(url) {
  try {
    return new URL(url).host;
  } catch {
    return '(URL inválida)';
  }
}

const dotenvTest = parseEnvFile(path.join(root, '.env.test'));
const testUrl = process.env.TEST_DATABASE_URL || dotenvTest.TEST_DATABASE_URL;
if (!testUrl) {
  console.error('ERRO: TEST_DATABASE_URL ausente em .env.test ou no ambiente.');
  process.exit(1);
}

const productionLikeUrls = [
  process.env.POSTGRES_URL,
  process.env.DATABASE_URL,
  process.env.PRISMA_DATABASE_URL,
  parseEnvFile(path.join(root, '.env')).POSTGRES_URL,
  parseEnvFile(path.join(root, '.env')).DATABASE_URL,
  parseEnvFile(path.join(root, '.env.production')).POSTGRES_URL,
  parseEnvFile(path.join(root, '.env.production.local')).POSTGRES_URL,
].filter(Boolean);

if (productionLikeUrls.includes(testUrl)) {
  console.error('ERRO: TEST_DATABASE_URL aponta para uma URL já usada como produção/Preview.');
  console.error(`Host informado: ${safeHost(testUrl)}`);
  process.exit(1);
}

process.env.POSTGRES_URL = testUrl;
process.env.DATABASE_URL = testUrl;
process.env.PRISMA_DATABASE_URL = testUrl;

function run(command, args, label, cwd) {
  console.log(`\n[${label}] iniciando...`);
  if (!fs.existsSync(workdir)) fs.mkdirSync(workdir, { recursive: true });
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: process.env,
    cwd: cwd || workdir,
    shell: true,
  });
  if (result.status !== 0) {
    console.error(`[${label}] falhou com codigo ${result.status}.`);
    process.exit(result.status ?? 1);
  }
}

const action = process.argv[2] || 'push';
if (action === 'push') {
  run('node', [prismaCli, 'db', 'push', '--schema', schemaPath], 'prisma db push');
} else if (action === 'seed') {
  run('node', [tsxCli, 'prisma/seed.ts'], 'db:seed', root);
} else if (action === 'reset') {
  run('node', [prismaCli, 'db', 'push', '--schema', schemaPath, '--force-reset'], 'prisma db push --force-reset');
} else {
  console.error(`Acao desconhecida: ${action}. Use push, seed ou reset.`);
  process.exit(1);
}
