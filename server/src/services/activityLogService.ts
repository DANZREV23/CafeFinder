import { ActivityLogRepository, ActivityLogFilters } from '../repositories/activityLogRepository.js';

export class ActivityLogService {
  private activityLogRepository: ActivityLogRepository;

  constructor() {
    this.activityLogRepository = new ActivityLogRepository();
  }

  async getLogs(filters: ActivityLogFilters) {
    const { data, total } = await this.activityLogRepository.findAll(filters);
    
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async logAction(data: {
    userId?: string;
    action: string;
    entityType?: string;
    entityId?: string;
    description?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.activityLogRepository.create(data);
  }
}
