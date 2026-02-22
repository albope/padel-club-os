import { UserRole } from "@prisma/client"

// Acciones que se pueden realizar en el sistema
export type Permission =
  // Reservas
  | "bookings:read"
  | "bookings:create"
  | "bookings:create-any"   // crear reserva para cualquier usuario
  | "bookings:update"
  | "bookings:delete"
  // Pistas
  | "courts:read"
  | "courts:create"
  | "courts:update"
  | "courts:delete"
  // Socios
  | "users:read"
  | "users:create"
  | "users:update"
  | "users:delete"
  | "users:import"
  // Competiciones
  | "competitions:read"
  | "competitions:create"
  | "competitions:update"
  | "competitions:delete"
  // Partidas abiertas
  | "open-matches:read"
  | "open-matches:create"
  | "open-matches:join"
  | "open-matches:update"
  | "open-matches:delete"
  // Ajustes del club
  | "settings:read"
  | "settings:update"
  // Noticias
  | "news:read"
  | "news:create"
  | "news:update"
  | "news:delete"
  // Facturacion / Pagos
  | "billing:read"
  | "billing:update"
  // Precios de pistas
  | "court-pricing:read"
  | "court-pricing:update"
  // Analiticas
  | "analytics:read"
  // Blog (plataforma)
  | "blog:read"
  | "blog:create"
  | "blog:update"
  | "blog:delete"
  // Perfil propio
  | "profile:read"
  | "profile:update"

// Permisos por rol
const rolePermissions: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    "bookings:read", "bookings:create", "bookings:create-any", "bookings:update", "bookings:delete",
    "courts:read", "courts:create", "courts:update", "courts:delete",
    "users:read", "users:create", "users:update", "users:delete", "users:import",
    "competitions:read", "competitions:create", "competitions:update", "competitions:delete",
    "open-matches:read", "open-matches:create", "open-matches:join", "open-matches:update", "open-matches:delete",
    "settings:read", "settings:update",
    "news:read", "news:create", "news:update", "news:delete",
    "billing:read", "billing:update",
    "court-pricing:read", "court-pricing:update",
    "analytics:read",
    "blog:read", "blog:create", "blog:update", "blog:delete",
    "profile:read", "profile:update",
  ],
  CLUB_ADMIN: [
    "bookings:read", "bookings:create", "bookings:create-any", "bookings:update", "bookings:delete",
    "courts:read", "courts:create", "courts:update", "courts:delete",
    "users:read", "users:create", "users:update", "users:delete", "users:import",
    "competitions:read", "competitions:create", "competitions:update", "competitions:delete",
    "open-matches:read", "open-matches:create", "open-matches:join", "open-matches:update", "open-matches:delete",
    "settings:read", "settings:update",
    "news:read", "news:create", "news:update", "news:delete",
    "billing:read", "billing:update",
    "court-pricing:read", "court-pricing:update",
    "analytics:read",
    "blog:read", "blog:create", "blog:update", "blog:delete",
    "profile:read", "profile:update",
  ],
  STAFF: [
    "bookings:read", "bookings:create", "bookings:create-any", "bookings:update", "bookings:delete",
    "courts:read", "courts:create", "courts:update", "courts:delete",
    "users:read",
    "competitions:read", "competitions:create", "competitions:update", "competitions:delete",
    "open-matches:read", "open-matches:create", "open-matches:join", "open-matches:update", "open-matches:delete",
    "news:read",
    "court-pricing:read",
    "profile:read", "profile:update",
  ],
  PLAYER: [
    "bookings:read", "bookings:create",
    "courts:read",
    "competitions:read",
    "open-matches:read", "open-matches:create", "open-matches:join",
    "profile:read", "profile:update",
  ],
}

/** Comprueba si un rol tiene un permiso */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false
}

/** Comprueba si un rol tiene al menos uno de los permisos */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p))
}

/** Roles que pueden acceder al dashboard de admin */
export const ADMIN_ROLES: UserRole[] = ["SUPER_ADMIN", "CLUB_ADMIN", "STAFF"]

/** Roles que son solo jugadores (portal publico) */
export const PLAYER_ROLES: UserRole[] = ["PLAYER"]
