export type Role = 'USER' | 'OWNER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type CafeStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'SUSPENDED' | 'ARCHIVED';
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN';
export type CafeSubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  isProfilePublic?: boolean;
  role: Role;
  status: UserStatus;
  createdAt?: string;
}

export interface Amenity {
  id: string;
  name: string;
  label: string;
  slug?: string;
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
  caption?: string | null;
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

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Cafe {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
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
  verified?: boolean;
  coffeeType?: string;
  status: string | CafeStatus;
  ownerId?: string | null;
  owner?: {
    id: string;
    name: string;
    email: string;
  } | null;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  metaTitle?: string;
  metaDescription?: string;
  photos?: CafePhoto[];
  amenities?: CafeAmenity[];
  hours?: CafeHours[];
  curatedLists?: Array<{ list: { id: string; title: string; slug: string; coverImage?: string } }>;
  reviews?: Review[];
  relatedCafes?: Cafe[];
  isFavorite?: boolean;
  claimStatus?: 'AVAILABLE' | 'PENDING' | 'MANAGED' | 'OWNED';
  recommendationReason?: string;
  matchScore?: number;
  matchReasons?: string[];
  matchBadges?: Array<{ type: string; label: string }>;
  similarityScore?: number;
  similarityReasons?: string[];
}

export interface UserPreference {
  id?: string;
  userId?: string;
  preferredCity?: string | null;
  preferredPriceRange?: number | null;
  preferredAmenities: string[];
  preferredCoffeeTypes: string[];
  preferredVibes: string[];
  isConfigured?: boolean;
  updatedAt?: string;
}

export interface RecommendationDiagnostics {
  status: string;
  engine: string;
  latencyMs: number;
  metrics: {
    totalUsers: number;
    usersWithPreferences: number;
    preferenceCoveragePercent: number;
    totalFavorites: number;
    totalReviews: number;
    totalViews: number;
    totalCafes: number;
    publishedCafes: number;
  };
  catalog: {
    amenitiesCount: number;
    topAmenities: Array<{ name: string; cafeCount: number }>;
  };
  scoringWeights: Record<string, number>;
  privacyCompliance: {
    isSensitiveDataUsed: boolean;
    sensitiveCategoriesAudited: string[];
    dataRetention: string;
    profilingType: string;
    explainabilityCoverage: string;
  };
  simulation: {
    testedUserId: string;
    recommendationsCount: number;
    results: any[];
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: Pagination;
  error?: {
    message: string;
    details?: any;
  };
}

export interface BlogListResponse extends ApiResponse<{
  posts: BlogPost[];
  pagination: Pagination;
}> {}

export interface CuratedListsResponse extends ApiResponse<{
  lists: CuratedList[];
  pagination: Pagination;
}> {}

export interface ListResponse<T> extends ApiResponse<T[]> {
  pagination: Pagination;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: Pagination;
}

export type PostStatus = 'DRAFT' | 'PENDING_REVIEW' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';

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
  excerpt?: string | null;
  content: string;
  coverImage?: string | null;
  coverImageAlt?: string | null;
  category?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  author: Author;
  status: PostStatus;
  scheduledAt?: string;
  publishedAt?: string | null;
  readingTime?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CuratedList {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  coverImage?: string | null;
  coverImageAlt?: string | null;
  featured: boolean;
  status: PostStatus;
  scheduledAt?: string;
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
  editorialNote?: string | null;
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
  reviewer?: Reviewer;
  user?: Reviewer; // Backwards compatibility for some components
  userId?: string;
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
  status: ReviewStatus;
  photos: ReviewPhoto[];
  createdAt: string;
  updatedAt?: string;
}

export type CafeReview = Review;

export interface Testimonial {
  id: string;
  name: string;
  role?: string | null;
  avatarUrl?: string | null;
  content: string;
  rating: number;
  status: string;
  createdAt: string;
}

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
