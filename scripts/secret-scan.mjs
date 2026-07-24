import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"

const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean)

const ignored = [
  /^package-lock\.json$/,
  /(^|\/)(test-results|playwright-report)\//,
  /\.(png|jpe?g|gif|webp|ico|woff2?|pdf|zip)$/i,
]

const detectors = [
  { name: "Stripe secret", regex: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/g },
  { name: "Stripe webhook secret", regex: /\bwhsec_[A-Za-z0-9]{16,}\b/g },
  { name: "GitHub token", regex: /\bgh[pousr]_[A-Za-z0-9_]{30,}\b/g },
  { name: "Google API key", regex: /\bAIza[0-9A-Za-z_-]{30,}\b/g },
  { name: "Resend API key", regex: /\bre_[A-Za-z0-9_-]{24,}\b/g },
  { name: "Private key", regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  {
    name: "Database URL with credentials",
    regex: /\bpostgres(?:ql)?:\/\/[^:\s"'<>]+:[^@\s"'<>]{8,}@[^/\s"'<>]+/g,
  },
]

const placeholders = /(?:example|placeholder|replace|not-real|dummy|xxxx|\.\.\.|localhost|postgres:postgres)/i
const findings = []

for (const file of tracked) {
  if (ignored.some((pattern) => pattern.test(file))) continue
  let contents
  try {
    contents = readFileSync(file, "utf8")
  } catch {
    continue
  }
  for (const detector of detectors) {
    detector.regex.lastIndex = 0
    for (const match of contents.matchAll(detector.regex)) {
      if (placeholders.test(match[0])) continue
      const line = contents.slice(0, match.index).split(/\r?\n/).length
      findings.push(`${file}:${line} — ${detector.name}`)
    }
  }
}

if (findings.length > 0) {
  console.error("Posibles secretos encontrados en archivos versionados:")
  for (const finding of findings) console.error(`- ${finding}`)
  process.exit(1)
}

console.log(`Secret scan correcto: ${tracked.length} archivos versionados revisados.`)
