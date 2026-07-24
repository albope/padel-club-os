import { db } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import { canCreateMember } from "@/lib/subscription";
import { validarBody } from "@/lib/validation";
import { logger } from "@/lib/logger";
import { registrarAuditoria } from "@/lib/audit";
import * as z from "zod";
import { normalizarEmail } from "@/lib/identity";

const UserCreateSchema = z.object({
  email: z.string().email("Email no valido.").max(255, "El email no puede superar 255 caracteres."),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres.").max(100, "El nombre no puede superar 100 caracteres."),
  password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres.").max(128, "La contrasena no puede superar 128 caracteres."),
  phone: z.string().max(20, "El telefono no puede superar 20 caracteres.").optional().or(z.literal("")),
  position: z.string().max(50, "La posicion no puede superar 50 caracteres.").optional().or(z.literal("")),
  level: z.string().max(10, "El nivel no puede superar 10 caracteres.").optional().or(z.literal("")),
  birthDate: z.string().optional().or(z.literal("")).or(z.literal(null)),
})

// POST: Crear un nuevo socio
export async function POST(req: Request) {
  try {
    const auth = await requireAuth("users:create", { requireSubscription: true })
    if (isAuthError(auth)) return auth

    // Verificar limite de socios del plan
    const check = await canCreateMember(auth.session.user.clubId)
    if (!check.allowed) {
      return NextResponse.json(
        { error: check.reason, code: "PLAN_LIMIT_REACHED" },
        { status: 403 }
      )
    }

    const body = await req.json();
    const result = validarBody(UserCreateSchema, body);
    if (!result.success) return result.response;
    const { name, password, phone, position, level, birthDate } = result.data;
    const email = normalizarEmail(result.data.email);

    const existingUser = await db.user.findUnique({
      where: { email },
      include: {
        memberships: {
          where: { clubId: auth.session.user.clubId },
          select: { id: true },
        },
      },
    });
    if (existingUser?.memberships.length) {
      return new NextResponse("Este usuario ya pertenece al club", { status: 409 });
    }

    const hashedPassword = await hash(password, 10);

    const newUser = await db.$transaction(async (tx) => {
      const user = existingUser ?? await tx.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          phone,
          position,
          level,
          birthDate: birthDate ? new Date(birthDate) : null,
          clubId: auth.session.user.clubId,
          role: "PLAYER",
        },
      });

      await tx.clubMembership.create({
        data: {
          userId: user.id,
          clubId: auth.session.user.clubId,
          role: "PLAYER",
          status: "ACTIVE",
          approvedAt: new Date(),
          approvedById: auth.session.user.id,
        },
      });

      return user;
    });

    registrarAuditoria({
      recurso: "user",
      accion: "crear",
      entidadId: newUser.id,
      detalles: { email, rol: "PLAYER" },
      userId: auth.session.user.id,
      userName: auth.session.user.name,
      clubId: auth.session.user.clubId,
    })

    return NextResponse.json(
      {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        phone: newUser.phone,
        position: newUser.position,
        level: newUser.level,
        birthDate: newUser.birthDate,
        isActive: newUser.isActive,
        role: "PLAYER",
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error("CREATE_USER", "Error al crear socio", { ruta: "/api/users" }, error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
