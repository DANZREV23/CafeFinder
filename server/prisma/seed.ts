import { PrismaClient, Role, UserStatus, CafeStatus, ReviewStatus, PostStatus } from '@prisma/client';
import { fileURLToPath } from 'url';
import path from 'path';

const getDatabaseUrl = () => {
  if (process.env.PRISMA_DATABASE_URL) return process.env.PRISMA_DATABASE_URL;
  
  // Try to construct from SQL_ variables (Cloud SQL)
  const user = process.env.SQL_ADMIN_USER || process.env.SQL_USER;
  const pass = process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD;
  const host = process.env.SQL_HOST;
  const db = process.env.SQL_DB_NAME;
  
  if (user && pass && host && db) {
    return `postgresql://${user}:${encodeURIComponent(pass)}@localhost/${db}?host=${host}`;
  }
  
  return process.env.DATABASE_URL;
};

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
});

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Clean existing data
  console.log('🧹 Cleaning database...');
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.curatedListCafe.deleteMany();
  await prisma.curatedList.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.cafeFavorite.deleteMany();
  await prisma.cafeOwnerClaim.deleteMany();
  await prisma.cafeReviewPhoto.deleteMany();
  await prisma.cafeReview.deleteMany();
  await prisma.cafePhoto.deleteMany();
  await prisma.cafeHours.deleteMany();
  await prisma.cafeAmenity.deleteMany();
  await prisma.amenity.deleteMany();
  await prisma.cafe.deleteMany();
  await prisma.user.deleteMany();

  // 2. Seed Users
  console.log('👤 Seeding users...');
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@cafefinder.local',
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
        avatarUrl: 'https://i.pravatar.cc/150?u=admin',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Cafe Owner',
        email: 'owner@cafefinder.local',
        role: Role.OWNER,
        status: UserStatus.ACTIVE,
        avatarUrl: 'https://i.pravatar.cc/150?u=owner',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Regular User',
        email: 'user@cafefinder.local',
        role: Role.USER,
        status: UserStatus.ACTIVE,
        avatarUrl: 'https://i.pravatar.cc/150?u=user',
      },
    }),
  ]);

  const [admin, owner, user] = users;

  // 3. Seed Amenities
  console.log('✨ Seeding amenities...');
  const amenitiesData = [
    { name: 'Fast Wi-Fi', slug: 'fast-wifi', icon: 'Wifi' },
    { name: 'Pet Friendly', slug: 'pet-friendly', icon: 'Dog' },
    { name: 'Outdoor Seating', slug: 'outdoor-seating', icon: 'Sun' },
    { name: 'Power Outlets', slug: 'power-outlets', icon: 'Zap' },
    { name: 'Air Conditioning', slug: 'air-conditioning', icon: 'Wind' },
    { name: 'Parking', slug: 'parking', icon: 'Car' },
    { name: 'Vegan Options', slug: 'vegan-options', icon: 'Leaf' },
    { name: 'Vegetarian Options', slug: 'vegetarian-options', icon: 'Salad' },
    { name: 'Accessible', slug: 'accessible', icon: 'Accessibility' },
    { name: 'Study Friendly', slug: 'study-friendly', icon: 'Book' },
    { name: 'Work Friendly', slug: 'work-friendly', icon: 'Briefcase' },
    { name: 'Quiet', slug: 'quiet', icon: 'VolumeX' },
    { name: 'Late Night', slug: 'late-night', icon: 'Moon' },
  ];

  const amenities = await Promise.all(
    amenitiesData.map((a) => prisma.amenity.create({ data: a }))
  );

  // 4. Seed Cafes
  console.log('☕ Seeding cafes...');
  const cafesData = [
    {
      name: 'The Daily Grind',
      slug: 'the-daily-grind',
      shortDescription: 'Industrial-chic spot with single-origin beans and artisanal pastries.',
      description: 'The Daily Grind is more than just a coffee shop. It is a community hub where tradition meets modern brewing techniques. Our beans are sourced directly from sustainable farms in Ethiopia and Colombia, roasted in small batches to ensure maximum flavor profile. Whether you are looking for a quick caffeine fix or a quiet corner to work, our spacious industrial-chic interior provides the perfect ambiance.',
      address: '123 Arab Street',
      city: 'Singapore',
      state: 'Singapore',
      country: 'Singapore',
      postalCode: '199702',
      latitude: 1.3005,
      longitude: 103.8587,
      phone: '+65 6123 4567',
      website: 'https://dailygrind.local',
      priceRange: 2,
      status: CafeStatus.PUBLISHED,
      verified: true,
      featured: true,
      trending: true,
      ratingAverage: 4.8,
      reviewCount: 124,
      ownerId: owner.id,
    },
    {
      name: 'Bean & Bloom',
      slug: 'bean-and-bloom',
      shortDescription: 'Floral-themed cafe serving specialty lattes and floral-infused teas.',
      description: 'A sanctuary in the heart of the city, Bean & Bloom combines a boutique florist with a specialty coffee bar. Surround yourself with seasonal blooms as you sip on our signature Lavender Latte or a perfectly balanced V60 pour-over. Our menu features locally sourced ingredients and a wide selection of vegan-friendly treats.',
      address: '456 Orchard Road',
      city: 'Singapore',
      state: 'Singapore',
      country: 'Singapore',
      postalCode: '238879',
      latitude: 1.3048,
      longitude: 103.8318,
      phone: '+65 6789 0123',
      priceRange: 3,
      status: CafeStatus.PUBLISHED,
      verified: true,
      featured: false,
      trending: true,
      ratingAverage: 4.5,
      reviewCount: 89,
    },
    {
      name: 'Roast Republic',
      slug: 'roast-republic',
      shortDescription: 'Micro-roastery focusing on the science of the perfect roast.',
      description: 'At Roast Republic, we take coffee seriously. Our laboratory-style setup allows us to monitor every variable in the roasting and brewing process. We host weekly cupping sessions for enthusiasts and serve some of the rarest micro-lots available in the region.',
      address: '789 Tiong Bahru Road',
      city: 'Singapore',
      state: 'Singapore',
      country: 'Singapore',
      postalCode: '168732',
      latitude: 1.2847,
      longitude: 103.8271,
      priceRange: 2,
      status: CafeStatus.PUBLISHED,
      verified: false,
      featured: true,
      trending: false,
      ratingAverage: 4.9,
      reviewCount: 215,
    },
  ];

  for (const cafeData of cafesData) {
    const cafe = await prisma.cafe.create({ data: cafeData });

    // Seed Photos
    await prisma.cafePhoto.create({
      data: {
        cafeId: cafe.id,
        url: `https://images.unsplash.com/photo-${cafe.slug === 'the-daily-grind' ? '1501339847302-ac426a4a7cbb' : '1554118811-1e0d58224f24'}?auto=format&fit=crop&q=80&w=1200`,
        isCover: true,
        altText: `${cafe.name} Interior`,
      },
    });

    // Seed Hours
    const days = [0, 1, 2, 3, 4, 5, 6];
    for (const day of days) {
      await prisma.cafeHours.create({
        data: {
          cafeId: cafe.id,
          dayOfWeek: day,
          openTime: '08:00',
          closeTime: '20:00',
          isClosed: day === 0, // Closed on Sundays for demo
        },
      });
    }

    // Seed Amenities
    const randomAmenities = amenities
      .sort(() => 0.5 - Math.random())
      .slice(0, 5);
    for (const amenity of randomAmenities) {
      await prisma.cafeAmenity.create({
        data: {
          cafeId: cafe.id,
          amenityId: amenity.id,
        },
      });
    }
  }

  // 5. Seed Testimonials
  console.log('💬 Seeding testimonials...');
  await prisma.testimonial.createMany({
    data: [
      {
        name: 'Sarah Jenkins',
        role: 'Digital Nomad',
        content: 'CafeFinder is my go-to app whenever I travel. Finding a spot with fast Wi-Fi and good coffee has never been easier.',
        rating: 5,
        avatarUrl: 'https://i.pravatar.cc/150?u=sarah',
      },
      {
        name: 'Marcus Tan',
        role: 'Coffee Enthusiast',
        content: 'The detailed reviews and amenity filters are game changers. I found some hidden gems in Tiong Bahru I never knew existed.',
        rating: 4,
        avatarUrl: 'https://i.pravatar.cc/150?u=marcus',
      },
    ],
  });

  // 6. Seed Blog Posts
  console.log('📰 Seeding blog posts...');
  await prisma.blogPost.create({
    data: {
      title: 'Top 5 Work-Friendly Cafes in Singapore',
      slug: 'top-5-work-friendly-cafes-singapore',
      excerpt: 'Struggling to find a productive space? We have curated the best spots with fast Wi-Fi and plenty of outlets.',
      content: 'Finding the perfect balance between a good latte and a reliable internet connection can be tricky. In this post, we explore five cafes that offer the ideal environment for deep work...',
      authorId: admin.id,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(),
      coverImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200',
    },
  });

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
