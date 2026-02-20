import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  // Por ahora locale fijo en espanol
  // En el futuro se puede leer de una cookie o del header Accept-Language
  const locale = 'es';

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
