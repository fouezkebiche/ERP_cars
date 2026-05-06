import type React from "react";
import { Analytics } from "@vercel/analytics/next";
import "../globals.css";
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from "react-hot-toast";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';

const locales = ['en', 'fr', 'ar'];

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale)) notFound();
  const messages = await getMessages();
  const isRTL = locale === 'ar';

  return (
    <html lang={locale} dir={isRTL ? 'rtl' : 'ltr'} className="scroll-smooth">
      <head>
        {/* PWA / App Meta */}
        <meta name="application-name" content="CarManager" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CarManager" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0A0A0F" />

        {/* SEO */}
        <meta name="description" content="CarManager — The modern car rental management platform. Manage your fleet, contracts, clients and payments in one place." />
        <meta property="og:title" content="CarManager" />
        <meta property="og:description" content="The modern car rental management platform." />
        <meta property="og:type" content="website" />

        {/* Icons */}
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* Google Fonts — Syne (display) + DM Sans (body) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-background text-foreground overflow-x-hidden">
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            {children}
            <Toaster
              position={isRTL ? 'top-left' : 'top-right'}
              toastOptions={{
                style: {
                  background: '#1C1C27',
                  color: '#F0F0F5',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  fontSize: '14px',
                },
              }}
            />
          </AuthProvider>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}