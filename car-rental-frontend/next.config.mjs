import withPWA from '@ducanh2912/next-pwa';

const nextConfig = {
  reactStrictMode: true,
  turbopack: {},
  
  // Disable caching in development
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  
  // Force no cache headers in development
  async headers() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'Cache-Control',
              value: 'no-store, no-cache, must-revalidate, max-age=0',
            },
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
  disable: process.env.NODE_ENV === 'development', // Disable PWA in dev
  cacheOnFrontEndNav: false, // Don't cache on navigation
  reloadOnOnline: true,
})(nextConfig);