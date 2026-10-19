export * from './system.js';

export type Role = 'USER' | 'OWNER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED';
export type CafeStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN';
export type CafeSubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status?: UserStatus;
  avatarUrl?: string | null;
  bio?: string | null;
  isProfilePublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: any;
  pagination?: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: Pagination;
  message?: string;
  error?: any;
}

export interface Amenity {
  id: string;
  name: string;
  slug?: string;
  category?: string;
  icon?: string;
  active?: boolean;
  amenityId?: string;
  amenity?: Amenity;
}

export interface CafePhoto {
  id: string;
  url: string;
  caption?: string | null;
  altText?: string | null;
  isCover?: boolean;
}

export interface Cafe {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  zipCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  priceRange?: number | string | null;
  rating?: number | null;
  reviewCount?: number;
  isFeatured?: boolean;
  isTrending?: boolean;
  isVerified?: boolean;
  coverImage?: string | null;
  photos?: CafePhoto[];
  amenities?: Array<any>;
  status?: CafeStatus | string;
  phone?: string | null;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  ownerId?: string | null;
  distance?: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface CafeReview {
  id: string;
  cafeId: string;
  userId: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  content?: string | null;
  visitDate?: string | null;
  helpfulCount?: number;
  photos?: Array<{ id: string; url: string; caption?: string }>;
  user?: User;
  cafe?: Cafe;
  response?: any;
  status?: ReviewStatus | string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  coverImage?: string | null;
  coverImageAlt?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  category?: string | null;
  readingTime?: string | number | null;
  authorId?: string;
  author?: User;
  status: PostStatus;
  publishedAt?: string | null;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export interface BlogListResponse {
  success?: boolean;
  data: {
    posts: BlogPost[];
    pagination: Pagination;
  };
  posts?: BlogPost[];
  pagination?: Pagination;
  [key: string]: any;
}

export interface CuratedListCafe {
  id: string;
  listId: string;
  cafeId: string;
  notes?: string | null;
  editorialNote?: string | null;
  order: number;
  sortOrder?: number;
  cafe: Cafe;
  [key: string]: any;
}

export interface CuratedList {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  coverImage?: string | null;
  coverImageAlt?: string | null;
  status: PostStatus;
  curatorId?: string;
  curator?: User;
  featured?: boolean;
  sortOrder?: number;
  scheduledAt?: string | null;
  cafes?: CuratedListCafe[];
  _count?: { cafes: number };
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export interface CuratedListsResponse {
  success?: boolean;
  data: {
    lists: CuratedList[];
    pagination: Pagination;
  };
  lists?: CuratedList[];
  pagination?: Pagination;
  [key: string]: any;
}

export interface CafeSubmission {
  id: string;
  name: string;
  submittedById: string;
  submittedBy?: User;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  rejectionReason?: string | null;
  address: string;
  city: string;
  state?: string | null;
  postalCode?: string | null;
  description?: string | null;
  photos?: Array<{ id: string; url: string }>;
  amenities?: Array<{ id: string; name: string }>;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export interface Testimonial {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string | null;
  content: string;
  rating?: number;
  featured?: boolean;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  createdAt: string;
  [key: string]: any;
}

export interface ActivityLog {
  id: string;
  userId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  description?: string | null;
  user?: User | null;
  createdAt: string;
  [key: string]: any;
}

export interface AdminDashboardStats {
  totalCafes: number;
  pendingClaims: number;
  pendingSubmissions: number;
  totalUsers: number;
  totalReviews: number;
  activeLoyaltyPrograms?: number;
  [key: string]: any;
}

export interface RecommendationDiagnostics {
  totalAnalyzed: number;
  algorithmVersion: string;
  weights: Record<string, number>;
  metrics: Record<string, any>;
  latencyMs?: number;
  catalog?: any;
  simulation?: any;
  [key: string]: any;
}
