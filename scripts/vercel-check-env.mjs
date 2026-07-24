import fs from 'fs';
import https from 'https';
import path from 'path';

const authCandidates = [
  process.env.APPDATA && path.join(process.env.APPDATA, 'com.vercel.cli', 'Data', 'auth.json'),
  process.env.USERPROFILE && path.join(process.env.USERPROFILE, '.vercel', 'auth.json'),
].filter(Boolean);
const authPath = authCandidates.find(candidate => fs.existsSync(candidate));
const token = process.env.VERCEL_TOKEN || (
  authPath ? JSON.parse(fs.readFileSync(authPath, 'utf8')).token : null
);
const teamId = 'team_qB4SSLuSDJryvtQkhTEB6AzK';

function apiGet(path) {
  return new Promise((resolve, reject) => {
    https.get(`https://api.vercel.com${path}`, {
      headers: { Authorization: `Bearer ${token}` }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });
}

const REQUIRED_VARS = [
  'AUTH_SECRET',
  'NEXTAUTH_URL',
  'DATABASE_URL',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_STARTER_MONTHLY',
  'STRIPE_PRICE_PRO_MONTHLY',
  'STRIPE_PRICE_ENTERPRISE_MONTHLY',
  'RESEND_API_KEY',
  'CONTACT_EMAIL',
  'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY',
  'VAPID_SUBJECT',
  'BLOB_READ_WRITE_TOKEN',
  'CRON_SECRET',
  'NEXT_PUBLIC_APP_URL',
  'LEGAL_ENTITY_TYPE',
  'LEGAL_NAME',
  'LEGAL_TAX_ID',
  'LEGAL_ADDRESS',
  'LEGAL_EMAIL',
  'STRIPE_TAX_ENABLED',
  'TAX_HANDLING_CONFIRMED',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'RATE_LIMIT_BACKEND',
  'SENTRY_DSN',
  'NEXT_PUBLIC_SENTRY_DSN',
  'HEARTBEAT_URL_REMINDERS',
  'HEARTBEAT_URL_RECURRING',
  'HEARTBEAT_URL_REFUNDS',
  'NEXT_PUBLIC_TEMA_MARCADOR',
];

const OPTIONAL_VARS = [
  'SENTRY_AUTH_TOKEN',
  'LEGAL_REGISTRY_DETAILS',
];

async function main() {
  if (!token) {
    throw new Error('No hay sesion de Vercel CLI ni VERCEL_TOKEN; no se puede inspeccionar el proyecto.');
  }
  const data = await apiGet(`/v9/projects?teamId=${teamId}`);
  const project = data.projects.find(p => p.name === 'padel-club-os');
  if (!project) { console.log('Project not found'); return; }

  console.log(`Project: ${project.name} (${project.id})`);
  console.log(`Node: ${project.nodeVersion}`);
  console.log(`Production branch: ${project.link?.productionBranch}`);
  console.log('');

  const existingKeys = new Set(project.env.map(e => e.key));
  let missingRequired = 0;

  console.log('=== REQUIRED VARS ===');
  for (const key of REQUIRED_VARS) {
    const status = existingKeys.has(key) ? 'OK' : 'MISSING';
    if (status === 'MISSING') missingRequired++;
    console.log(`  ${status === 'OK' ? '✓' : '✗'} ${key} — ${status}`);
  }

  console.log('');
  console.log('=== OPTIONAL VARS ===');
  for (const key of OPTIONAL_VARS) {
    const status = existingKeys.has(key) ? 'OK' : 'not set';
    console.log(`  ${status === 'OK' ? '✓' : '-'} ${key} — ${status}`);
  }

  console.log('');
  console.log('=== VARS IN VERCEL NOT IN OUR LIST ===');
  for (const key of existingKeys) {
    if (!REQUIRED_VARS.includes(key) && !OPTIONAL_VARS.includes(key)) {
      console.log(`  ? ${key} (may be legacy/unused)`);
    }
  }

  if (missingRequired > 0) {
    console.error(`\nPreflight Vercel bloqueado: faltan ${missingRequired} variables requeridas.`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
