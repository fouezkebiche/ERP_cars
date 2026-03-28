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
    <html lang={locale} dir={isRTL ? 'rtl' : 'ltr'}>
      <head>
        <meta name="application-name" content="CarManager" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CarManager" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10B981" />
      </head>
      <body className="font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            {children}
            <Toaster position={isRTL ? 'top-left' : 'top-right'} />
          </AuthProvider>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}