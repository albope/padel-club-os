export function clasificarEstadoPreflight({ bookingSchema, publicTableCount }) {
  if (bookingSchema === "public") return "listo"
  if (bookingSchema) return "parcial"
  if (Number(publicTableCount) === 0) return "vacio"
  return "parcial"
}
