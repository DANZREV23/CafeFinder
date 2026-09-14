export interface ReviewerDto {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface ReviewPhotoDto {
  id: string;
  url: string;
  caption: string | null;
}

export interface ReviewDto {
  id: string;
  reviewer: ReviewerDto;
  coffeeRating: number;
  ambianceRating: number;
  serviceRating: number;
  overallRating: number;
  comment: string | null;
  status: string;
  photos: ReviewPhotoDto[];
  createdAt: Date;
  updatedAt: Date;
}

export const mapToReviewDto = (review: any): ReviewDto => {
  return {
    id: review.id,
    reviewer: {
      id: review.user.id,
      name: review.user.name,
      avatarUrl: review.user.avatarUrl,
    },
    coffeeRating: review.coffeeRating || 0,
    ambianceRating: review.ambianceRating || 0,
    serviceRating: review.serviceRating || 0,
    overallRating: review.overallRating,
    comment: review.comment,
    status: review.status,
    photos: review.photos.map((p: any) => ({
      id: p.id,
      url: p.url,
      caption: p.caption,
    })),
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
}
