import { NextResponse } from "next/server"
import { ZodSchema } from "zod"

type ValidacionOk<T> = { success: true; data: T }
type ValidacionError = { success: false; response: NextResponse }

/**
 * Valida un body de request contra un schema Zod.
 * Devuelve los datos parseados o una respuesta de error 400.
 */
export function validarBody<T>(
  schema: ZodSchema<T>,
  body: unknown
): ValidacionOk<T> | ValidacionError {
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return {
      success: false,
      response: NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      ),
    }
  }
  return { success: true, data: parsed.data }
}
