# Entregabilidad de email (SPF / DKIM / DMARC)

Guía para que los emails transaccionales de Padel Club OS (bienvenidas, recuperación de
contraseña, confirmaciones de reserva, leads de demo, broadcasts) lleguen a la bandeja de
entrada y no a spam. Tiempo estimado: **15-20 minutos** + espera de propagación DNS.

## Estado actual en el código (verificado)

- Todos los envíos salen de `src/lib/email.ts` con un único remitente:
  `Padel Club OS <no-reply@padelclubos.com>` (constante `EMAIL_FROM`).
- Reply-to configurado donde tiene sentido:
  - Email de contacto y de solicitud de demo → reply-to al remitente del formulario.
  - Auto-respuesta de demo → reply-to `CONTACT_EMAIL` (fallback `contacto@padelclubos.com`).
  - Broadcasts de club → reply-to al email del club (si el club lo tiene configurado en Ajustes).
- `RESEND_API_KEY` vive solo en Vercel (no está en el `.env` local).

No hay remitentes fuera del dominio `padelclubos.com`, así que **basta con verificar un
único dominio en Resend**.

## Paso 1 — Añadir el dominio en Resend

1. Entra en [resend.com](https://resend.com) → **Domains** (menú lateral) → **Add Domain**.
2. Escribe `padelclubos.com` y elige la región (la que ya uses; si es la primera vez,
   `eu-west-1` (Irlanda) es la más cercana y mejor para RGPD).
3. Resend te mostrará una tabla con **3 registros DNS** que debes crear. No cierres esa
   pantalla: los valores (sobre todo la clave DKIM) son únicos para tu cuenta.

Los 3 registros que pide Resend son de este tipo (los valores exactos los da el dashboard):

| Tipo | Host/Nombre | Valor (ejemplo orientativo) | Para qué |
|------|-------------|------------------------------|----------|
| MX | `send` | `feedback-smtp.eu-west-1.amazonses.com` (prioridad 10) | Rebotes/feedback |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | **SPF** (autoriza a Resend a enviar por ti) |
| TXT | `resend._domainkey` | `p=MIGfMA0GCSq...` (clave larga) | **DKIM** (firma criptográfica) |

## Paso 2 — Pegar los registros en el DNS del dominio

Los registros se crean **donde estén gestionados los DNS de `padelclubos.com`**, que no
es necesariamente donde se compró el dominio:

- **Si los nameservers apuntan a Vercel** (lo habitual si el dominio se conectó desde el
  dashboard de Vercel): Vercel → proyecto → **Domains** → `padelclubos.com` → pestaña
  **DNS Records** → **Add Record**. Pega tipo, nombre y valor tal cual los da Resend.
- **Si los DNS están en el registrar** (DonDominio, Namecheap, GoDaddy, IONOS, OVH…):
  panel del registrar → zona DNS / "DNS avanzado" → añadir registro.

Detalles que suelen dar problemas:

- En el campo **Host/Nombre** casi todos los paneles esperan el valor **relativo**
  (`send`, `resend._domainkey`), no el FQDN completo. Si el panel añade
  `.padelclubos.com` automáticamente y escribes el nombre completo, acabarás con
  `send.padelclubos.com.padelclubos.com` (mal). Comprueba la vista previa.
- El valor DKIM es una sola cadena larga: pégala completa, sin saltos de línea.
- TTL: deja el que venga por defecto (o 1 hora).
- Para saber dónde están los DNS: `nslookup -type=NS padelclubos.com` (si responde
  `ns1.vercel-dns.com` → los registros van en Vercel).

## Paso 3 — Registro DMARC inicial

DMARC le dice a Gmail/Outlook qué hacer con emails que fallen SPF/DKIM y te manda
informes de quién está enviando con tu dominio. Crea este TXT adicional (este no lo pide
Resend, pero Gmail lo exige desde 2024 para senders con volumen y suma reputación):

| Tipo | Host/Nombre | Valor |
|------|-------------|-------|
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:albertobort@gmail.com; fo=1` |

- `p=none` = modo observación: no bloquea nada, solo recopila informes. Es el punto de
  partida correcto.
- `rua=` = buzón donde recibirás informes agregados (XML, ~1/día por proveedor). Puede
  ser `contacto@padelclubos.com` si prefieres separarlo.
- **Endurecer más adelante**: tras 2-4 semanas sin ver fallos legítimos en los informes,
  cambia a `p=quarantine` (los fraudulentos van a spam) y, cuando lleves tiempo estable,
  a `p=reject`. No empieces en quarantine/reject: un error de configuración tiraría
  emails legítimos.

## Paso 4 — Verificar en Resend

1. Vuelve a Resend → **Domains** → `padelclubos.com` → botón **Verify DNS Records**.
2. La propagación tarda de minutos a unas horas (raramente 24-48 h). Reintenta si falla.
3. Objetivo: estado **Verified** en los tres registros (SPF, DKIM, MX).

Mientras el dominio no esté verificado, Resend rechaza envíos desde
`no-reply@padelclubos.com` — este paso es bloqueante para producción.

## Paso 5 — Comprobar el resultado real

1. Entra en [mail-tester.com](https://www.mail-tester.com) y copia la dirección temporal
   que te da (tipo `test-abc123@srv1.mail-tester.com`).
2. Provoca un envío real de la app hacia esa dirección; lo más fácil:
   - Regístrate como jugador en un club de prueba con esa dirección (email de bienvenida), o
   - Usa "¿Olvidaste tu contraseña?" con una cuenta cuyo email cambies temporalmente a esa dirección.
3. Vuelve a mail-tester y pulsa "Ver resultado". **Objetivo: 9-10/10.**
   - SPF: debe decir "pass" (alineado con `send.padelclubos.com`).
   - DKIM: firma válida de `resend._domainkey`.
   - DMARC: registro encontrado.
   - Si baja de 9, lo habitual es DNS aún sin propagar o un registro con el host mal escrito.
4. Prueba extra recomendada: envíate un email a una cuenta Gmail real, ábrelo →
   menú ⋮ → **Mostrar original**: debe decir `SPF: PASS`, `DKIM: PASS`, `DMARC: PASS`.

## Checklist resumen para el dueño

- [ ] Resend → Domains → Add Domain `padelclubos.com` (región eu-west-1)
- [ ] Crear los 3 registros DNS que muestra Resend (MX `send`, TXT SPF `send`, TXT DKIM `resend._domainkey`)
- [ ] Crear TXT `_dmarc` con `v=DMARC1; p=none; rua=mailto:albertobort@gmail.com; fo=1`
- [ ] Resend → Verify DNS Records → estado **Verified**
- [ ] Test con mail-tester.com → nota ≥ 9/10
- [ ] Anotar recordatorio: en ~1 mes, revisar informes DMARC y subir a `p=quarantine`
