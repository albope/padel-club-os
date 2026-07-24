import nextEnv from '@next/env'

const { loadEnvConfig } = nextEnv
loadEnvConfig(process.cwd())

const required = [
  'DATABASE_URL',
  'AUTH_SECRET',
  'NEXTAUTH_URL',
  'NEXT_PUBLIC_APP_URL',
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
  'HEARTBEAT_URL_REMINDERS',
  'HEARTBEAT_URL_RECURRING',
  'HEARTBEAT_URL_REFUNDS',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'SENTRY_DSN',
  'NEXT_PUBLIC_SENTRY_DSN',
  'LEGAL_ENTITY_TYPE',
  'LEGAL_NAME',
  'LEGAL_TAX_ID',
  'LEGAL_ADDRESS',
  'LEGAL_EMAIL',
  'STRIPE_TAX_ENABLED',
  'TAX_HANDLING_CONFIRMED',
  'NEXT_PUBLIC_TEMA_MARCADOR',
]

const errors = []
const missing = required.filter((key) => !process.env[key]?.trim())
if (missing.length) errors.push(`Faltan variables: ${missing.join(', ')}`)

function requireHttps(key) {
  const value = process.env[key]?.trim()
  if (value && !value.startsWith('https://')) errors.push(`${key} debe usar https://`)
}

function requirePrefix(key, prefix) {
  const value = process.env[key]?.trim()
  if (value && !value.startsWith(prefix)) errors.push(`${key} no tiene formato ${prefix}`)
}

function requireBoolean(key) {
  const value = process.env[key]?.trim()
  if (value && !['true', 'false'].includes(value)) errors.push(`${key} debe ser true o false`)
}

function requireEmail(key) {
  const value = process.env[key]?.trim()
  if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    errors.push(`${key} no tiene un formato de email valido`)
  }
}

for (const key of [
  'NEXTAUTH_URL',
  'NEXT_PUBLIC_APP_URL',
  'UPSTASH_REDIS_REST_URL',
  'SENTRY_DSN',
  'NEXT_PUBLIC_SENTRY_DSN',
  'HEARTBEAT_URL_REMINDERS',
  'HEARTBEAT_URL_RECURRING',
  'HEARTBEAT_URL_REFUNDS',
]) {
  requireHttps(key)
}

if (process.env.RATE_LIMIT_BACKEND !== 'upstash') {
  errors.push('RATE_LIMIT_BACKEND debe ser upstash en produccion')
}
if (!['individual', 'company'].includes(process.env.LEGAL_ENTITY_TYPE || '')) {
  errors.push('LEGAL_ENTITY_TYPE debe ser individual o company')
}
if ((process.env.AUTH_SECRET || '').length < 32) {
  errors.push('AUTH_SECRET debe tener al menos 32 caracteres')
}
if ((process.env.CRON_SECRET || '').length < 32) {
  errors.push('CRON_SECRET debe tener al menos 32 caracteres')
}
if (process.env.NEXTAUTH_URL && process.env.NEXT_PUBLIC_APP_URL) {
  try {
    if (new URL(process.env.NEXTAUTH_URL).origin !== new URL(process.env.NEXT_PUBLIC_APP_URL).origin) {
      errors.push('NEXTAUTH_URL y NEXT_PUBLIC_APP_URL deben tener el mismo origen')
    }
  } catch {
    errors.push('NEXTAUTH_URL o NEXT_PUBLIC_APP_URL no es una URL valida')
  }
}

requirePrefix('STRIPE_SECRET_KEY', 'sk_live_')
requirePrefix('STRIPE_WEBHOOK_SECRET', 'whsec_')
requirePrefix('STRIPE_PRICE_STARTER_MONTHLY', 'price_')
requirePrefix('STRIPE_PRICE_PRO_MONTHLY', 'price_')
requirePrefix('STRIPE_PRICE_ENTERPRISE_MONTHLY', 'price_')
requirePrefix('RESEND_API_KEY', 're_')
requirePrefix('BLOB_READ_WRITE_TOKEN', 'vercel_blob_rw_')
requireEmail('CONTACT_EMAIL')
requireEmail('LEGAL_EMAIL')

if (process.env.VAPID_SUBJECT && !/^(mailto:|https:\/\/)/.test(process.env.VAPID_SUBJECT)) {
  errors.push('VAPID_SUBJECT debe empezar por mailto: o https://')
}
if ((process.env.UPSTASH_REDIS_REST_TOKEN || '').length < 20) {
  errors.push('UPSTASH_REDIS_REST_TOKEN parece incompleto')
}
if ((process.env.LEGAL_TAX_ID || '').trim().length < 6) {
  errors.push('LEGAL_TAX_ID parece incompleto')
}

const placeholderPattern = /(?:tudominio|tu nombre|pendiente|completar|xxx|example)/i
for (const key of ['LEGAL_NAME', 'LEGAL_TAX_ID', 'LEGAL_ADDRESS', 'LEGAL_EMAIL', 'CONTACT_EMAIL']) {
  if (placeholderPattern.test(process.env[key] || '')) {
    errors.push(`${key} contiene un valor de ejemplo`)
  }
}

requireBoolean('STRIPE_TAX_ENABLED')
requireBoolean('TAX_HANDLING_CONFIRMED')
requireBoolean('NEXT_PUBLIC_TEMA_MARCADOR')
if (process.env.TAX_HANDLING_CONFIRMED !== 'true') {
  errors.push(
    'TAX_HANDLING_CONFIRMED debe ser true tras confirmar el alta, la facturacion y los impuestos aplicables',
  )
}

if (errors.length) {
  console.error('Preflight de produccion BLOQUEADO:')
  for (const error of [...new Set(errors)]) console.error(`- ${error}`)
  process.exit(1)
}

console.log('Preflight de variables de produccion superado (sin mostrar secretos).')
