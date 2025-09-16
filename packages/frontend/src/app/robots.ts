import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://kodecollab.com';
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/_next/static/',
        '/favicon.ico',
        '*.woff2',
        '*.woff',
        '*.ttf',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
} 