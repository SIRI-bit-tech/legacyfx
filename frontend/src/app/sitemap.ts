import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_DEPLOYMENT_URL ||
    process.env.VERCEL_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://primemeridianmarkets.com' : 'http://localhost:3000');
  
  const siteUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;

  const routes = [
    '',
    '/markets',
    '/trade',
    '/investments',
    '/real-estate',
    '/staking',
    '/mining',
    '/copy-trading',
    '/support',
    '/login',
    '/signup'
  ].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  return routes;
}
