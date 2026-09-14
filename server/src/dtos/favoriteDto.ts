import { mapToPublicCafeSummary, PublicCafeSummaryDto } from './cafeDto.js';

export interface FavoriteDto {
  id: string;
  createdAt: Date;
  cafe: PublicCafeSummaryDto;
}

export function mapToFavoriteDto(favorite: any): FavoriteDto {
  return {
    id: favorite.id,
    createdAt: favorite.createdAt,
    cafe: mapToPublicCafeSummary(favorite.cafe),
  };
}
