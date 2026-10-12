import { mapToPublicCafeSummary } from './cafeDto.js';

export function mapToFollowDto(follow: any) {
  return {
    id: follow.id,
    createdAt: follow.createdAt,
    updatedAt: follow.updatedAt,
    preferences: {
      eventsEnabled: follow.eventsEnabled,
      specialsEnabled: follow.specialsEnabled,
      announcementsEnabled: follow.announcementsEnabled,
      menuUpdatesEnabled: follow.menuUpdatesEnabled,
    },
    cafe: follow.cafe ? mapToPublicCafeSummary(follow.cafe) : undefined,
  };
}
