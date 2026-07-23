import {
  LayoutDashboard,
  Calendar,
  Trophy,
  Users,
  LayoutGrid,
  Settings,
  CalendarPlus,
  CreditCard,
  Newspaper,
  BarChart3,
  FileText,
  Medal,
  Megaphone,
  Repeat,
  ShieldBan,
  DatabaseZap,
  ScrollText,
  UserCog,
  Inbox,
  Building2,
  type LucideIcon,
} from 'lucide-react';
import type { Permission } from '@/lib/permissions';

/** Grupos de la sidebar «Marcador» (prototipo 3a del handoff) */
export type NavGroup =
  | 'operacion'
  | 'comunidad'
  | 'contenido'
  | 'negocio'
  | 'plataforma'
  | 'sistema';

export interface NavItem {
  nameKey: string;
  href: string;
  icon: LucideIcon;
  requiredPermission?: Permission;
  group: NavGroup;
}

export const navItems: NavItem[] = [
  { nameKey: 'nav.dashboard', href: '/dashboard', icon: LayoutDashboard, group: 'operacion' },
  { nameKey: 'nav.reservas', href: '/dashboard/reservas', icon: Calendar, group: 'operacion' },
  { nameKey: 'nav.clasesFijas', href: '/dashboard/reservas-recurrentes', icon: Repeat, group: 'operacion' },
  { nameKey: 'nav.bloqueos', href: '/dashboard/bloqueos', icon: ShieldBan, group: 'operacion' },
  { nameKey: 'nav.pistas', href: '/dashboard/pistas', icon: LayoutGrid, group: 'operacion' },
  { nameKey: 'nav.competiciones', href: '/dashboard/competitions', icon: Trophy, group: 'comunidad' },
  { nameKey: 'nav.rankings', href: '/dashboard/rankings', icon: Medal, group: 'comunidad' },
  { nameKey: 'nav.socios', href: '/dashboard/socios', icon: Users, group: 'comunidad' },
  { nameKey: 'nav.equipo', href: '/dashboard/equipo', icon: UserCog, requiredPermission: 'team:read', group: 'sistema' },
  { nameKey: 'nav.partidasAbiertas', href: '/dashboard/partidas-abiertas', icon: CalendarPlus, group: 'comunidad' },
  { nameKey: 'nav.noticias', href: '/dashboard/noticias', icon: Newspaper, group: 'contenido' },
  { nameKey: 'nav.comunicacion', href: '/dashboard/comunicacion', icon: Megaphone, group: 'contenido' },
  { nameKey: 'nav.blog', href: '/dashboard/blog', icon: FileText, requiredPermission: 'blog:read', group: 'contenido' },
  { nameKey: 'nav.leads', href: '/dashboard/leads', icon: Inbox, requiredPermission: 'leads:read', group: 'plataforma' },
  { nameKey: 'nav.clubs', href: '/dashboard/clubs', icon: Building2, requiredPermission: 'platform:read', group: 'plataforma' },
  { nameKey: 'nav.analiticas', href: '/dashboard/analiticas', icon: BarChart3, group: 'negocio' },
  { nameKey: 'nav.migracion', href: '/dashboard/migracion', icon: DatabaseZap, group: 'sistema' },
  { nameKey: 'nav.actividad', href: '/dashboard/audit-log', icon: ScrollText, requiredPermission: 'audit:read', group: 'sistema' },
  { nameKey: 'nav.facturacion', href: '/dashboard/facturacion', icon: CreditCard, group: 'negocio' },
  { nameKey: 'nav.ajustes', href: '/dashboard/ajustes', icon: Settings, group: 'sistema' },
];

export const mobileQuickNavItems: NavItem[] = [
  { nameKey: 'nav.inicio', href: '/dashboard', icon: LayoutDashboard, group: 'operacion' },
  { nameKey: 'nav.reservas', href: '/dashboard/reservas', icon: Calendar, group: 'operacion' },
  { nameKey: 'nav.socios', href: '/dashboard/socios', icon: Users, group: 'comunidad' },
  { nameKey: 'nav.pistas', href: '/dashboard/pistas', icon: LayoutGrid, group: 'operacion' },
];

/** Orden de grupos y de items dentro de cada grupo segun el prototipo 3a */
export const gruposNav: { key: NavGroup; labelKey: string }[] = [
  { key: 'operacion', labelKey: 'nav.grupoOperacion' },
  { key: 'comunidad', labelKey: 'nav.grupoComunidad' },
  { key: 'contenido', labelKey: 'nav.grupoContenido' },
  { key: 'negocio', labelKey: 'nav.grupoNegocio' },
  { key: 'plataforma', labelKey: 'nav.grupoPlataforma' },
  { key: 'sistema', labelKey: 'nav.grupoSistema' },
];

const ORDEN_MARCADOR = [
  '/dashboard',
  '/dashboard/reservas',
  '/dashboard/reservas-recurrentes',
  '/dashboard/bloqueos',
  '/dashboard/pistas',
  '/dashboard/socios',
  '/dashboard/partidas-abiertas',
  '/dashboard/competitions',
  '/dashboard/rankings',
  '/dashboard/noticias',
  '/dashboard/comunicacion',
  '/dashboard/blog',
  '/dashboard/analiticas',
  '/dashboard/facturacion',
  '/dashboard/leads',
  '/dashboard/clubs',
  '/dashboard/equipo',
  '/dashboard/migracion',
  '/dashboard/audit-log',
  '/dashboard/ajustes',
];

/** Agrupa items (ya filtrados por permiso) para la sidebar «Marcador» */
export function agruparNavItems(items: NavItem[]) {
  return gruposNav
    .map((grupo) => ({
      ...grupo,
      items: items
        .filter((item) => item.group === grupo.key)
        .sort((a, b) => ORDEN_MARCADOR.indexOf(a.href) - ORDEN_MARCADOR.indexOf(b.href)),
    }))
    .filter((grupo) => grupo.items.length > 0);
}
