import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const fontSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Kotaschool — Plateforme de Gestion Scolaire & Pédagogique',
  description: 'Système complet de gestion scolaire, saisie des notes, classement et génération des bulletins scolaires officiels.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={fontSans.variable}>
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased selection:bg-brand-500 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
