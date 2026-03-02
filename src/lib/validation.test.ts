import { describe, it, expect } from "vitest"
import { z } from "zod"
import { validarBody } from "./validation"

const SchemaTest = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  email: z.string().email("Email invalido"),
  edad: z.number().min(0, "Edad debe ser positiva").optional(),
})

describe("validarBody", () => {
  it("retorna success:true con datos validos", () => {
    const result = validarBody(SchemaTest, {
      nombre: "Juan",
      email: "juan@test.com",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.nombre).toBe("Juan")
      expect(result.data.email).toBe("juan@test.com")
    }
  })

  it("retorna success:false con status 400 para datos invalidos", async () => {
    const result = validarBody(SchemaTest, { nombre: "", email: "no-email" })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.response.status).toBe(400)
    }
  })

  it("devuelve el primer mensaje de error de Zod", async () => {
    const result = validarBody(SchemaTest, { nombre: "" })
    expect(result.success).toBe(false)
    if (!result.success) {
      const body = await result.response.json()
      expect(body.error).toBe("Nombre requerido")
    }
  })

  it("maneja body null como error de validacion", () => {
    const result = validarBody(SchemaTest, null)
    expect(result.success).toBe(false)
  })

  it("maneja body undefined como error de validacion", () => {
    const result = validarBody(SchemaTest, undefined)
    expect(result.success).toBe(false)
  })

  it("aplica z.coerce correctamente", () => {
    const SchemaCoerce = z.object({
      precio: z.coerce.number(),
    })
    const result = validarBody(SchemaCoerce, { precio: "25.5" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.precio).toBe(25.5)
    }
  })

  it("valida schemas con .refine()", async () => {
    const SchemaRefine = z.object({
      password: z.string(),
      confirmPassword: z.string(),
    }).refine((data) => data.password === data.confirmPassword, {
      message: "Las contraseñas no coinciden",
    })

    const result = validarBody(SchemaRefine, {
      password: "abc123",
      confirmPassword: "xyz789",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const body = await result.response.json()
      expect(body.error).toBe("Las contraseñas no coinciden")
    }
  })

  it("ignora campos extra (strip por defecto)", () => {
    const result = validarBody(SchemaTest, {
      nombre: "Ana",
      email: "ana@test.com",
      campoExtra: "ignorado",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).not.toHaveProperty("campoExtra")
    }
  })
})
