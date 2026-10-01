import { PrismaClient, Role, UserStatus, CafeStatus, ReviewStatus, PostStatus, TestimonialStatus } from '@prisma/client';
import { fileURLToPath } from 'url';
import path from 'path';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { startLocalPostgresServer, stopLocalPostgresServer } from '../src/config/localDbServer.js';

dotenv.config();

async function main() {
  console.log('🌱 Starting seed...');

  // Ensure local DB is running if needed
  const databaseUrl = process.env.PRISMA_DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5442/cloud_sql_development_database?sslmode=disable&statement_cache_size=0';
  process.env.PRISMA_DATABASE_URL = databaseUrl;
  console.log(`[Seed]: Using database URL: ${databaseUrl.replace(/:[^@:]+@/, ':****@')}`);

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  try {
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
  const passwordHash = await bcrypt.hash('password123', 12);
  
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@cafefinder.local',
        passwordHash,
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
        avatarUrl: 'https://i.pravatar.cc/150?u=admin',
      },
    }),
    prisma.user.create({
      data: {
        name: 'System Administrator',
        email: 'revero.b@agentsofvalue.com',
        passwordHash,
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
        avatarUrl: 'https://i.pravatar.cc/150?u=revero',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Cafe Owner',
        email: 'owner@cafefinder.local',
        passwordHash,
        role: Role.OWNER,
        status: UserStatus.ACTIVE,
        avatarUrl: 'https://i.pravatar.cc/150?u=owner',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Regular User',
        email: 'user@cafefinder.local',
        passwordHash,
        role: Role.USER,
        status: UserStatus.ACTIVE,
        avatarUrl: 'https://i.pravatar.cc/150?u=user',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Maria Santos',
        email: 'maria@example.com',
        passwordHash,
        role: Role.USER,
        status: UserStatus.ACTIVE,
        avatarUrl: 'https://i.pravatar.cc/150?u=maria',
      },
    }),
    prisma.user.create({
      data: {
        name: 'John Rivera',
        email: 'john@example.com',
        passwordHash,
        role: Role.USER,
        status: UserStatus.ACTIVE,
        avatarUrl: 'https://i.pravatar.cc/150?u=john',
      },
    }),
  ]);

  const [admin, owner, user, maria, john] = users;

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
      name: 'Green Coffee - Marfori',
      slug: 'green-coffee-marfori',
      shortDescription: 'Cozy and trendy spot known for its late hours and great Wi-Fi.',
      description: 'Green Coffee in Marfori Heights is a favorite among students and professionals for its relaxing atmosphere and consistent coffee quality. It offers a wide range of beverages and pastries in a cozy, industrial-inspired setting.',
      address: 'Ruby corner Turquoise Street, Marfori Heights',
      city: 'Davao City',
      state: 'Davao del Sur',
      country: 'Philippines',
      postalCode: '8000',
      latitude: 7.0863,
      longitude: 125.6083,
      phone: '+63 82 123 4567',
      website: 'https://thegreencoffee.com',
      priceRange: 2,
      status: CafeStatus.PUBLISHED,
      verified: true,
      featured: true,
      trending: true,
      ratingAverage: 4.5,
      reviewCount: 156,
      ownerId: owner.id,
    },
    {
      name: 'Fourth Street Cafe',
      slug: 'fourth-street-cafe',
      shortDescription: 'Minimalist white-and-wood aesthetic cafe with locally roasted specialty coffee.',
      description: 'Fourth Street Cafe is a serene haven in the city, offering high-quality local roasts. Its minimalist design and quiet atmosphere make it perfect for deep work or intimate conversations. It is pet-friendly and known for its excellent V60 pour-overs.',
      address: 'Narra St, Poblacion District',
      city: 'Davao City',
      state: 'Davao del Sur',
      country: 'Philippines',
      postalCode: '8000',
      latitude: 7.0741421,
      longitude: 125.6169814,
      phone: '+63 82 234 5678',
      priceRange: 2,
      status: CafeStatus.PUBLISHED,
      verified: true,
      featured: true,
      trending: false,
      ratingAverage: 4.8,
      reviewCount: 92,
    },
    {
      name: 'Purge Coffee Roasters',
      slug: 'purge-coffee-roasters',
      shortDescription: 'Award-winning roastery and specialty coffee shop in Matina.',
      description: 'Purge Coffee Roasters is dedicated to the craft of coffee. They roast their own beans and offer a variety of single-origin options. The space is professional and quiet, ideal for those who take their coffee and their work seriously.',
      address: 'Tulip Drive, Matina',
      city: 'Davao City',
      state: 'Davao del Sur',
      country: 'Philippines',
      postalCode: '8000',
      latitude: 7.0544,
      longitude: 125.5898,
      phone: '+63 82 345 6789',
      priceRange: 3,
      status: CafeStatus.PUBLISHED,
      verified: true,
      featured: false,
      trending: true,
      ratingAverage: 4.7,
      reviewCount: 110,
    },
    {
      name: 'Glasshouse Coffee - Oboza',
      slug: 'glasshouse-coffee-oboza',
      shortDescription: 'A literal glass box set in a lush heritage garden.',
      description: 'Located in the garden of the historic Oboza Heritage House, Glasshouse Coffee offers a unique aesthetic experience. It serves local beans from Mount Apo in a peaceful, nature-filled environment.',
      address: '143 Rizal St, Poblacion District',
      city: 'Davao City',
      state: 'Davao del Sur',
      country: 'Philippines',
      postalCode: '8000',
      latitude: 7.0700,
      longitude: 125.6080,
      priceRange: 2,
      status: CafeStatus.PUBLISHED,
      verified: true,
      featured: true,
      trending: true,
      ratingAverage: 4.6,
      reviewCount: 75,
    },
    {
      name: 'Stash Coffee Co.',
      slug: 'stash-coffee-co',
      shortDescription: 'Specialty coffee nook with a professional environment and great Wi-Fi.',
      description: 'Stash Coffee Co. provides a clean, well-lit space for coffee lovers and remote workers. Located on the second floor, it offers private nooks and a quiet atmosphere for focus.',
      address: 'Iñigo and Porras St, Poblacion District',
      city: 'Davao City',
      state: 'Davao del Sur',
      country: 'Philippines',
      postalCode: '8000',
      latitude: 7.0805,
      longitude: 125.6087,
      priceRange: 2,
      status: CafeStatus.PUBLISHED,
      verified: false,
      featured: false,
      trending: true,
      ratingAverage: 4.4,
      reviewCount: 64,
    },
    {
      name: 'Cafe Demitasse',
      slug: 'cafe-demitasse',
      shortDescription: 'Spacious and accessible cafe perfect for meetings and hangouts.',
      description: 'Cafe Demitasse is a well-known spot in Davao for its wide menu, ranging from coffee and cakes to full meals. It is spacious, air-conditioned, and has reliable Wi-Fi, making it a go-to for business meetings.',
      address: '727 F. Torres St, Poblacion District',
      city: 'Davao City',
      state: 'Davao del Sur',
      country: 'Philippines',
      postalCode: '8000',
      latitude: 7.0772834,
      longitude: 125.6052335,
      priceRange: 2,
      status: CafeStatus.PUBLISHED,
      verified: true,
      featured: false,
      trending: false,
      ratingAverage: 4.3,
      reviewCount: 203,
    },
    {
      name: 'Paramount Coffee - Riverfront',
      slug: 'paramount-coffee-riverfront',
      shortDescription: 'Mindanao single-origin roastery with a view of the Davao River.',
      description: 'Paramount Coffee showcases the best of Mindanao coffee. Their Riverfront branch offers a spacious, library-style setting with beautiful views of the river, perfect for a peaceful afternoon.',
      address: 'Riverfront Corporate City, Diversion Road, Ma-a',
      city: 'Davao City',
      state: 'Davao del Sur',
      country: 'Philippines',
      postalCode: '8000',
      latitude: 7.0543,
      longitude: 125.5898,
      priceRange: 3,
      status: CafeStatus.PUBLISHED,
      verified: true,
      featured: true,
      trending: false,
      ratingAverage: 4.7,
      reviewCount: 88,
    },
    {
      name: 'Espresso Lab Cafe',
      slug: 'espresso-lab-cafe',
      shortDescription: 'Modern hotel cafe with stable Wi-Fi and comfortable work spaces.',
      description: 'Located in The Lanang Suites, Espresso Lab Cafe is a modern space designed for productivity. With fast Wi-Fi and plenty of power outlets, it is a top choice for digital nomads in Davao.',
      address: 'The Lanang Suites, J.P. Laurel Ave',
      city: 'Davao City',
      state: 'Davao del Sur',
      country: 'Philippines',
      postalCode: '8000',
      latitude: 7.0946,
      longitude: 125.6321,
      priceRange: 2,
      status: CafeStatus.PUBLISHED,
      verified: true,
      featured: false,
      trending: true,
      ratingAverage: 4.5,
      reviewCount: 112,
    },
    {
      name: 'Blugré Coffee - MTS',
      slug: 'blugre-coffee-mts',
      shortDescription: 'Iconic Davao cafe famous for its signature Durian Coffee Blend.',
      description: 'Blugré Coffee is a Davao institution. Their branch at Matina Town Square is a popular hangout spot, offering a unique taste of Davao through their world-famous Durian Coffee.',
      address: 'Matina Town Square, Matina',
      city: 'Davao City',
      state: 'Davao del Sur',
      country: 'Philippines',
      postalCode: '8000',
      latitude: 7.0601,
      longitude: 125.5684,
      priceRange: 2,
      status: CafeStatus.PUBLISHED,
      verified: true,
      featured: true,
      trending: true,
      ratingAverage: 4.2,
      reviewCount: 345,
    },
    {
      name: 'Café Chalet',
      slug: 'cafe-chalet',
      shortDescription: 'Elegant French-American inspired cafe in Ecoland.',
      description: 'Café Chalet offers an elegant dining and coffee experience with Parisian-inspired pastries and brunch. The interiors are clean and well-lit, providing a sophisticated atmosphere for guests.',
      address: 'Ecoland Subd Phase 1',
      city: 'Davao City',
      state: 'Davao del Sur',
      country: 'Philippines',
      postalCode: '8000',
      latitude: 7.0519,
      longitude: 125.5901,
      priceRange: 3,
      status: CafeStatus.PUBLISHED,
      verified: false,
      featured: false,
      trending: true,
      ratingAverage: 4.6,
      reviewCount: 54,
    },
    {
      name: 'Aloha Kakou Neighborhood Cafe',
      slug: 'aloha-kakou',
      shortDescription: 'Hawaiian-themed cafe serving unique delights and Filipino favorites.',
      description: 'Aloha Kakou brings the spirit of Hawaii to Davao. With tropical decor and a menu featuring Hawaiian treats, it provides a refreshing escape for coffee lovers.',
      address: 'Quimpo Blvd, Talomo',
      city: 'Davao City',
      state: 'Davao del Sur',
      country: 'Philippines',
      postalCode: '8000',
      latitude: 7.0543,
      longitude: 125.5843,
      priceRange: 2,
      status: CafeStatus.PUBLISHED,
      verified: true,
      featured: false,
      trending: false,
      ratingAverage: 4.4,
      reviewCount: 78,
    },
    {
      name: 'Balay Davao',
      slug: 'balay-davao',
      shortDescription: 'Homey cafe with local roasts and a warm, open-air feel.',
      description: 'Balay Davao is a charming spot that feels like home. It serves excellent pour-over coffee using local beans and offers a hearty local breakfast in a relaxed setting.',
      address: '20E Teodoro Palma Gil St',
      city: 'Davao City',
      state: 'Davao del Sur',
      country: 'Philippines',
      postalCode: '8000',
      latitude: 7.0782,
      longitude: 125.6067,
      priceRange: 2,
      status: CafeStatus.PUBLISHED,
      verified: false,
      featured: true,
      trending: false,
      ratingAverage: 4.7,
      reviewCount: 42,
    },
    {
      name: 'Keepsakes Cafe - Mayon',
      slug: 'keepsakes-cafe-mayon',
      shortDescription: 'Popular local cafe known for its consistent quality and chill vibes.',
      description: 'Keepsakes Cafe is a staple in the Davao coffee scene, offering a reliable place for coffee and food. Its Mayon branch is well-loved for its friendly staff and cozy atmosphere.',
      address: 'Mount Mayon St, Poblacion',
      city: 'Davao City',
      state: 'Davao del Sur',
      country: 'Philippines',
      postalCode: '8000',
      latitude: 7.0805,
      longitude: 125.6087,
      priceRange: 2,
      status: CafeStatus.PUBLISHED,
      verified: true,
      featured: false,
      trending: false,
      ratingAverage: 4.3,
      reviewCount: 128,
    },
    {
      name: 'Kapeweñoz - V. Mapa',
      slug: 'kapewenoz-v-mapa',
      shortDescription: 'Specialty coffee shop known for its bold and consistent brews.',
      description: 'Kapeweñoz is dedicated to providing high-quality specialty coffee. Their V. Mapa branch is a favorite for those who appreciate a strong, well-crafted cup of coffee.',
      address: 'V. Mapa St, Davao City',
      city: 'Davao City',
      state: 'Davao del Sur',
      country: 'Philippines',
      postalCode: '8000',
      latitude: 7.0740,
      longitude: 125.6100,
      priceRange: 1,
      status: CafeStatus.PUBLISHED,
      verified: false,
      featured: false,
      trending: true,
      ratingAverage: 4.6,
      reviewCount: 67,
    },
    {
      name: 'Overdose Coffee',
      slug: 'overdose-coffee',
      shortDescription: 'Chill cafe on Bonifacio St with a focus on good coffee and food.',
      description: 'Overdose Coffee offers a relaxed environment for coffee enthusiasts. Located along Bonifacio Street, it is a great place to unwind with a good book or catch up with friends.',
      address: 'Bonifacio St, Davao City',
      city: 'Davao City',
      state: 'Davao del Sur',
      country: 'Philippines',
      postalCode: '8000',
      latitude: 7.0700,
      longitude: 125.6080,
      priceRange: 2,
      status: CafeStatus.PUBLISHED,
      verified: false,
      featured: false,
      trending: false,
      ratingAverage: 4.4,
      reviewCount: 45,
    },
    {
      name: 'Psalms Coffee + Pastry',
      slug: 'psalms-coffee-pastry',
      shortDescription: 'Cozy pastry shop and cafe perfect for unwinding.',
      description: 'Psalms Coffee + Pastry is known for its warm lighting, relaxing music, and delicious baked goods. It provides a sanctuary for those looking to escape the hustle and bustle of the city.',
      address: 'Davao City',
      city: 'Davao City',
      state: 'Davao del Sur',
      country: 'Philippines',
      postalCode: '8000',
      latitude: 7.0730,
      longitude: 125.6120,
      priceRange: 2,
      status: CafeStatus.PUBLISHED,
      verified: false,
      featured: false,
      trending: true,
      ratingAverage: 4.5,
      reviewCount: 38,
    },
    {
      name: 'Darkk Coffee',
      slug: 'darkk-coffee',
      shortDescription: 'Small, nostalgic nook using manual espresso makers for artisanal coffee.',
      description: 'Darkk Coffee is a hidden gem that focuses on the art of coffee. Using manual espresso makers, they craft each cup with care, offering a nostalgic and artisanal experience.',
      address: 'Davao City',
      city: 'Davao City',
      state: 'Davao del Sur',
      country: 'Philippines',
      postalCode: '8000',
      latitude: 7.0750,
      longitude: 125.6150,
      priceRange: 2,
      status: CafeStatus.PUBLISHED,
      verified: false,
      featured: false,
      trending: false,
      ratingAverage: 4.8,
      reviewCount: 29,
    },
    {
      name: 'Caffeñero',
      slug: 'caffenero',
      shortDescription: 'Chill vibes and good food in the heart of the city.',
      description: 'Caffeñero is a must-try for its great coffee and relaxed atmosphere. It offers a variety of food options that complement its high-quality coffee perfectly.',
      address: 'Poblacion District, Davao City',
      city: 'Davao City',
      state: 'Davao del Sur',
      country: 'Philippines',
      postalCode: '8000',
      latitude: 7.0720,
      longitude: 125.6110,
      priceRange: 2,
      status: CafeStatus.PUBLISHED,
      verified: false,
      featured: false,
      trending: true,
      ratingAverage: 4.3,
      reviewCount: 52,
    },
    {
      name: 'Miss Bridgette',
      slug: 'miss-bridgette',
      shortDescription: 'Charming cafe on Tulip Drive with chill vibes and good eats.',
      description: 'Miss Bridgette offers a cozy space for coffee and brunch. Located along Tulip Drive, it is a popular spot for its friendly atmosphere and delicious menu.',
      address: 'Tulip Drive, Matina',
      city: 'Davao City',
      state: 'Davao del Sur',
      country: 'Philippines',
      postalCode: '8000',
      latitude: 7.0544,
      longitude: 125.5898,
      priceRange: 2,
      status: CafeStatus.PUBLISHED,
      verified: false,
      featured: false,
      trending: false,
      ratingAverage: 4.4,
      reviewCount: 41,
    },
    {
      name: 'Olo Coffee and Concepts',
      slug: 'olo-coffee-concepts',
      shortDescription: 'Modern coffee shop focusing on quality concepts and brews.',
      description: 'Olo Coffee and Concepts is a forward-thinking cafe that emphasizes quality in both its coffee and its design. It is a great place to discover new coffee concepts in Davao.',
      address: 'Davao City',
      city: 'Davao City',
      state: 'Davao del Sur',
      country: 'Philippines',
      postalCode: '8000',
      latitude: 7.0710,
      longitude: 125.6090,
      priceRange: 3,
      status: CafeStatus.PUBLISHED,
      verified: false,
      featured: false,
      trending: true,
      ratingAverage: 4.5,
      reviewCount: 33,
    },
  ];

  const createdCafes = [];
  for (const cafeData of cafesData) {
    const cafe = await prisma.cafe.create({ data: cafeData });
    createdCafes.push(cafe);

    // Seed Photos
    await prisma.cafePhoto.create({
      data: {
        cafeId: cafe.id,
        url: `https://images.unsplash.com/photo-${cafe.slug === 'green-coffee-marfori' ? '1501339847302-ac426a4a7cbb' : '1554118811-1e0d58224f24'}?auto=format&fit=crop&q=80&w=1200`,
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

  // 4b. Seed owner claim scenarios
  await prisma.cafe.update({ where: { id: createdCafes[0].id }, data: { ownerId: owner.id } });
  const demoCafeId = createdCafes[0].id;
  const demoNow = new Date();
  const hours = (value: number) => new Date(demoNow.getTime() + value * 60 * 60 * 1000);
  await prisma.cafeEvent.createMany({ data: [
    { cafeId: demoCafeId, createdById: owner.id, title: 'Demo Latte Art Workshop', slug: 'demo-latte-art-workshop', shortDescription: 'A fictional practice session for the CafeFinder demo.', description: 'Development-only event data. No registration or real-world event is being advertised.', eventType: 'WORKSHOP', status: 'PUBLISHED', startAt: hours(72), endAt: hours(75), timezone: 'Asia/Manila', allDay: false, location: 'Demo tasting room', publishedAt: demoNow },
    { cafeId: demoCafeId, createdById: owner.id, title: 'Demo Coffee Tasting Review Queue', slug: 'demo-coffee-tasting-pending', description: 'Fictional pending event used to exercise moderation.', eventType: 'TASTING', status: 'PENDING_REVIEW', startAt: hours(120), endAt: hours(122), timezone: 'Asia/Manila' },
    { cafeId: demoCafeId, createdById: owner.id, title: 'Demo Past Brewing Class', slug: 'demo-past-brewing-class', description: 'Fictional historical event used to test expiry handling.', eventType: 'CLASS', status: 'EXPIRED', startAt: hours(-96), endAt: hours(-94), timezone: 'Asia/Manila' },
    { cafeId: demoCafeId, createdById: owner.id, title: 'Demo Rejected Event', slug: 'demo-rejected-event', description: 'Fictional rejected content for moderation testing.', eventType: 'OTHER', status: 'REJECTED', startAt: hours(144), endAt: hours(146), timezone: 'Asia/Manila' },
    { cafeId: demoCafeId, createdById: owner.id, title: 'Demo Cancelled Meetup', slug: 'demo-cancelled-meetup', description: 'Fictional cancelled content for lifecycle testing.', eventType: 'COMMUNITY', status: 'CANCELLED', startAt: hours(168), endAt: hours(170), timezone: 'Asia/Manila' }
  ] });
  await prisma.cafeSpecial.createMany({ data: [
    { cafeId: demoCafeId, createdById: owner.id, title: 'Demo Seasonal Latte', slug: 'demo-seasonal-latte', shortDescription: 'A fictional seasonal special for local development.', description: 'Development-only data. This offer has no real redemption value.', specialType: 'SEASONAL', status: 'PUBLISHED', startAt: hours(-24), endAt: hours(240), timezone: 'Asia/Manila', terms: 'Demo data only.', publishedAt: demoNow },
    { cafeId: demoCafeId, createdById: owner.id, title: 'Demo Opening Week Bundle', slug: 'demo-opening-week-bundle', description: 'Fictional future seasonal promotion for discovery testing.', specialType: 'LIMITED_TIME', status: 'PUBLISHED', startAt: hours(48), endAt: hours(240), timezone: 'Asia/Manila', discountPercent: 10, publishedAt: demoNow },
    { cafeId: demoCafeId, createdById: owner.id, title: 'Demo Pending Student Offer', slug: 'demo-pending-student-offer', description: 'Fictional special in the admin review queue.', specialType: 'STUDENT', status: 'PENDING_REVIEW', startAt: hours(24), endAt: hours(144), timezone: 'Asia/Manila' }
  ] });
  await prisma.cafeAnnouncement.create({ data: {
    cafeId: demoCafeId,
    createdById: owner.id,
    title: 'Demo Holiday Hours Notice',
    slug: 'demo-holiday-hours-notice',
    content: 'Fictional notice used only for development and demonstration.',
    type: 'HOLIDAY_HOURS',
    priority: 'IMPORTANT',
    status: 'PUBLISHED',
    startAt: hours(-1),
    endAt: hours(72),
    timezone: 'Asia/Manila',
    publishedAt: demoNow
  } });
  await prisma.cafeOwnerClaim.create({
    data: {
      cafeId: createdCafes[0].id,
      userId: owner.id,
      businessName: 'Cafe Owner Demo',
      contactName: 'Cafe Owner',
      contactEmail: owner.email,
      message: 'Approved demo ownership claim.',
      status: 'APPROVED',
      reviewedById: admin.id,
      reviewedAt: new Date(),
    },
  });
  await prisma.cafeOwnerClaim.create({
    data: {
      cafeId: createdCafes[1].id,
      userId: user.id,
      businessName: 'Community Coffee Demo',
      contactName: 'Regular User',
      contactEmail: user.email,
      message: 'Pending demo ownership claim for admin review.',
      status: 'PENDING',
    },
  });
  await prisma.cafeOwnerClaim.create({
    data: {
      cafeId: createdCafes[2].id,
      userId: maria.id,
      businessName: 'Rejected Demo Cafe',
      contactName: 'Maria Santos',
      contactEmail: maria.email,
      message: 'Rejected demo claim retained for history.',
      status: 'REJECTED',
      rejectionReason: 'Please provide additional authorization details.',
      reviewedById: admin.id,
      reviewedAt: new Date(),
    },
  });

  // 5. Seed Reviews
  console.log('⭐ Seeding reviews...');
  const reviews = [
    {
      cafeId: createdCafes[0].id,
      userId: user.id,
      coffeeRating: 5,
      ambianceRating: 4,
      serviceRating: 5,
      overallRating: 5,
      comment: 'Excellent coffee, friendly service, and a comfortable place to spend time. Perfect for working!',
      status: ReviewStatus.APPROVED,
    },
    {
      cafeId: createdCafes[0].id,
      userId: maria.id,
      coffeeRating: 4,
      ambianceRating: 5,
      serviceRating: 4,
      overallRating: 4,
      comment: 'Love the industrial vibe here. The pastries are also great!',
      status: ReviewStatus.APPROVED,
    },
    {
      cafeId: createdCafes[1].id,
      userId: john.id,
      coffeeRating: 5,
      ambianceRating: 5,
      serviceRating: 5,
      overallRating: 5,
      comment: 'Best specialty coffee in Davao! The minimalist design is so calming.',
      status: ReviewStatus.APPROVED,
    },
    {
      cafeId: createdCafes[1].id,
      userId: maria.id,
      coffeeRating: 4,
      ambianceRating: 4,
      serviceRating: 4,
      overallRating: 4,
      comment: 'Very quiet and peaceful. Good for reading a book.',
      status: ReviewStatus.PENDING,
    },
  ];

  for (const reviewData of reviews) {
    await prisma.cafeReview.create({ data: reviewData });
  }

  // Recalculate Cafe Ratings
  console.log('📊 Recalculating cafe ratings...');
  for (const cafe of createdCafes) {
    const approvedReviews = await prisma.cafeReview.findMany({
      where: { cafeId: cafe.id, status: ReviewStatus.APPROVED },
    });

    if (approvedReviews.length > 0) {
      const avg = approvedReviews.reduce((acc, r) => acc + r.overallRating, 0) / approvedReviews.length;
      await prisma.cafe.update({
        where: { id: cafe.id },
        data: {
          ratingAverage: avg,
          reviewCount: approvedReviews.length,
        },
      });
    }
  }

  // 6. Seed Testimonials
  console.log('💬 Seeding testimonials...');
  await prisma.testimonial.createMany({
    data: [
      {
        name: 'Sarah Jenkins',
        role: 'Digital Nomad',
        content: 'CafeFinder is my go-to app whenever I travel. Finding a spot with fast Wi-Fi and good coffee has never been easier.',
        rating: 5,
        avatarUrl: 'https://i.pravatar.cc/150?u=sarah',
        status: TestimonialStatus.PUBLISHED,
      },
      {
        name: 'Marcus Tan',
        role: 'Coffee Enthusiast',
        content: 'The detailed reviews and amenity filters are game changers. I found some hidden gems in Tiong Bahru I never knew existed.',
        rating: 5,
        avatarUrl: 'https://i.pravatar.cc/150?u=marcus',
        status: TestimonialStatus.PUBLISHED,
      },
      {
        name: 'Elena Rodriguez',
        role: 'Freelance Writer',
        content: 'I love how I can filter by "vibe". Sometimes I need a quiet library atmosphere, other times a lively social spot. This app gets it.',
        rating: 4,
        avatarUrl: 'https://i.pravatar.cc/150?u=elena',
        status: TestimonialStatus.PUBLISHED,
      },
    ],
  });

  // 6. Seed Blog Posts
  console.log('📰 Seeding blog posts...');
  await prisma.blogPost.createMany({
    data: [
      {
        title: 'Top 5 Work-Friendly Cafes in Davao City',
        slug: 'top-5-work-friendly-cafes-davao',
        excerpt: 'Struggling to find a productive space in Davao? We have curated the best spots with fast Wi-Fi and plenty of outlets.',
        content: 'Finding the perfect balance between a good latte and a reliable internet connection can be tricky. In Davao, the coffee scene is thriving with spaces that cater to digital nomads and students alike. In this post, we explore five cafes that offer the ideal environment for deep work, from the modern Espresso Lab to the cozy Green Coffee...',
        authorId: admin.id,
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(),
        coverImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200',
      },
      {
        title: 'Davao Specialty Coffee: From Mt. Apo to Your Cup',
        slug: 'davao-specialty-coffee-guide',
        excerpt: 'Discover the unique flavors of coffee grown on the slopes of Mt. Apo, the highest peak in the Philippines.',
        content: 'Mindanao is home to some of the best coffee beans in the world, specifically those harvested from the fertile soils of Mt. Apo. Local roasters like Purge Coffee and Paramount are leading the charge in showcasing these unique single-origin profiles...',
        authorId: admin.id,
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(Date.now() - 86400000), // 1 day ago
        coverImage: 'https://images.unsplash.com/photo-1544787210-282bb218999b?auto=format&fit=crop&q=80&w=1200',
      },
      {
        title: 'Hidden Garden Cafes in the Heart of Davao',
        slug: 'hidden-garden-cafes-davao',
        excerpt: 'Escape the city hustle and discover these green sanctuaries tucked away in the city center.',
        content: 'Sometimes you just need to get away from the noise without leaving the city. Davao has some incredible garden cafes that offer a breath of fresh air, like the stunning Glasshouse at Oboza Heritage House...',
        authorId: admin.id,
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(Date.now() - 172800000), // 2 days ago
        coverImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=1200',
      },
    ]
  });

  // 7. Seed Curated Lists
  console.log('📚 Seeding curated lists...');
  const allCafes = await prisma.cafe.findMany();
  
  const list1 = await prisma.curatedList.create({
    data: {
      title: 'Davao Digital Nomad Favorites',
      slug: 'davao-digital-nomad-favorites',
      description: 'The best spots in Davao for deep work, fast Wi-Fi, and endless refills.',
      coverImage: 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&q=80&w=1200',
      featured: true,
    }
  });

  const list2 = await prisma.curatedList.create({
    data: {
      title: 'Aesthetic Weekend Brunch in Davao',
      slug: 'aesthetic-weekend-brunch-davao',
      description: 'Instagram-worthy interiors paired with exceptional Davao coffee and food.',
      coverImage: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=1200',
      featured: true,
    }
  });

  const list3 = await prisma.curatedList.create({
    data: {
      title: 'Mindanao Specialty Coffee Guide',
      slug: 'mindanao-specialty-coffee-guide',
      description: 'For the serious enthusiasts: where to find the rarest Mindanao roasts and best techniques.',
      coverImage: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=1200',
      featured: true,
    }
  });

  // Link cafes to lists
  for (const list of [list1, list2, list3]) {
    const randomCafes = allCafes
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    
    for (let i = 0; i < randomCafes.length; i++) {
      await prisma.curatedListCafe.create({
        data: {
          listId: list.id,
          cafeId: randomCafes[i].id,
          sortOrder: i,
        }
      });
    }
  }

  // 8. Seed Sample Menu for Green Coffee
  console.log('📖 Seeding sample menu...');
  const firstCafe = createdCafes[0];
  const sampleMenu = await prisma.menu.create({
    data: {
      cafeId: firstCafe.id,
      name: 'Main Menu',
      description: 'Our full selection of specialty coffee and food.',
      isActive: true,
      categories: {
        create: [
          {
            name: 'Specialty Coffee',
            sortOrder: 0,
            items: {
              create: [
                {
                  name: 'Signature Latte',
                  description: 'Creamy espresso with our secret house syrup.',
                  price: 180.00,
                  sortOrder: 0,
                  tags: { create: [{ name: 'Popular' }, { name: 'Signature' }] }
                },
                {
                  name: 'Flat White',
                  description: 'Double shot of espresso with silky micro-foam.',
                  price: 160.00,
                  sortOrder: 1
                },
                {
                  name: 'V60 Pour Over',
                  description: 'Hand-brewed single-origin beans from Mt. Apo.',
                  price: 200.00,
                  sortOrder: 2,
                  tags: { create: [{ name: 'Specialty' }] }
                }
              ]
            }
          },
          {
            name: 'All-Day Breakfast',
            sortOrder: 1,
            items: {
              create: [
                {
                  name: 'Avocado Toast',
                  description: 'Smashed avocado on sourdough with poached egg.',
                  price: 280.00,
                  sortOrder: 0,
                  tags: { create: [{ name: 'Vegan Option' }] }
                },
                {
                  name: 'Fluffy Pancakes',
                  description: 'Stacked with fresh berries and maple syrup.',
                  price: 240.00,
                  sortOrder: 1
                }
              ]
            }
          }
        ]
      }
    }
  });

    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    // await stopLocalPostgresServer();
  }
}

main()
  .catch((e) => {
    process.exit(1);
  });
