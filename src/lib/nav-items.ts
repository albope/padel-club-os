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
  type LucideIcon,
} from 'lucide-react';
import type { Permission } from '@/lib/permissions';

export interface NavItem {
  nameKey: string;
  href: string;
  icon: LucideIcon;
  requiredPermission?: Permission;
}

export const navItems: NavItem[] = [
  { nameKey: 'nav.dashboard', href: '/dashboard', icon: LayoutDashboard },
  { nameKey: 'nav.reservas', href: '/dashboard/reservas', icon: Calendar },
  { nameKey: 'nav.clasesFijas', href: '/dashboard/reservas-recurrentes', icon: Repeat },
  { nameKey: 'nav.bloqueos', href: '/dashboard/bloqueos', icon: ShieldBan },
  { nameKey: 'nav.pistas', href: '/dashboard/pistas', icon: LayoutGrid },
  { nameKey: 'nav.competiciones', href: '/dashboard/competitions', icon: Trophy },
  { nameKey: 'nav.rankings', href: '/dashboard/rankings', icon: Medal },
  { nameKey: 'nav.socios', href: '/dashboard/socios', icon: Users },
  { nameKey: 'nav.equipo', href: '/dashboard/equipo', icon: UserCog, requiredPermission: 'team:read' },
  { nameKey: 'nav.partidasAbiertas', href: '/dashboard/partidas-abiertas', icon: CalendarPlus },
  { nameKey: 'nav.noticias', href: '/dashboard/noticias', icon: Newspaper },
  { nameKey: 'nav.comunicacion', href: '/dashboard/comunicacion', icon: Megaphone },
  { nameKey: 'nav.blog', href: '/dashboard/blog', icon: FileText },
  { nameKey: 'nav.analiticas', href: '/dashboard/analiticas', icon: BarChart3 },
  { nameKey: 'nav.migracion', href: '/dashboard/migracion', icon: DatabaseZap },
  { nameKey: 'nav.actividad', href: '/dashboard/audit-log', icon: ScrollText, requiredPermission: 'audit:read' },
  { nameKey: 'nav.facturacion', href: '/dashboard/facturacion', icon: CreditCard },
  { nameKey: 'nav.ajustes', href: '/dashboard/ajustes', icon: Settings },
];

export const mobileQuickNavItems: NavItem[] = [
  { nameKey: 'nav.inicio', href: '/dashboard', icon: LayoutDashboard },
  { nameKey: 'nav.reservas', href: '/dashboard/reservas', icon: Calendar },
  { nameKey: 'nav.socios', href: '/dashboard/socios', icon: Users },
  { nameKey: 'nav.pistas', href: '/dashboard/pistas', icon: LayoutGrid },
];
