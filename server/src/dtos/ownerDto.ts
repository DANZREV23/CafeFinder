export interface OwnerCafeSummaryDto {
  id: string;
  name: string;
  slug: string;
  city: string;
  address: string;
  status: string;
  verified: boolean;
  ratingAverage: number;
  reviewCount: number;
  coverImage: string | null;
  favoriteCount: number;
  photoCount: number;
}

export interface OwnerDashboardDto {
  isAdministrativeAccess: boolean;
  claimedCafes: number;
  pendingClaims: number;
  publishedCafes: number;
  totalReviews: number;
  pendingChangeRequests: number;
  averageRating: number;
}

export interface OwnerReviewDto {
  id: string;
  overallRating: number;
  coffeeRating: number | null;
  ambianceRating: number | null;
  serviceRating: number | null;
  comment: string | null;
  createdAt: Date;
  reviewer: { name: string; avatarUrl: string | null };
  photos: { id: string; url: string; caption: string | null }[];
}

export interface OwnerChangeRequestDto {
  id: string;
  cafeId: string;
  cafeName: string;
  type: string;
  status: string;
  payload: unknown;
  reason: string | null;
  adminNotes: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
}
