import { Router } from 'express';
import { prisma } from '../config/database.js';

const router = Router();

const PORT = Number(process.env.PORT) || 3000;
const APP_URL = process.env.CLIENT_URL || `http://localhost:${PORT}`;

router.get('/robots.txt', (req, res) => {
  const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /login
Disallow: /register
Disallow: /owner
Disallow: /profile
Disallow: /api

Sitemap: ${APP_URL}/sitemap.xml
`;
  res.header('Content-Type', 'text/plain');
  res.send(robots);
});

router.get('/sitemap.xml', async (req, res) => {
  try {
    const [cafes, posts, lists, events, specials] = await Promise.all([
      prisma.cafe.findMany({
        where: { status: 'PUBLISHED' },
        select: { slug: true, updatedAt: true }
      }),
      prisma.blogPost.findMany({
        where: { status: 'PUBLISHED' },
        select: { slug: true, updatedAt: true }
      }),
      prisma.curatedList.findMany({
        where: { status: 'PUBLISHED' },
        select: { slug: true, updatedAt: true }
      }),
      prisma.cafeEvent.findMany({ where: { status: 'PUBLISHED', endAt: { gte: new Date() }, cafe: { status: 'PUBLISHED' } }, select: { slug: true, updatedAt: true } }),
      prisma.cafeSpecial.findMany({ where: { status: 'PUBLISHED', endAt: { gte: new Date() }, cafe: { status: 'PUBLISHED' } }, select: { slug: true, updatedAt: true } })
    ]);

    const staticPages = [
      '',
      '/explore',
      '/blog',
      '/lists',
      '/events',
      '/specials',
      '/about',
      '/contact'
    ];

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Static Pages
    staticPages.forEach(page => {
      sitemap += `
  <url>
    <loc>${APP_URL}${page}</loc>
    <changefreq>daily</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`;
    });

    // Cafes
    cafes.forEach(cafe => {
      sitemap += `
  <url>
    <loc>${APP_URL}/cafes/${cafe.slug}</loc>
    <lastmod>${cafe.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    // Blog Posts
    posts.forEach(post => {
      sitemap += `
  <url>
    <loc>${APP_URL}/blog/${post.slug}</loc>
    <lastmod>${post.updatedAt.toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
    });

    // Curated Lists
    lists.forEach(list => {
      sitemap += `
  <url>
    <loc>${APP_URL}/lists/${list.slug}</loc>
    <lastmod>${list.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    });

    events.forEach(event => {
      sitemap += `
  <url>
    <loc>${APP_URL}/events/${event.slug}</loc>
    <lastmod>${event.updatedAt.toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    specials.forEach(special => {
      sitemap += `
  <url>
    <loc>${APP_URL}/specials/${special.slug}</loc>
    <lastmod>${special.updatedAt.toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    sitemap += '\n</urlset>';

    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

export default router;
