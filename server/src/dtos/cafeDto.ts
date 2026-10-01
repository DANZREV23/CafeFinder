import { Cafe, CafePhoto, CafeHours, Amenity, CafeReview, User } from '@prisma/client';

export interface PublicCafeSummaryDto {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  address: string;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  priceRange: number | null;
  verified: boolean;
  featured: boolean;
  trending: boolean;
  ratingAverage: number;
  reviewCount: number;
  photos: { url: string; isCover: boolean }[];
  isFavorite: boolean;
}

export function mapToPublicCafeSummary(cafe: any): PublicCafeSummaryDto {
  return {
    id: cafe.id,
    name: cafe.name,
    slug: cafe.slug,
    shortDescription: cafe.shortDescription,
    address: cafe.address,
    city: cafe.city,
    state: cafe.state,
    latitude: cafe.latitude ? parseFloat(cafe.latitude.toString()) : null,
    longitude: cafe.longitude ? parseFloat(cafe.longitude.toString()) : null,
    priceRange: cafe.priceRange,
    verified: cafe.verified,
    featured: cafe.featured,
    trending: cafe.trending,
    ratingAverage: parseFloat(cafe.ratingAverage.toString()),
    reviewCount: cafe.reviewCount,
    photos: cafe.photos ? cafe.photos.map((p: any) => ({
      url: p.url,
      isCover: p.isCover,
    })) : [],
    isFavorite: cafe.favorites ? cafe.favorites.length > 0 : false,
  };
}

export interface PublicCafeProfileDto {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  priceRange: number | null;
  verified: boolean;
  featured: boolean;
  trending: boolean;
  ratingAverage: number;
  reviewCount: number;
  photos: Partial<CafePhoto>[];
  hours: Partial<CafeHours>[];
  amenities: { amenity: Partial<Amenity> }[];
  reviews: {
    id: string;
    overallRating: number;
    coffeeRating: number | null;
    ambianceRating: number | null;
    serviceRating: number | null;
    comment: string | null;
    createdAt: Date;
    user: {
      name: string;
      avatarUrl: string | null;
    };
    photos: { url: string }[];
  }[];
  relatedCafes: any[];
  isFavorite: boolean;
  claimStatus: 'AVAILABLE' | 'PENDING' | 'MANAGED' | 'OWNED';
}

export function mapToPublicCafeProfile(cafe: any): PublicCafeProfileDto {
  return {
    id: cafe.id,
    name: cafe.name,
    slug: cafe.slug,
    shortDescription: cafe.shortDescription,
    description: cafe.description,
    address: cafe.address,
    city: cafe.city,
    state: cafe.state,
    country: cafe.country,
    postalCode: cafe.postalCode,
    latitude: cafe.latitude ? parseFloat(cafe.latitude.toString()) : null,
    longitude: cafe.longitude ? parseFloat(cafe.longitude.toString()) : null,
    phone: cafe.phone,
    email: cafe.email,
    website: cafe.website,
    instagram: cafe.instagram,
    facebook: cafe.facebook,
    priceRange: cafe.priceRange,
    verified: cafe.verified,
    featured: cafe.featured,
    trending: cafe.trending,
    ratingAverage: parseFloat(cafe.ratingAverage.toString()),
    reviewCount: cafe.reviewCount,
    photos: cafe.photos.map((p: any) => ({
      id: p.id,
      url: p.url,
      isCover: p.isCover,
      caption: p.caption,
      altText: p.altText,
    })),
    hours: cafe.hours.map((h: any) => ({
      dayOfWeek: h.dayOfWeek,
      openTime: h.openTime,
      closeTime: h.closeTime,
      isClosed: h.isClosed,
    })),
    amenities: cafe.amenities.map((a: any) => ({
      amenity: {
        id: a.amenity.id,
        name: a.amenity.name,
        slug: a.amenity.slug,
        icon: a.amenity.icon,
      }
    })),
    reviews: cafe.reviews.map((r: any) => ({
      id: r.id,
      overallRating: r.overallRating,
      coffeeRating: r.coffeeRating,
      ambianceRating: r.ambianceRating,
      serviceRating: r.serviceRating,
      comment: r.comment,
      createdAt: r.createdAt,
      user: {
        name: r.user.name,
        avatarUrl: r.user.avatarUrl,
      },
      photos: r.photos.map((ph: any) => ({ url: ph.url })),
    })),
    relatedCafes: (cafe.relatedCafes || []).map((rc: any) => ({
      id: rc.id,
      name: rc.name,
      slug: rc.slug,
      city: rc.city,
      ratingAverage: parseFloat(rc.ratingAverage.toString()),
      reviewCount: rc.reviewCount,
      priceRange: rc.priceRange,
      photos: rc.photos,
      similarityScore: rc.similarityScore,
      similarityReasons: rc.similarityReasons,
      recommendationReason: rc.recommendationReason || (rc.similarityReasons ? rc.similarityReasons[0] : undefined),
    })),
    isFavorite: cafe.favorites ? cafe.favorites.length > 0 : false,
    claimStatus: cafe.claimStatus || 'AVAILABLE',
  };
}
