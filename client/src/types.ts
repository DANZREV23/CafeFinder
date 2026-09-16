export interface Amenity {
  id: string;
  name: string;
  label: string;
  slug: string;
  icon: string;
}

export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface ListResponse<T> {
  success?: boolean;
  data?: {
    lists?: T[];
    posts?: T[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  lists?: T[];
  posts?: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CafePhoto {
  id: string;
  url: string;
  isCover: boolean;
  altText?: string;
  caption?: string | null;
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
    email?: string;
    avatarUrl?: string | null;
  };
  reviewer?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  cafe?: Cafe;
  coffeeRating?: number;
  ambianceRating?: number;
  serviceRating?: number;
  overallRating: number;
  comment?: string;
  status?: ReviewStatus;
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
  status?: CafeStatus;
  photos: CafePhoto[];
  hours?: CafeHours[];
  amenities?: { amenity: Amenity; amenityId?: string }[];
  website?: string;
  phone?: string;
  email?: string;
  instagram?: string;
  facebook?: string;
  reviews?: CafeReview[];
  relatedCafes?: Cafe[];
  curatedLists?: { list: CuratedList }[];
  isFavorite?: boolean;
  claimStatus?: 'AVAILABLE' | 'PENDING' | 'MANAGED' | 'OWNED';
  coffeeType?: string;
}

export interface CuratedList {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  coverImageAlt?: string | null;
  featured: boolean;
  status?: PostStatus;
  sortOrder?: number;
  cafes?: CuratedListCafe[];
  _count: {
    cafes: number;
  };
}

export interface CuratedListCafe {
  listId: string;
  cafeId: string;
  sortOrder: number;
  editorialNote?: string | null;
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
  coverImageAlt?: string | null;
  publishedAt: string | null;
  status: PostStatus;
  category?: string | null;
  readingTime?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
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
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type CafeStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'SUSPENDED' | 'ARCHIVED';
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN';
export type CafeSubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface AdminDashboardStats {
  pendingCafeSubmissions: number;
  pendingReviews: number;
  publishedCafes: number;
  rejectedSubmissions: number;
  totalUsers: number;
}

export interface ActivityLog {
  id: string;
  userId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  description: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null;
}

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
  submittedBy?: {
    id: string;
    name: string;
    email: string;
  };
  photos: {
    id: string;
    url: string;
    caption: string | null;
  }[];
  amenities: {
    amenity: Amenity;
  }[] | {
    id: string;
    name: string;
  }[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  avatarUrl?: string | null;
  createdAt: string;
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
