export interface PublicCafeSummaryDto {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  priceRange?: number | null;
  rating?: number | null;
  reviewCount?: number;
  isFeatured?: boolean;
  isTrending?: boolean;
  isVerified?: boolean;
  coverImage?: string | null;
  photos?: any[];
  amenities?: any[];
  [key: string]: any;
}

export function mapToPublicCafeSummary(cafe: any): PublicCafeSummaryDto {
  if (!cafe) return {} as any;
  const coverPhoto = cafe.photos?.find((p: any) => p.isCover) || cafe.photos?.[0];
  return {
    id: cafe.id,
    name: cafe.name,
    slug: cafe.slug,
    description: cafe.description,
    address: cafe.address,
    city: cafe.city,
    state: cafe.state,
    zipCode: cafe.zipCode,
    latitude: cafe.latitude,
    longitude: cafe.longitude,
    priceRange: cafe.priceRange,
    rating: cafe.rating,
    reviewCount: cafe.reviewCount ?? 0,
    isFeatured: cafe.isFeatured ?? false,
    isTrending: cafe.isTrending ?? false,
    isVerified: cafe.isVerified ?? false,
    coverImage: coverPhoto?.url || cafe.coverImage || null,
    photos: cafe.photos || [],
    amenities: cafe.amenities || [],
    status: cafe.status,
    phone: cafe.phone,
    website: cafe.website,
    instagram: cafe.instagram,
    facebook: cafe.facebook,
    createdAt: cafe.createdAt,
    updatedAt: cafe.updatedAt,
  };
}

export function mapToPublicCafeProfile(cafe: any) {
  if (!cafe) return null;
  return {
    ...mapToPublicCafeSummary(cafe),
    hours: cafe.hours || [],
    reviews: cafe.reviews || [],
    menu: cafe.menu || [],
    claim: cafe.claim || null,
    isClaimed: !!cafe.ownerId,
    events: cafe.events || [],
    specials: cafe.specials || [],
    announcements: cafe.announcements || [],
  };
}
