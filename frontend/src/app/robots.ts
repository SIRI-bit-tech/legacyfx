import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_DEPLOYMENT_URL ||
    process.env.VERCEL_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://primemeridianmarkets.com' : 'http://localhost:3000');
  
  const siteUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/profile/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
