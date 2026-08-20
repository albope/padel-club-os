import nextEnv from '@next/env'
import { evaluateLaunchReadiness } from '../src/lib/launch-readiness'

const { loadEnvConfig } = nextEnv
loadEnvConfig(process.cwd())

const { stage, issues } = evaluateLaunchReadiness(process.env)

if (issues.length) {
  console.error(`Preflight de produccion BLOQUEADO para etapa ${stage}:`)
  for (const issue of issues) console.error(`- ${issue}`)
  process.exitCode = 1
} else {
  console.log(
    `Preflight de variables de produccion superado para etapa ${stage} (sin mostrar secretos).`,
  )
}
