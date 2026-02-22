import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Franja {
  nombre: string;
  horario: string;
  precio: number;
}

// Agrupa pricings contiguos con el mismo precio en franjas legibles
function agruparEnFranjas(
  pricings: { dayOfWeek: number; startHour: number; endHour: number; price: number }[]
): { entresSemana: Franja[]; finDeSemana: Franja[] } {
  // Separar entre semana (L-V: 1-5) y fin de semana (S-D: 0,6)
  const entreSemana = pricings.filter((p) => p.dayOfWeek >= 1 && p.dayOfWeek <= 5);
  const finSemana = pricings.filter((p) => p.dayOfWeek === 0 || p.dayOfWeek === 6);

  return {
    entresSemana: extraerFranjas(entreSemana),
    finDeSemana: extraerFranjas(finSemana),
  };
}

function extraerFranjas(
  pricings: { startHour: number; endHour: number; price: number }[]
): Franja[] {
  if (pricings.length === 0) return [];

  // Obtener precios unicos por hora (tomar el precio mas comun por hora)
  const preciosPorHora = new Map<number, number>();
  for (const p of pricings) {
    for (let h = p.startHour; h < p.endHour; h++) {
      preciosPorHora.set(h, p.price);
    }
  }

  if (preciosPorHora.size === 0) return [];

  // Agrupar horas consecutivas con el mismo precio
  const horas = Array.from(preciosPorHora.entries()).sort((a, b) => a[0] - b[0]);
  const franjas: Franja[] = [];

  let inicioGrupo = horas[0][0];
  let precioGrupo = horas[0][1];

  for (let i = 1; i <= horas.length; i++) {
    const esUltimo = i === horas.length;
    const cambio = esUltimo || horas[i][1] !== precioGrupo || horas[i][0] !== horas[i - 1][0] + 1;

    if (cambio) {
      const finGrupo = horas[i - 1][0] + 1; // endHour (exclusive)
      franjas.push({
        nombre: nombreFranja(inicioGrupo, finGrupo),
        horario: `${String(inicioGrupo).padStart(2, '0')}:00 a ${String(finGrupo).padStart(2, '0')}:00`,
        precio: precioGrupo,
      });

      if (!esUltimo) {
        inicioGrupo = horas[i][0];
        precioGrupo = horas[i][1];
      }
    }
  }

  return franjas;
}

function nombreFranja(startHour: number, endHour: number): string {
  if (startHour < 14 && endHour <= 14) return 'Mañanas';
  if (startHour < 17 && endHour <= 17) return 'Mediodía';
  if (startHour >= 17) return 'Tardes-Noche';
  if (startHour < 14 && endHour > 14 && endHour <= 17) return 'Mañanas y Mediodía';
  if (startHour < 17 && endHour > 17) return 'Día completo';
  return `${String(startHour).padStart(2, '0')}:00 - ${String(endHour).padStart(2, '0')}:00`;
}

export default async function TarifasPage({ params }: { params: { slug: string } }) {
  const club = await db.club.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      name: true,
      primaryColor: true,
      bookingDuration: true,
      courts: {
        select: {
          id: true,
          name: true,
          type: true,
          pricings: {
            orderBy: [{ dayOfWeek: 'asc' }, { startHour: 'asc' }],
          },
        },
        orderBy: { name: 'asc' },
      },
    },
  });

  if (!club) notFound();

  const color = club.primaryColor || '#4f46e5';
  const duracion = club.bookingDuration || 90;

  // Verificar si todas las pistas tienen los mismos precios
  const todasIguales = club.courts.length > 1 && club.courts.every((pista) => {
    const primera = club.courts[0].pricings;
    if (pista.pricings.length !== primera.length) return false;
    return pista.pricings.every((p, i) => (
      p.dayOfWeek === primera[i].dayOfWeek &&
      p.startHour === primera[i].startHour &&
      p.endHour === primera[i].endHour &&
      p.price === primera[i].price
    ));
  });

  // Si todas son iguales, mostrar solo una vez
  const pistasAMostrar = todasIguales
    ? [{ ...club.courts[0], name: 'Todas las pistas', type: '', esGlobal: true }]
    : club.courts.map((p) => ({ ...p, esGlobal: false }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tarifas</h1>
        <p className="text-muted-foreground">
          Precios por reserva de {duracion} minutos
        </p>
      </div>

      {pistasAMostrar.map((pista) => {
        const { entresSemana, finDeSemana } = agruparEnFranjas(pista.pricings);
        const tienePrecio = entresSemana.length > 0 || finDeSemana.length > 0;

        return (
          <div key={pista.id} className="space-y-4">
            {!pista.esGlobal && (
              <h2 className="text-lg font-semibold flex items-center gap-2">
                {pista.name}
                {pista.type && <Badge variant="secondary">{pista.type}</Badge>}
              </h2>
            )}

            {!tienePrecio ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Consultar precios en recepcion.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Entre semana */}
                {entresSemana.length > 0 && (
                  <div className="space-y-3">
                    <div
                      className="rounded-lg px-4 py-2.5 text-white font-semibold text-sm"
                      style={{ backgroundColor: color }}
                    >
                      De lunes a viernes
                    </div>
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {entresSemana.map((franja, i) => (
                        <Card key={i} className="overflow-hidden">
                          <CardContent className="p-0">
                            <div className="px-4 py-3 bg-muted/50 border-b">
                              <p className="text-sm font-medium text-muted-foreground">
                                {franja.nombre}
                              </p>
                              <p className="text-xs text-muted-foreground/70">
                                {franja.horario}
                              </p>
                            </div>
                            <div className="px-4 py-4 flex items-baseline gap-1">
                              <span className="text-3xl font-bold tracking-tight">
                                {franja.precio % 1 === 0
                                  ? franja.precio.toFixed(0)
                                  : franja.precio.toFixed(2)}
                              </span>
                              <span className="text-lg text-muted-foreground">€</span>
                              <span className="text-sm text-muted-foreground ml-1">
                                / pista
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fin de semana */}
                {finDeSemana.length > 0 && (
                  <div className="space-y-3">
                    <div
                      className="rounded-lg px-4 py-2.5 text-white font-semibold text-sm"
                      style={{ backgroundColor: color, opacity: 0.85 }}
                    >
                      Sabados, domingos y festivos
                    </div>
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {finDeSemana.map((franja, i) => (
                        <Card key={i} className="overflow-hidden">
                          <CardContent className="p-0">
                            <div className="px-4 py-3 bg-muted/50 border-b">
                              <p className="text-sm font-medium text-muted-foreground">
                                {franja.nombre}
                              </p>
                              <p className="text-xs text-muted-foreground/70">
                                {franja.horario}
                              </p>
                            </div>
                            <div className="px-4 py-4 flex items-baseline gap-1">
                              <span className="text-3xl font-bold tracking-tight">
                                {franja.precio % 1 === 0
                                  ? franja.precio.toFixed(0)
                                  : franja.precio.toFixed(2)}
                              </span>
                              <span className="text-lg text-muted-foreground">€</span>
                              <span className="text-sm text-muted-foreground ml-1">
                                / pista
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {club.courts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No hay pistas configuradas.
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Reserva de {duracion} minutos. Precios sujetos a cambios.
      </p>
    </div>
  );
}
