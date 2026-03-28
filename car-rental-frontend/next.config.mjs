import withPWA from '@ducanh2912/next-pwa';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig = {
  reactStrictMode: true,
  turbopack: {},
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  async headers() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/:path*',
          headers: [
            { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' },
          ],
        },
      ];
    }
    return [];
  },
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  cacheOnFrontEndNav: false,
  reloadOnOnline: true,
})(withNextIntl(nextConfig));