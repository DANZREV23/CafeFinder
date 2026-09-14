import 'dotenv/config';
import { prisma } from '../config/database.js';
import { generateSlug } from '../utils/slug.js';
import { CafeStatus } from '@prisma/client';

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const SOLUTION_ID = 'gmp_mcp_codeassist_v1_aistudio';

async function scrapeCafes() {
  if (!API_KEY) {
    console.error('GOOGLE_MAPS_API_KEY is not set in .env');
    return;
  }

  const endpoint = 'https://places.googleapis.com/v1/places:searchText';
  const queries = [
    'cafes in Davao City, Philippines',
    'coffee shops in Davao City, Philippines',
    'specialty coffee Davao City'
  ];

  console.log('Starting scraper...');

  const seenIds = new Set<string>();

  for (const query of queries) {
    console.log(`Searching for: ${query}...`);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': API_KEY,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.types,places.websiteUri,places.nationalPhoneNumber,places.businessStatus,places.photos',
          'X-Goog-Maps-Solution-ID': SOLUTION_ID
        },
        body: JSON.stringify({
          textQuery: query,
          maxResultCount: 20
        })
      });

      const data = await response.json() as any;
      if (!data.places) {
        console.log(`No places found for query "${query}" or error:`, data);
        continue;
      }

      console.log(`Found ${data.places.length} places for query "${query}". Processing...`);

      for (const place of data.places) {
        if (seenIds.has(place.id)) continue;
        seenIds.add(place.id);

        const name = place.displayName.text;
        let slug = generateSlug(name);
        
        // Basic validation: ensure it's actually a cafe or food place
        const isCafe = place.types?.some((t: string) => 
          ['cafe', 'coffee_shop', 'bakery', 'restaurant', 'food', 'establishment'].includes(t)
        );
        
        if (!isCafe) {
          console.log(`Skipping ${name} - not a relevant type (${place.types?.join(', ')})`);
          continue;
        }

        try {
          // Check if exists by slug or name (handling duplicates)
          const existing = await prisma.cafe.findFirst({
            where: { 
              OR: [
                { slug },
                { name, city: 'Davao City' }
              ]
            }
          });

          if (existing) {
            console.log(`Updating existing cafe: ${name}...`);
            await prisma.cafe.update({
              where: { id: existing.id },
              data: {
                address: place.formattedAddress,
                latitude: place.location.latitude,
                longitude: place.location.longitude,
                phone: place.nationalPhoneNumber || existing.phone,
                website: place.websiteUri || existing.website,
                ratingAverage: place.rating || existing.ratingAverage,
                reviewCount: place.userRatingCount || existing.reviewCount
              }
            });
          } else {
            console.log(`Creating new cafe: ${name}...`);
            // Handle duplicate slugs by appending a random string if necessary
            let finalSlug = slug;
            const slugExists = await prisma.cafe.findUnique({ where: { slug: finalSlug } });
            if (slugExists) {
              finalSlug = `${slug}-${Math.random().toString(36).substring(2, 5)}`;
            }

            await prisma.cafe.create({
              data: {
                name,
                slug: finalSlug,
                address: place.formattedAddress,
                city: 'Davao City',
                state: 'Davao del Sur',
                country: 'Philippines',
                postalCode: '8000',
                latitude: place.location.latitude,
                longitude: place.location.longitude,
                phone: place.nationalPhoneNumber,
                website: place.websiteUri,
                ratingAverage: place.rating || 0,
                reviewCount: place.userRatingCount || 0,
                status: CafeStatus.PUBLISHED,
                verified: false,
                priceRange: 1 // Default
              }
            });
          }
        } catch (err) {
          console.error(`Failed to process ${name}:`, err);
        }
      }
    } catch (error) {
      console.error(`Error during query "${query}":`, error);
    }
  }

  console.log('Scraping and seeding process finished!');
  process.exit(0);
}

scrapeCafes();
