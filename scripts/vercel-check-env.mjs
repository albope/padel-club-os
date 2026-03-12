import fs from 'fs';
import https from 'https';

const auth = JSON.parse(fs.readFileSync(process.env.APPDATA + '/com.vercel.cli/Data/auth.json', 'utf8'));
const token = auth.token;
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
  'CRON_SECRET',
  'NEXT_PUBLIC_APP_URL',
];

const OPTIONAL_VARS = [
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'SENTRY_DSN',
  'NEXT_PUBLIC_SENTRY_DSN',
  'SENTRY_AUTH_TOKEN',
];

async function main() {
  const data = await apiGet(`/v9/projects?teamId=${teamId}`);
  const project = data.projects.find(p => p.name === 'padel-club-os');
  if (!project) { console.log('Project not found'); return; }

  console.log(`Project: ${project.name} (${project.id})`);
  console.log(`Node: ${project.nodeVersion}`);
  console.log(`Production branch: ${project.link?.productionBranch}`);
  console.log('');

  const existingKeys = new Set(project.env.map(e => e.key));

  console.log('=== REQUIRED VARS ===');
  for (const key of REQUIRED_VARS) {
    const status = existingKeys.has(key) ? 'OK' : 'MISSING';
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
}

main().catch(console.error);
