import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.PRISMA_DATABASE_URL,
    },
  },
});

async function seed() {
  console.log('🌱 Seeding database with Prisma...');

  try {
    // 1. Seed Amenities
    const amenities = [
      { name: 'FAST_WIFI', label: 'Fast Wi-Fi', icon: 'Wifi' },
      { name: 'PET_FRIENDLY', label: 'Pet Friendly', icon: 'Dog' },
      { name: 'OUTDOOR_SEATING', label: 'Outdoor Seating', icon: 'Sun' },
      { name: 'QUIET_ZONE', label: 'Quiet Zone', icon: 'VolumeX' },
      { name: 'SPECIALTY_COFFEE', label: 'Specialty Coffee', icon: 'Coffee' },
    ];

    for (const amenity of amenities) {
      await prisma.amenity.upsert({
        where: { name: amenity.name },
        update: {},
        create: amenity,
      });
    }
    const allAmenities = await prisma.amenity.findMany();
    console.log(`✅ Seeded amenities`);

    // 2. Seed Cafes
    const cafes = [
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
        latitude: 1.290270,
        longitude: 103.851959,
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
        latitude: 1.352083,
        longitude: 103.819836,
        priceRange: 3,
        trending: true,
      },
    ];

    for (const cafeData of cafes) {
      const cafe = await prisma.cafe.upsert({
        where: { slug: cafeData.slug },
        update: {},
        create: {
          ...cafeData,
          photos: {
            create: [
              {
                url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=800',
                isCover: true,
                altText: `${cafeData.name} Interior`,
              }
            ]
          },
          hours: {
            create: Array.from({ length: 7 }).map((_, i) => ({
              dayOfWeek: i,
              openTime: '08:00',
              closeTime: '20:00',
              isClosed: false,
            }))
          },
          amenities: {
            create: [
              { amenityId: allAmenities[0].id },
              { amenityId: allAmenities[1].id },
            ]
          }
        },
      });
      console.log(`✅ Seeded cafe: ${cafe.name}`);
    }

    console.log('✅ Seeding complete!');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

seed();
