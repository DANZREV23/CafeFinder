import { prisma } from '../config/database.js';
import { NotificationService } from './notificationService.js';
import { FollowService } from './followService.js';
import { TimeSensitiveStatus } from '@prisma/client';

export class PromotionService {
  private notificationService = new NotificationService();
  private followService = new FollowService();

  async publishEvent(eventId: string) {
    const event = await prisma.cafeEvent.findUnique({
      where: { id: eventId },
      include: { cafe: true }
    });

    if (!event || event.status === TimeSensitiveStatus.PUBLISHED) return event;

    const publishedEvent = await prisma.cafeEvent.update({
      where: { id: eventId },
      data: { status: TimeSensitiveStatus.PUBLISHED, publishedAt: new Date() }
    });

    // Notify followers
    const followers = await this.followService.getCafeFollowers(event.cafeId, 'events');
    
    for (const follower of followers) {
      await this.notificationService.createNotification(follower.userId, {
        title: `New Event at ${event.cafe.name}`,
        message: `${event.title} is happening on ${event.startAt.toLocaleDateString()}. Don't miss it!`,
        type: 'CAFE_EVENT'
      });
    }

    return publishedEvent;
  }

  async publishSpecial(specialId: string) {
    const special = await prisma.cafeSpecial.findUnique({
      where: { id: specialId },
      include: { cafe: true }
    });

    if (!special || special.status === TimeSensitiveStatus.PUBLISHED) return special;

    const publishedSpecial = await prisma.cafeSpecial.update({
      where: { id: specialId },
      data: { status: TimeSensitiveStatus.PUBLISHED, publishedAt: new Date() }
    });

    // Notify followers
    const followers = await this.followService.getCafeFollowers(special.cafeId, 'specials');
    
    for (const follower of followers) {
      await this.notificationService.createNotification(follower.userId, {
        title: `New Special at ${special.cafe.name}`,
        message: `Enjoy ${special.title}! ${special.shortDescription || ''}`,
        type: 'CAFE_SPECIAL'
      });
    }

    return publishedSpecial;
  }

  async publishAnnouncement(announcementId: string) {
    const announcement = await prisma.cafeAnnouncement.findUnique({
      where: { id: announcementId },
      include: { cafe: true }
    });

    if (!announcement || announcement.status === TimeSensitiveStatus.PUBLISHED) return announcement;

    const publishedAnnouncement = await prisma.cafeAnnouncement.update({
      where: { id: announcementId },
      data: { status: TimeSensitiveStatus.PUBLISHED, publishedAt: new Date() }
    });

    // Notify followers
    const followers = await this.followService.getCafeFollowers(announcement.cafeId, 'announcements');
    
    for (const follower of followers) {
      await this.notificationService.createNotification(follower.userId, {
        title: `Announcement from ${announcement.cafe.name}`,
        message: announcement.title,
        type: 'CAFE_ANNOUNCEMENT'
      });
    }

    return publishedAnnouncement;
  }
  
  async notifyMenuUpdate(cafeId: string, menuName: string) {
    const cafe = await prisma.cafe.findUnique({ where: { id: cafeId } });
    if (!cafe) return;

    const followers = await this.followService.getCafeFollowers(cafeId, 'menu');
    
    for (const follower of followers) {
      await this.notificationService.createNotification(follower.userId, {
        title: `Menu Update at ${cafe.name}`,
        message: `${cafe.name} has updated their menu: ${menuName}`,
        type: 'MENU_UPDATE'
      });
    }
  }
}
