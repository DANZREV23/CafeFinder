import { PrismaClient } from '@prisma/client';

let databaseUrl = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;
if (databaseUrl?.startsWith('mariadb://') || databaseUrl?.startsWith('mariadbs://')) {
  databaseUrl = databaseUrl.replace(/^mariadb(s)?:\/\//, 'mysql://');
}

const prisma = new PrismaClient({
  datasources: databaseUrl ? {
    db: {
      url: databaseUrl,
    }
  } : undefined
});

async function main() {
  console.log('Seeding demo data...');

  // Create Amenities
  const amenitiesData = [
    { name: 'FAST_WIFI', label: 'Fast Wi-Fi' },
    { name: 'PET_FRIENDLY', label: 'Pet Friendly' },
    { name: 'OUTDOOR_SEATING', label: 'Outdoor Seating' },
    { name: 'POWER_OUTLETS', label: 'Power Outlets' },
    { name: 'AIR_CONDITIONING', label: 'Air Conditioning' },
    { name: 'PARKING', label: 'Parking' },
    { name: 'VEGAN_OPTIONS', label: 'Vegan Options' },
    { name: 'VEGETARIAN_OPTIONS', label: 'Vegetarian Options' },
    { name: 'ACCESSIBLE', label: 'Accessible' },
    { name: 'STUDY_FRIENDLY', label: 'Study Friendly' },
    { name: 'WORK_FRIENDLY', label: 'Work Friendly' },
    { name: 'QUIET', label: 'Quiet' },
    { name: 'LATE_NIGHT', label: 'Late Night' },
  ];

  const amenities = await Promise.all(
    amenitiesData.map((a) =>
      prisma.amenity.upsert({
        where: { name: a.name },
        update: {},
        create: a,
      })
    )
  );

  const cafes = [
    {
      name: 'The Daily Grind',
      slug: 'the-daily-grind',
      description: 'A cozy corner for your daily caffeine fix. Best for early birds and study sessions.',
      address: '123 Coffee Lane',
      city: 'Brewville',
      state: 'CA',
      country: 'USA',
      postalCode: '90210',
      latitude: 34.0522,
      longitude: -118.2437,
      priceRange: 2,
      ratingAverage: 4.5,
      reviewCount: 120,
      featured: true,
    },
    {
      name: 'Bean & Bloom',
      slug: 'bean-and-bloom',
      description: 'Where coffee meets nature. A lush, plant-filled sanctuary with specialty roasts.',
      address: '456 Garden St',
      city: 'Oakland',
      state: 'CA',
      country: 'USA',
      postalCode: '94601',
      latitude: 37.8044,
      longitude: -122.2712,
      priceRange: 3,
      ratingAverage: 4.8,
      reviewCount: 85,
      trending: true,
    },
    {
      name: 'Roast Republic',
      slug: 'roast-republic',
      description: 'The ultimate destination for coffee purists. We roast our own beans daily.',
      address: '789 Industrial Ave',
      city: 'Portland',
      state: 'OR',
      country: 'USA',
      postalCode: '97201',
      latitude: 45.5152,
      longitude: -122.6784,
      priceRange: 2,
      ratingAverage: 4.6,
      reviewCount: 210,
    },
    {
      name: 'Brew Theory',
      slug: 'brew-theory',
      description: 'Science-backed brewing methods for the perfect cup. Modern, minimalist, and precise.',
      address: '101 Tech Way',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      postalCode: '94105',
      latitude: 37.7749,
      longitude: -122.4194,
      priceRange: 4,
      ratingAverage: 4.9,
      reviewCount: 45,
    },
    {
      name: 'The Coffee Yard',
      slug: 'the-coffee-yard',
      description: 'Expansive outdoor seating and a relaxed vibe. Perfect for weekends with friends.',
      address: '202 Terrace Rd',
      city: 'Austin',
      state: 'TX',
      country: 'USA',
      postalCode: '78701',
      latitude: 30.2672,
      longitude: -97.7431,
      priceRange: 2,
      ratingAverage: 4.3,
      reviewCount: 155,
    },
    {
      name: 'Morning Ritual',
      slug: 'morning-ritual',
      description: 'Elevate your morning routine with artisan pastries and curated coffee blends.',
      address: '303 Sunrise Blvd',
      city: 'Seattle',
      state: 'WA',
      country: 'USA',
      postalCode: '98101',
      latitude: 47.6062,
      longitude: -122.3321,
      priceRange: 3,
      ratingAverage: 4.7,
      reviewCount: 92,
      featured: true,
    },
  ];

  for (const cafeData of cafes) {
    const cafe = await prisma.cafe.upsert({
      where: { slug: cafeData.slug },
      update: {},
      create: cafeData,
    });

    // Add some random amenities
    const randomAmenities = amenities
      .sort(() => 0.5 - Math.random())
      .slice(0, 5);

    for (const amenity of randomAmenities) {
      await prisma.cafeAmenity.upsert({
        where: {
          cafeId_amenityId: {
            cafeId: cafe.id,
            amenityId: amenity.id,
          },
        },
        update: {},
        create: {
          cafeId: cafe.id,
          amenityId: amenity.id,
        },
      });
    }

    // Add fake cover photo
    await prisma.cafePhoto.create({
      data: {
        cafeId: cafe.id,
        url: `https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80`,
        isCover: true,
        altText: cafe.name,
      },
    });

    // Add hours for each day
    for (let i = 0; i < 7; i++) {
      await prisma.cafeHours.upsert({
        where: {
          cafeId_dayOfWeek: {
            cafeId: cafe.id,
            dayOfWeek: i,
          },
        },
        update: {},
        create: {
          cafeId: cafe.id,
          dayOfWeek: i,
          openTime: '08:00',
          closeTime: '20:00',
          isClosed: i === 0, // Closed on Sundays for demo
        },
      });
    }
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
