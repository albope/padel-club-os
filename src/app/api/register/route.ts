import { db } from "@/lib/db";
import { hash } from "bcrypt";
import { crearRateLimiter, obtenerIP } from "@/lib/rate-limit";
import { enviarEmailBienvenidaAdmin, enviarEmailVerificacion } from "@/lib/email";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import * as z from "zod";
import { LEGAL_VERSIONS } from "@/lib/legal-versions";
import { normalizarEmail } from "@/lib/identity";
import { crearTokenVerificacionEmail } from "@/lib/tokens";

const RegistroAdminSchema = z.object({
  email: z.string().email("Email no valido.").max(255),
  password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres.").max(128),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres.").max(100),
  clubName: z.string().min(2, "El nombre del club debe tener al menos 2 caracteres.").max(120),
  legalAccepted: z.literal(true, {
    errorMap: () => ({ message: "Debes aceptar las condiciones del servicio y el acuerdo de tratamiento de datos." }),
  }),
});

const limiter = crearRateLimiter({ maxRequests: 5, windowMs: 60 * 60 * 1000, prefix: "rl:register" });

// Genera un slug unico a partir de un nombre
async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  let slug = baseSlug;
  let counter = 1;

  while (await db.club.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

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
    const parsed = RegistroAdminSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { password, name, clubName } = parsed.data;
    const email = normalizarEmail(parsed.data.email);

    const existingUserByEmail = await db.user.findUnique({
      where: { email: email },
    });

    if (existingUserByEmail) {
      return NextResponse.json(
        { user: null, message: "Ya existe un usuario con este email." },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 10);
    const slug = await generateUniqueSlug(clubName);

    const { newUser, newClub } = await db.$transaction(async (prisma) => {
      const club = await prisma.club.create({
        data: {
          name: clubName,
          slug,
          subscriptionStatus: "trialing",
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 dias
          isPublished: false,
          registrationMode: "APPROVAL",
        },
      });

      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          clubId: club.id,
          role: "CLUB_ADMIN",
        },
      });

      await prisma.clubMembership.create({
        data: {
          userId: user.id,
          clubId: club.id,
          role: "CLUB_ADMIN",
          status: "ACTIVE",
          approvedAt: new Date(),
        },
      });

      await prisma.legalAcceptance.create({
        data: {
          audience: "CLUB",
          termsVersion: LEGAL_VERSIONS.terminos,
          dpaVersion: LEGAL_VERSIONS.dpa,
          privacyVersion: LEGAL_VERSIONS.privacidad,
          acceptedByEmail: email,
          acceptedByName: name,
          clubName,
          userId: user.id,
          clubId: club.id,
        },
      });

      return { newUser: user, newClub: club };
    });

    // Esperar los intentos para que el runtime serverless no los corte al
    // devolver la respuesta. El registro queda valido aunque Resend falle y
    // el usuario siempre puede solicitar un nuevo enlace.
    await Promise.allSettled([
      enviarEmailBienvenidaAdmin({
        email,
        nombre: name,
        clubNombre: clubName,
        clubSlug: slug,
        trialEndsAt: newClub.trialEndsAt!,
      }),
      crearTokenVerificacionEmail(email)
        .then((token) => enviarEmailVerificacion({
          email,
          nombre: name,
          token,
          next: "/login",
        })),
    ]).then((results) => {
      if (results[1]?.status === "rejected") {
        logger.error(
          "REGISTER_ADMIN_VERIFY",
          "No se pudo enviar la verificacion de email",
          { userId: newUser.id },
          results[1].reason,
        )
      }
    })

    const { password: newUserPassword, ...rest } = newUser;
    return NextResponse.json(
      { user: rest, message: "Cuenta creada. Revisa tu email para verificarla." },
      { status: 201 }
    );

  } catch (error) {
    logger.error("REGISTER_ADMIN", "Error en registro de administrador", { ruta: "/api/register" }, error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
