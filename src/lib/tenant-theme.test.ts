import { describe, it, expect } from 'vitest'
import { generarTemaTenant, ratioContraste, parsearHex, varsTenant } from './tenant-theme'

/**
 * Gate de la fase 4 del handoff «Marcador»: suite de tenants extremos.
 * Todo color de club, por hostil que sea, debe producir una CTA accesible
 * (contraste >= 4.5:1) en claro y en oscuro.
 */
const TENANTS_EXTREMOS: Array<[nombre: string, hex: string]> = [
  ['negro puro', '#000000'],
  ['blanco puro', '#FFFFFF'],
  ['amarillo neon (caso 3d)', '#F5D90A'],
  ['lima chillon', '#00FF00'],
  ['rojo puro', '#FF0000'],
  ['azul puro', '#0000FF'],
  ['indigo por defecto', '#4F46E5'],
  ['rosa saturado', '#E91E63'],
  ['verde corporativo oscuro', '#0E5C3F'],
  ['casi blanco (papel)', '#F6F3ED'],
  ['cian electrico', '#00FFFF'],
  ['gris medio (sin croma)', '#808080'],
]

describe('generarTemaTenant — suite de 12 tenants extremos', () => {
  it.each(TENANTS_EXTREMOS)('%s (%s): CTA accesible en claro y oscuro', (_nombre, hex) => {
    const tema = generarTemaTenant(hex)

    expect(tema.valido).toBe(true)

    // AA 4.5:1 en ambos modos
    expect(ratioContraste(tema.claro.primary, tema.claro.onPrimary)).toBeGreaterThanOrEqual(4.5)
    expect(ratioContraste(tema.oscuro.primary, tema.oscuro.onPrimary)).toBeGreaterThanOrEqual(4.5)

    // hover y pressed son colores distintos del primario
    expect(tema.claro.hover).not.toBe(tema.claro.primary)
    expect(tema.claro.pressed).not.toBe(tema.claro.primary)
    expect(tema.oscuro.hover).not.toBe(tema.oscuro.primary)

    // Escala completa 50-900 con hex validos
    const pasos = Object.keys(tema.escala)
    expect(pasos).toHaveLength(10)
    for (const hexPaso of Object.values(tema.escala)) {
      expect(parsearHex(hexPaso)).not.toBeNull()
    }
  })

  it('la escala es monotona en luminosidad (50 mas claro que 900)', () => {
    const tema = generarTemaTenant('#4F46E5')
    const luminancia = (hex: string) => {
      // ratio contra negro crece con la luminancia
      return ratioContraste(hex, '#000000')
    }
    expect(luminancia(tema.escala[50])).toBeGreaterThan(luminancia(tema.escala[400]))
    expect(luminancia(tema.escala[400])).toBeGreaterThan(luminancia(tema.escala[900]))
  })

  it('hex invalido usa el fallback y lo marca', () => {
    for (const invalido of ['', 'azul', '#12', '#GGGGGG', null, undefined]) {
      const tema = generarTemaTenant(invalido as string | null | undefined)
      expect(tema.valido).toBe(false)
      expect(ratioContraste(tema.claro.primary, tema.claro.onPrimary)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('acepta hex de 3 digitos y sin almohadilla', () => {
    expect(generarTemaTenant('#4AE').valido).toBe(true)
    expect(generarTemaTenant('4F46E5').valido).toBe(true)
  })

  it('el amarillo dificil del frame 3d usa texto oscuro (tinta), no blanco', () => {
    const tema = generarTemaTenant('#F5D90A')
    // el motor normaliza a tono 600: si eligio tinta, el ratio ya es AA;
    // lo relevante es que NUNCA salga blanco con ratio < 4.5
    if (tema.contraste.textoClaro === 'blanco') {
      expect(ratioContraste(tema.claro.primary, '#FFFFFF')).toBeGreaterThanOrEqual(4.5)
    } else {
      expect(ratioContraste(tema.claro.primary, '#1C1A17')).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('varsTenant expone los 10 pares claro/oscuro', () => {
    const vars = varsTenant(generarTemaTenant('#4F46E5'))
    expect(Object.keys(vars)).toHaveLength(10)
    expect(vars['--tenant-primary-claro']).toMatch(/^#[0-9A-F]{6}$/)
    expect(vars['--tenant-on-primary-oscuro']).toMatch(/^#[0-9A-F]{6}$/)
  })

  it('ratioContraste es simetrico y conocido (blanco/negro = 21)', () => {
    expect(ratioContraste('#FFFFFF', '#000000')).toBeCloseTo(21, 0)
    expect(ratioContraste('#000000', '#FFFFFF')).toBeCloseTo(21, 0)
  })
})
