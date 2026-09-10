import { db } from './index.ts';
import { cafes, amenities, cafeAmenities, cafePhotos, cafeHours } from './schema.ts';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // 1. Seed Amenities
    const amenityData = [
      { name: 'FAST_WIFI', label: 'Fast Wi-Fi', icon: 'Wifi' },
      { name: 'PET_FRIENDLY', label: 'Pet Friendly', icon: 'Dog' },
      { name: 'OUTDOOR_SEATING', label: 'Outdoor Seating', icon: 'Sun' },
      { name: 'QUIET_ZONE', label: 'Quiet Zone', icon: 'VolumeX' },
      { name: 'SPECIALTY_COFFEE', label: 'Specialty Coffee', icon: 'Coffee' },
    ];

    await db.insert(amenities).ignore().values(amenityData);
    const insertedAmenities = await db.select().from(amenities);
    console.log(`✅ Seeded amenities`);

    // 2. Seed Cafes
    const cafeData = [
      {
        name: 'The Daily Grind',
        slug: 'the-daily-grind',
        description: 'A cozy corner for coffee lovers with the best beans in town.',
        shortDescription: 'Best beans in town',
        address: '123 Coffee St',
        city: 'Singapore',
        state: 'Singapore',
        country: 'Singapore',
        postalCode: '123456',
        latitude: '1.290270',
        longitude: '103.851959',
        priceRange: 2,
        featured: true,
      },
      {
        name: 'Brew & Bloom',
        slug: 'brew-and-bloom',
        description: 'Where floral scents meet aromatic espresso.',
        shortDescription: 'Floral scents & espresso',
        address: '456 Garden Ave',
        city: 'Singapore',
        state: 'Singapore',
        country: 'Singapore',
        postalCode: '654321',
        latitude: '1.352083',
        longitude: '103.819836',
        priceRange: 3,
        trending: true,
      },
    ];

    for (const cafe of cafeData) {
      await db.insert(cafes).ignore().values(cafe);
      const [insertedCafe] = await db.select().from(cafes).where(eq(cafes.slug, cafe.slug));
      
      if (insertedCafe) {
        console.log(`✅ Seeded cafe: ${insertedCafe.name}`);

        // Add some amenities to each cafe
        if (insertedAmenities.length > 0) {
          await db.insert(cafeAmenities).ignore().values([
            { cafeId: insertedCafe.id, amenityId: insertedAmenities[0].id },
            { cafeId: insertedCafe.id, amenityId: insertedAmenities[1].id },
          ]);
        }

        // Add photos
        await db.insert(cafePhotos).ignore().values([
          {
            url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=800',
            isCover: true,
            altText: `${insertedCafe.name} Interior`,
            cafeId: insertedCafe.id,
          }
        ]);

        // Add hours
        for (let i = 0; i < 7; i++) {
          await db.insert(cafeHours).ignore().values({
            dayOfWeek: i,
            openTime: '08:00',
            closeTime: '20:00',
            isClosed: false,
            cafeId: insertedCafe.id,
          });
        }
      }
    }

    console.log('✅ Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
