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
  { name: 'Pistas', href: '/dashboard/pistas', icon: LayoutGrid },
  { name: 'Competiciones', href: '/dashboard/competitions', icon: Trophy },
  { name: 'Socios', href: '/dashboard/socios', icon: Users },
  { name: 'Partidas Abiertas', href: '/dashboard/partidas-abiertas', icon: CalendarPlus },
  { name: 'Noticias', href: '/dashboard/noticias', icon: Newspaper },
  { name: 'Blog', href: '/dashboard/blog', icon: FileText },
  { name: 'Analiticas', href: '/dashboard/analiticas', icon: BarChart3 },
  { name: 'Facturacion', href: '/dashboard/facturacion', icon: CreditCard },
  { name: 'Ajustes', href: '/dashboard/ajustes', icon: Settings },
];

export const mobileQuickNavItems: NavItem[] = [
  { name: 'Inicio', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Reservas', href: '/dashboard/reservas', icon: Calendar },
  { name: 'Socios', href: '/dashboard/socios', icon: Users },
  { name: 'Pistas', href: '/dashboard/pistas', icon: LayoutGrid },
];
