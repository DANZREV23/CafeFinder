export interface Amenity {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export interface CafePhoto {
  id: string;
  url: string;
  isCover: boolean;
  altText?: string;
}

export interface CafeHours {
  id: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface CafeReviewPhoto {
  id: string;
  url: string;
  caption?: string;
}

export interface CafeReview {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
  coffeeRating?: number;
  ambianceRating?: number;
  serviceRating?: number;
  overallRating: number;
  comment?: string;
  createdAt: string;
  photos?: CafeReviewPhoto[];
}

export interface Cafe {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description?: string;
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  priceRange: number;
  ratingAverage: number;
  reviewCount: number;
  featured: boolean;
  trending: boolean;
  verified: boolean;
  photos: CafePhoto[];
  hours?: CafeHours[];
  amenities?: { amenity: Amenity }[];
  website?: string;
  phone?: string;
  email?: string;
  instagram?: string;
  facebook?: string;
  reviews?: CafeReview[];
  relatedCafes?: Cafe[];
  isFavorite?: boolean;
}

export interface CuratedList {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  featured: boolean;
  cafes?: CuratedListCafe[];
  _count: {
    cafes: number;
  };
}

export interface CuratedListCafe {
  listId: string;
  cafeId: string;
  sortOrder: number;
  cafe: Cafe;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string | null;
  avatarUrl: string | null;
  content: string;
  rating: number;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  publishedAt: string | null;
  author: {
    name: string;
    avatarUrl: string | null;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type Role = 'USER' | 'OWNER' | 'ADMIN';

export type CafeSubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface CafeSubmission {
  id: string;
  submittedById: string;
  cafeId: string | null;
  name: string;
  shortDescription: string;
  description: string;
  address: string;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  priceRange: number | null;
  status: CafeSubmissionStatus;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  photos: {
    id: string;
    url: string;
    caption: string | null;
  }[];
  amenities: {
    id: string;
    name: string;
  }[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: {
    message: string;
    details?: any;
  };
}
