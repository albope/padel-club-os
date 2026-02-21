import {
  LayoutDashboard,
  Calendar,
  Trophy,
  Users,
  Fence,
  Settings,
  CalendarPlus,
  CreditCard,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Reservas', href: '/dashboard/reservas', icon: Calendar },
  { name: 'Pistas', href: '/dashboard/pistas', icon: Fence },
  { name: 'Competiciones', href: '/dashboard/competitions', icon: Trophy },
  { name: 'Socios', href: '/dashboard/socios', icon: Users },
  { name: 'Partidas Abiertas', href: '/dashboard/partidas-abiertas', icon: CalendarPlus },
  { name: 'Facturacion', href: '/dashboard/facturacion', icon: CreditCard },
  { name: 'Ajustes', href: '/dashboard/ajustes', icon: Settings },
];

export const mobileQuickNavItems: NavItem[] = [
  { name: 'Inicio', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Reservas', href: '/dashboard/reservas', icon: Calendar },
  { name: 'Socios', href: '/dashboard/socios', icon: Users },
  { name: 'Pistas', href: '/dashboard/pistas', icon: Fence },
];
