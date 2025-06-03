import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { ThemeProvider } from '../components/theme-provider';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://collabx.app'),
  title: {
    default: 'CollabX - Real-time Collaborative Code Editor',
    template: '%s | CollabX'
  },
  description: 'CollabX is a powerful real-time collaborative code editor that enables seamless pair programming, code sharing, and team collaboration. Features include real-time editing, syntax highlighting, and instant synchronization.',
  keywords: [
    'collaborative editor',
    'online code editor',
    'code editor',
    'real-time collaboration',
    'pair programming',
    'code sharing',
    'online code editor',
    'team coding',
    'remote collaboration',
    'web development',
    'programming tools'
  ],
  authors: [{ name: 'CollabX Team' }],
  creator: 'CollabX',
  publisher: 'CollabX',
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'CollabX - Real-time Collaborative Code Editor',
    description: 'CollabX is a powerful real-time collaborative code editor that enables seamless pair programming, code sharing, and team collaboration. Features include real-time editing, syntax highlighting, and instant synchronization.',
    url: 'https://collabx.app',
    siteName: 'CollabX',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CollabX - Real-time Collaborative Code Editor',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CollabX - Real-time Collaborative Code Editor',
    description: 'CollabX is a powerful real-time collaborative code editor that enables seamless pair programming, code sharing, and team collaboration.',
    images: ['/og-image.png'],
    creator: '@collabx',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-site-verification',
  },
  category: 'Technology',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <Toaster position="bottom-right" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
