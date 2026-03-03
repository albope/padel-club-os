import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { LOCALES_SOPORTADOS } from '@/i18n/request';

export async function POST(req: NextRequest) {
  const { locale } = await req.json();

  if (!LOCALES_SOPORTADOS.includes(locale)) {
    return NextResponse.json({ error: 'Locale no soportado' }, { status: 400 });
  }

  const store = await cookies();
  store.set('NEXT_LOCALE', locale, {
    path: '/',
    maxAge: 365 * 24 * 60 * 60,
    sameSite: 'lax',
  });

  return NextResponse.json({ locale });
}
