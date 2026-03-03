'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { mobileQuickNavItems } from '@/lib/nav-items';
import { cn } from '@/lib/utils';

export function MobileNavBar() {
  const pathname = usePathname();
  const t = useTranslations();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <nav aria-label="Navegacion movil" className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex items-center justify-around h-16">
        {mobileQuickNavItems.map((item) => (
          <Link
            key={item.nameKey}
            href={item.href}
            aria-current={isActive(item.href) ? 'page' : undefined}
            className={cn(
              'flex flex-col items-center justify-center gap-1 px-3 py-2 text-xs font-medium transition-colors',
              isActive(item.href)
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{t(item.nameKey)}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
