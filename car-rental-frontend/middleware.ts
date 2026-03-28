import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'fr', 'ar'],
  defaultLocale: 'en',
  localePrefix: 'as-needed', // English = no prefix, /fr/..., /ar/...
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};