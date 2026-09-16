export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'USER' | 'OWNER' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface Amenity {
  id: string;
  name: string;
  label: string;
  icon?: string;
}

export interface CafeAmenity {
  cafeId: string;
  amenityId: string;
  amenity: Amenity;
}

export interface CafePhoto {
  id: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  altText?: string;
  isCover: boolean;
}

export interface CafeHours {
  id: string;
  dayOfWeek: number;
  isClosed: boolean;
  openTime?: string;
  closeTime?: string;
}

export interface Cafe {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  priceRange: number;
  ratingAverage: number;
  reviewCount: number;
  featured: boolean;
  trending: boolean;
  verified?: boolean;
  coffeeType?: string;
  status: string;
  metaTitle?: string;
  metaDescription?: string;
  photos?: CafePhoto[];
  amenities?: CafeAmenity[];
  hours?: CafeHours[];
  curatedLists?: Array<{ list: { id: string; title: string; slug: string; coverImage?: string } }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    message: string;
  };
}

export interface ListResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface Author {
  id: string;
  name: string;
  avatarUrl?: string | null;
  email?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  coverImageAlt?: string;
  category?: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  author: Author;
  status: PostStatus;
  publishedAt?: string;
  readingTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CuratedList {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverImage?: string;
  coverImageAlt?: string;
  featured: boolean;
  status: PostStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  cafes?: CuratedListCafe[];
  _count?: {
    cafes: number;
  };
}

export interface CuratedListCafe {
  listId: string;
  cafeId: string;
  sortOrder: number;
  editorialNote?: string;
  cafe: Cafe;
}

export interface Reviewer {
  id: string;
  name: string;
  avatarUrl: string | null;
  email?: string;
}

export interface ReviewPhoto {
  id: string;
  url: string;
  caption: string | null;
}

export interface Review {
  id: string;
  reviewer: Reviewer;
  user?: Reviewer; // Backwards compatibility for some components
  cafeId: string;
  cafe?: {
    id: string;
    name: string;
    slug: string;
  };
  coffeeRating: number;
  ambianceRating: number;
  serviceRating: number;
  overallRating: number;
  comment: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN';
  photos: ReviewPhoto[];
  createdAt: string;
  updatedAt: string;
}

export type CafeReview = Review;

export interface Testimonial {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string;
  content: string;
  rating: number;
  status: string;
  createdAt: string;
}
