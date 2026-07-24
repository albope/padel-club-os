import { db } from "@/lib/db";
import { compare, hash } from "bcrypt";
import { crearRateLimiter, obtenerIP } from "@/lib/rate-limit";
import { enviarEmailBienvenidaJugador, enviarEmailVerificacion } from "@/lib/email";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { isSubscriptionActive, canCreateMember } from "@/lib/subscription";
import * as z from "zod";
import { normalizarEmail } from "@/lib/identity";
import { LEGAL_VERSIONS } from "@/lib/legal-versions";
import { crearTokenVerificacionEmail } from "@/lib/tokens";

const RegistroJugadorSchema = z.object({
  email: z.string().email("Email no valido.").max(255),
  password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres.").max(128),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres.").max(100),
  phone: z.string().max(20).optional().or(z.literal("")),
  slug: z.string().min(1, "Slug del club requerido.").max(100),
  privacyAccepted: z.literal(true, {
    errorMap: () => ({ message: "Debes aceptar la politica de privacidad para registrarte." }),
  }),
});

const limiter = crearRateLimiter({ maxRequests: 5, windowMs: 60 * 60 * 1000, prefix: "rl:register-player" });

// POST: Registro de jugador en un club especifico (requiere slug valido)
export async function POST(req: Request) {
  try {
    const ip = obtenerIP(req);
    if (!(await limiter.verificar(ip))) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intentalo de nuevo mas tarde." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = RegistroJugadorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { password, name, phone, slug } = parsed.data;
    const email = normalizarEmail(parsed.data.email);

    // Verificar que el club existe
    const club = await db.club.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        registrationMode: true,
        isPublished: true,
      },
    });
    if (!club) {
      return NextResponse.json(
        { error: "Club no encontrado." },
        { status: 404 }
      );
    }

    if (!club.isPublished) {
      return NextResponse.json({ error: "El portal de este club aun no esta publicado." }, { status: 403 });
    }

    if (club.registrationMode === "CLOSED" || club.registrationMode === "INVITE_ONLY") {
      return NextResponse.json(
        { error: "El registro de este club es solo por invitacion. Contacta con el club." },
        { status: 403 },
      );
    }

    // Verificar que la suscripcion del club esta activa
    if (!isSubscriptionActive(club.subscriptionStatus, club.trialEndsAt)) {
      return NextResponse.json(
        { error: "Este club no tiene una suscripcion activa. Contacta con el administrador del club." },
        { status: 403 }
      );
    }

    // Verificar limite de socios del plan
    const check = await canCreateMember(club.id)
    if (!check.allowed) {
      return NextResponse.json(
        { error: "Este club ha alcanzado el limite de socios de su plan. Contacta con el administrador del club." },
        { status: 403 }
      );
    }

    const existingUser = await db.user.findUnique({
      where: { email },
      include: {
        memberships: {
          where: { clubId: club.id },
          select: { id: true, status: true },
        },
      },
    });

    if (existingUser?.memberships.length) {
      return NextResponse.json(
        { error: "Ya tienes una cuenta o solicitud en este club." },
        { status: 409 }
      );
    }

    if (existingUser?.password) {
      const passwordMatch = await compare(password, existingUser.password);
      if (!passwordMatch) {
        return NextResponse.json(
          { error: "No se pudo vincular la cuenta. Comprueba tus credenciales." },
          { status: 401 },
        );
      }
    }

    const membershipStatus = club.registrationMode === "OPEN" ? "ACTIVE" : "PENDING";
    const hashedPassword = existingUser ? null : await hash(password, 10);

    const { user, membership } = await db.$transaction(async (tx) => {
      const user = existingUser ?? await tx.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          phone: phone || null,
          clubId: membershipStatus === "ACTIVE" ? club.id : null,
          role: "PLAYER",
        },
      });

      const membership = await tx.clubMembership.create({
        data: {
          userId: user.id,
          clubId: club.id,
          role: "PLAYER",
          status: membershipStatus,
          approvedAt: membershipStatus === "ACTIVE" ? new Date() : null,
        },
      });

      await tx.legalAcceptance.create({
        data: {
          audience: "PLAYER",
          termsVersion: LEGAL_VERSIONS.terminos,
          privacyVersion: LEGAL_VERSIONS.privacidad,
          acceptedByEmail: email,
          acceptedByName: name,
          clubName: club.name,
          userId: user.id,
          clubId: club.id,
        },
      });

      return { user, membership };
    });

    const emailTasks: Promise<unknown>[] = []
    if (membership.status === "ACTIVE") {
      emailTasks.push(enviarEmailBienvenidaJugador({
        email,
        nombre: name,
        clubNombre: club.name,
        clubSlug: slug,
      }))
    }
    if (!existingUser?.emailVerified) {
      emailTasks.push(crearTokenVerificacionEmail(email)
        .then((token) => enviarEmailVerificacion({
          email,
          nombre: name,
          token,
          next: `/club/${slug}/login`,
        })))
    }
    const emailResults = await Promise.allSettled(emailTasks)
    for (const result of emailResults) {
      if (result.status === "rejected") {
        logger.error(
          "REGISTER_PLAYER_EMAIL",
          "No se pudo completar un email de registro",
          { userId: user.id, clubId: club.id },
          result.reason,
        )
      }
    }

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(
      {
        user: userWithoutPassword,
        membershipStatus: membership.status,
        message: membership.status === "ACTIVE"
          ? "Registro completado. Revisa tu email para verificar la cuenta antes de entrar."
          : "Solicitud enviada. Verifica tu email; el club tambien debe aprobar tu acceso.",
      },
      { status: membership.status === "ACTIVE" ? 201 : 202 }
    );
  } catch (error) {
    logger.error("REGISTER_PLAYER", "Error en registro de jugador", { ruta: "/api/register/player" }, error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
