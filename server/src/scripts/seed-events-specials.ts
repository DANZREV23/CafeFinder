import '../loadEnv.js';
import { prisma, connectWithRetry } from '../config/database.js';
import { EventType, SpecialType, TimeSensitiveStatus } from '@prisma/client';

async function main() {
  console.log('Seeding Cafe Events, Specials, and Announcements...');
  await connectWithRetry();

  // Get first admin or user to be creator
  let user = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!user) {
    user = await prisma.user.findFirst();
  }

  if (!user) {
    console.error('No user found to associate events with!');
    return;
  }

  // Get published cafes
  const cafes = await prisma.cafe.findMany({
    where: { status: 'PUBLISHED' },
    take: 8,
  });

  if (cafes.length === 0) {
    console.error('No published cafes found to seed events for!');
    return;
  }

  console.log(`Found ${cafes.length} published cafes.`);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Define realistic event data
  const sampleEvents = [
    {
      title: 'Artisan Pour-Over & Cupping Masterclass',
      slug: 'artisan-pour-over-cupping-masterclass',
      shortDescription: 'Taste single origins from Benguet and Sagada, learn grind extraction profiles with our lead roaster.',
      description: 'Join us for an immersive 2-hour coffee cupping session exploring Philippine highland specialty coffees. We will sample 6 unique micro-lots from Benguet, Sagada, and Bukidnon, accompanied by brewing demonstrations with V60, Origami, and Aeropress. All participants take home a 150g bag of freshly roasted beans.',
      eventType: EventType.TASTING,
      daysFromNowStart: 2,
      durationHours: 2.5,
      price: 650,
      isFeatured: true,
      coverPhotoUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Latte Art Throwdown & Community Jam',
      slug: 'latte-art-throwdown-community-jam',
      shortDescription: 'Local baristas and coffee enthusiasts go head-to-head. Free admission with audience voting!',
      description: 'An exciting evening of milk frothing precision! Open bracket for local baristas and home brewers. Free drip coffee for the first 30 spectators. DJ sets, craft beers, and specialty espresso drinks served all night.',
      eventType: EventType.COMPETITION,
      daysFromNowStart: 4,
      durationHours: 3.5,
      price: 0,
      isFeatured: true,
      coverPhotoUrl: 'https://images.unsplash.com/photo-1534040385115-33dcb3acba5b?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Home Barista Espresso Dialing Workshop',
      slug: 'home-barista-espresso-dialing-workshop',
      shortDescription: 'Master grind sizing, puck preparation, channeling prevention, and milk steaming on manual machines.',
      description: 'Hands-on small-group workshop capped at 8 participants. Bring your own machine or practice on our commercial dual-boiler stations. We will troubleshoot bitterness, sourness, yield ratios, and latte art micro-foam texture.',
      eventType: EventType.WORKSHOP,
      daysFromNowStart: 6,
      durationHours: 3,
      price: 1200,
      isFeatured: false,
      coverPhotoUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Acoustic Sunset Sessions & Pour-Overs',
      slug: 'acoustic-sunset-sessions-pour-overs',
      shortDescription: 'Unplugged indie acoustics, cold brew mocktails, and relaxing evening garden vibes.',
      description: 'Wind down your weekend with soulful live acoustic performances from emerging indie artists. Enjoy signature iced cascara tonics, espresso martinis (non-alcoholic or craft), and freshly baked sourdough pastries on the patio.',
      eventType: EventType.LIVE_MUSIC,
      daysFromNowStart: 3,
      durationHours: 3,
      price: 250,
      isFeatured: true,
      coverPhotoUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Sunday Coffee & Book Lovers Circle',
      slug: 'sunday-coffee-book-lovers-circle',
      shortDescription: 'Monthly quiet reading meetup, book exchange, and discounted pour-overs for readers.',
      description: 'Bring whatever book you are currently reading or browse our community library shelves. 45 minutes of silent reading followed by gentle conversation and specialty brew discussions. 15% off all beverages for attendees.',
      eventType: EventType.COMMUNITY,
      daysFromNowStart: 5,
      durationHours: 2,
      price: 0,
      isFeatured: false,
      coverPhotoUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Local Ceramicist Pop-Up & Espresso Cup Sale',
      slug: 'local-ceramicist-popup-espresso-cups',
      shortDescription: 'Handmade ceramic demitasses, flat white tumblers, and pour-over drippers by local pottery studio.',
      description: 'Support local craftsmanship! Meet ceramicist studio artists and shop handcrafted ceramic drinkware designed specifically for coffee service. Each cup purchase includes a complimentary flat white or batch brew.',
      eventType: EventType.MEETUP,
      daysFromNowStart: 8,
      durationHours: 5,
      price: 0,
      isFeatured: true,
      coverPhotoUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80',
    },
  ];

  // Define realistic specials data
  const sampleSpecials = [
    {
      title: 'Cascara Honey Cold Brew & Butter Croissant Duo',
      slug: 'cascara-honey-cold-brew-croissant-duo',
      shortDescription: 'Our 16-hour cascara cold brew paired with an artisanal French butter croissant for only ₱210.',
      description: 'Refreshing naturally sweetened cascara tea cold brew with notes of dried cherry, rosehip, and orange peel, served alongside a flakey golden French butter croissant baked fresh every morning.',
      specialType: SpecialType.COMBO,
      daysFromNowEnd: 14,
      price: 210,
      discountPercent: 20,
      terms: 'Available daily from opening until 12:00 PM or until supplies last. Dine-in and take-out.',
      isFeatured: true,
      coverPhotoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Weekday Golden Hour: 20% Off All Espresso Drinks',
      slug: 'weekday-golden-hour-espresso-discount',
      shortDescription: 'Beat the afternoon slump! Enjoy 20% off all hot and iced espresso beverages between 2PM and 5PM.',
      description: 'Whether you prefer a velvety Spanish Latte, double Cortado, or refreshing Iced Americano, enjoy our weekday happy hour promotion Monday through Friday.',
      specialType: SpecialType.HAPPY_HOUR,
      daysFromNowEnd: 30,
      discountPercent: 20,
      terms: 'Mondays to Fridays only, 2:00 PM – 5:00 PM. Cannot be combined with loyalty voucher redemption.',
      isFeatured: true,
      coverPhotoUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Seasonal Roasted Chestnut & Sea Salt Latte',
      slug: 'seasonal-roasted-chestnut-sea-salt-latte',
      shortDescription: 'Warm nutty chestnut reduction infused with double espresso and topped with sea salt cream foam.',
      description: 'Our autumn/winter seasonal signature drink. House-made sweet roasted chestnut purée steamed with silky whole milk or oat milk, pulled with a rich dark roast double shot, and finished with Maldon sea salt flakes.',
      specialType: SpecialType.SEASONAL,
      daysFromNowEnd: 21,
      price: 195,
      terms: 'Available hot or iced. Oat milk upgrade available for +₱35.',
      isFeatured: true,
      coverPhotoUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Single Origin Flight: 3 Washed Process Coffees',
      slug: 'single-origin-flight-washed-process',
      shortDescription: 'Tasting board of 3 distinct pour-overs (60ml each) side-by-side with flavor wheel tasting cards.',
      description: 'Experience terroir like never before. Compare three distinct high-altitude regions: Ethiopia Guji, Colombia Huila, and Benguet Atok. Served with sparkling water palate cleanser and detailed tasting profile cards.',
      specialType: SpecialType.LIMITED_TIME,
      daysFromNowEnd: 18,
      price: 280,
      discountPercent: 15,
      terms: 'Available exclusively for dine-in bar seating.',
      isFeatured: true,
      coverPhotoUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Weekend Bring-Your-Own-Tumbler Zero-Waste Perk',
      slug: 'weekend-byo-tumbler-eco-perk',
      shortDescription: 'Get ₱30 discount on any large drink whenever you bring your reusable travel mug or cup.',
      description: 'Join our sustainability initiative! Help reduce single-use paper cups and plastic lids. Hand over your clean reusable tumbler and our baristas will fill it up with your favorite specialty concoction.',
      specialType: SpecialType.DISCOUNT,
      daysFromNowEnd: 45,
      discountPercent: 15,
      terms: 'Applicable to clean tumblers of minimum 12oz capacity.',
      isFeatured: false,
      coverPhotoUrl: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Matcha cascara Fizz & Ube Basque Cheesecake Slice',
      slug: 'matcha-cascara-ube-cheesecake-slice',
      shortDescription: 'Uji ceremonial grade matcha shaken with effervescent cascara tonic, paired with creamy ube basque slice.',
      description: 'The ultimate afternoon sweet treat. Creamy, caramelized Basque cheesecake infused with real purple yam halaya, paired with a vibrant, refreshing green-and-amber layered sparkling matcha cascara.',
      specialType: SpecialType.COMBO,
      daysFromNowEnd: 25,
      price: 290,
      discountPercent: 18,
      terms: 'Daily after 1:00 PM. While slices last.',
      isFeatured: true,
      coverPhotoUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    },
  ];

  // Insert events
  for (let i = 0; i < sampleEvents.length; i++) {
    const ev = sampleEvents[i];
    const cafe = cafes[i % cafes.length];

    const startAt = new Date(today.getTime() + ev.daysFromNowStart * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000); // 10:00 AM
    const endAt = new Date(startAt.getTime() + ev.durationHours * 60 * 60 * 1000);

    // Upsert or create
    await prisma.cafeEvent.upsert({
      where: {
        cafeId_slug: {
          cafeId: cafe.id,
          slug: ev.slug,
        },
      },
      update: {
        title: ev.title,
        shortDescription: ev.shortDescription,
        description: ev.description,
        eventType: ev.eventType,
        status: TimeSensitiveStatus.PUBLISHED,
        startAt,
        endAt,
        price: ev.price,
        coverPhotoUrl: ev.coverPhotoUrl,
        isFeatured: ev.isFeatured,
        publishedAt: now,
      },
      create: {
        cafeId: cafe.id,
        title: ev.title,
        slug: ev.slug,
        shortDescription: ev.shortDescription,
        description: ev.description,
        eventType: ev.eventType,
        status: TimeSensitiveStatus.PUBLISHED,
        startAt,
        endAt,
        price: ev.price,
        coverPhotoUrl: ev.coverPhotoUrl,
        isFeatured: ev.isFeatured,
        createdById: user.id,
        publishedAt: now,
      },
    });

    console.log(`Created/updated event "${ev.title}" for cafe ${cafe.name}`);
  }

  // Insert specials
  for (let i = 0; i < sampleSpecials.length; i++) {
    const sp = sampleSpecials[i];
    const cafe = cafes[i % cafes.length];

    const startAt = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000); // Started yesterday
    const endAt = new Date(today.getTime() + sp.daysFromNowEnd * 24 * 60 * 60 * 1000);

    await prisma.cafeSpecial.upsert({
      where: {
        cafeId_slug: {
          cafeId: cafe.id,
          slug: sp.slug,
        },
      },
      update: {
        title: sp.title,
        shortDescription: sp.shortDescription,
        description: sp.description,
        specialType: sp.specialType,
        status: TimeSensitiveStatus.PUBLISHED,
        startAt,
        endAt,
        price: sp.price,
        discountPercent: sp.discountPercent,
        terms: sp.terms,
        coverPhotoUrl: sp.coverPhotoUrl,
        isFeatured: sp.isFeatured,
        publishedAt: now,
      },
      create: {
        cafeId: cafe.id,
        title: sp.title,
        slug: sp.slug,
        shortDescription: sp.shortDescription,
        description: sp.description,
        specialType: sp.specialType,
        status: TimeSensitiveStatus.PUBLISHED,
        startAt,
        endAt,
        price: sp.price,
        discountPercent: sp.discountPercent,
        terms: sp.terms,
        coverPhotoUrl: sp.coverPhotoUrl,
        isFeatured: sp.isFeatured,
        createdById: user.id,
        publishedAt: now,
      },
    });

    console.log(`Created/updated special "${sp.title}" for cafe ${cafe.name}`);
  }

  // Also add 2 announcements
  const announcementCafes = cafes.slice(0, 2);
  for (let i = 0; i < announcementCafes.length; i++) {
    const cafe = announcementCafes[i];
    await prisma.cafeAnnouncement.upsert({
      where: {
        cafeId_slug: {
          cafeId: cafe.id,
          slug: `holiday-hours-and-origins-${i}`,
        },
      },
      update: {
        title: 'New Crop Mt. Apo Microlots Arrived',
        content: 'We just received 5 bags of anaerobic natural Catimor from Davao del Sur. Available on manual pour-over bar all week while quantities last!',
        status: TimeSensitiveStatus.PUBLISHED,
        publishedAt: now,
      },
      create: {
        cafeId: cafe.id,
        title: 'New Crop Mt. Apo Microlots Arrived',
        slug: `holiday-hours-and-origins-${i}`,
        content: 'We just received 5 bags of anaerobic natural Catimor from Davao del Sur. Available on manual pour-over bar all week while quantities last!',
        status: TimeSensitiveStatus.PUBLISHED,
        createdById: user.id,
        publishedAt: now,
      },
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
