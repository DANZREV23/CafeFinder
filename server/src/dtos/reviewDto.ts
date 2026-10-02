export interface ReviewerDto {
  id: string;
  name: string;
  avatarUrl: string | null;
  isProfilePublic?: boolean;
}

export interface ReviewPhotoDto {
  id: string;
  url: string;
  caption: string | null;
  status?: string;
  createdAt?: Date;
}

export interface ReviewResponseDto {
  id: string;
  reviewId: string;
  ownerId: string;
  ownerName: string;
  content: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewDto {
  id: string;
  cafeId: string;
  cafeName?: string;
  cafeSlug?: string;
  reviewer: ReviewerDto;
  coffeeRating: number;
  ambianceRating: number;
  serviceRating: number;
  overallRating: number;
  comment: string | null;
  status: string;
  helpfulCount: number;
  isHelpful?: boolean;
  response?: ReviewResponseDto | null;
  photos: ReviewPhotoDto[];
  createdAt: Date;
  updatedAt: Date;
}

export const mapToReviewDto = (review: any, currentUserId?: string | null): ReviewDto => {
  // Publicly, show photos that are APPROVED or all photos if author/admin
  const photos = (review.photos || [])
    .filter((p: any) => !p.status || p.status === 'APPROVED' || (currentUserId && review.userId === currentUserId))
    .map((p: any) => ({
      id: p.id,
      url: p.url,
      caption: p.caption,
      status: p.status,
      createdAt: p.createdAt,
    }));

  let isHelpful = false;
  if (currentUserId && review.helpfulReactions) {
    isHelpful = review.helpfulReactions.some((r: any) => r.userId === currentUserId);
  }

  let responseDto: ReviewResponseDto | null = null;
  if (review.response && (review.response.status === 'APPROVED' || (currentUserId && currentUserId === review.response.ownerId))) {
    responseDto = {
      id: review.response.id,
      reviewId: review.response.reviewId,
      ownerId: review.response.ownerId,
      ownerName: review.response.owner?.name || 'Cafe Owner',
      content: review.response.content,
      status: review.response.status,
      createdAt: review.response.createdAt,
      updatedAt: review.response.updatedAt,
    };
  }

  return {
    id: review.id,
    cafeId: review.cafeId,
    cafeName: review.cafe?.name,
    cafeSlug: review.cafe?.slug,
    reviewer: {
      id: review.user.id,
      name: review.user.name,
      avatarUrl: review.user.avatarUrl,
      isProfilePublic: review.user.isProfilePublic,
    },
    coffeeRating: review.coffeeRating || 0,
    ambianceRating: review.ambianceRating || 0,
    serviceRating: review.serviceRating || 0,
    overallRating: review.overallRating,
    comment: review.comment,
    status: review.status,
    helpfulCount: review.helpfulCount || 0,
    isHelpful,
    response: responseDto,
    photos,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
};

export interface CafeRatingStatsDto {
  ratingAverage: number;
  reviewCount: number;
  coffeeAverage: number;
  ambianceAverage: number;
  serviceAverage: number;
  distribution: Record<number, number>;
  photoCount: number;
}

export interface ReviewReportDto {
  id: string;
  reviewId: string;
  reporterId: string;
  reporterName?: string;
  reason: string;
  description: string | null;
  status: string;
  createdAt: Date;
  resolvedAt: Date | null;
  resolvedByName?: string | null;
  actionTaken: string | null;
  resolutionNotes: string | null;
  reviewPreview?: {
    id: string;
    cafeName?: string;
    reviewerName?: string;
    overallRating: number;
    comment: string | null;
    status: string;
  };
}
