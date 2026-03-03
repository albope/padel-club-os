import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

export const LOCALES_SOPORTADOS = ['es', 'en'] as const;
export type Locale = (typeof LOCALES_SOPORTADOS)[number];
export const LOCALE_POR_DEFECTO: Locale = 'es';

function esLocaleValido(locale: string): locale is Locale {
  return (LOCALES_SOPORTADOS as readonly string[]).includes(locale);
}

export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get('NEXT_LOCALE')?.value;
  const locale: Locale = cookieLocale && esLocaleValido(cookieLocale) ? cookieLocale : LOCALE_POR_DEFECTO;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
